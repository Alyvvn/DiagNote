import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateKeyPairSync, privateDecrypt } from "crypto";
import multer from "multer";
import rateLimit from "express-rate-limit";

// Multipart upload (50MB limit) – voice encounter recordings are short (<5MB typical)
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

// Basic IP rate limiting (window 1h, 200 requests) – adjust after usage metrics
const sttLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.STT_RATE_LIMIT_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory RSA keypair for optional client-side encryption (demo/dev only)
let RSA_KEYS: { publicPEM: string; privatePEM: string } | null = null;
function ensureRsaKeys() {
  if (!RSA_KEYS) {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    RSA_KEYS = { publicPEM: publicKey, privatePEM: privateKey };
  }
  return RSA_KEYS;
}

function b64ToBuffer(b64: string): Buffer {
  return Buffer.from(b64, "base64");
}

async function decryptAesGcmPayload(payload: {
  encryptedKeyB64: string;
  ivB64: string;
  ciphertextB64: string;
}): Promise<Buffer> {
  const { privatePEM } = ensureRsaKeys();
  const encryptedKey = b64ToBuffer(payload.encryptedKeyB64);
  const iv = b64ToBuffer(payload.ivB64);
  const ciphertext = b64ToBuffer(payload.ciphertextB64);

  // Decrypt AES key via RSA-OAEP
  const aesKeyRaw = privateDecrypt(
    {
      key: privatePEM,
      padding: (require("crypto") as typeof import("crypto")).constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedKey,
  );

  // Decrypt AES-GCM with WebCrypto via subtle API is not available on Node easily without extra libs.
  // Use Node's crypto module for AES-256-GCM decryption instead.
  const crypto = require("crypto") as typeof import("crypto");
  // Key length can be 16 or 32 bytes depending on client use; infer algorithm
  const keyLen = aesKeyRaw.length;
  const algo = keyLen === 16 ? "aes-128-gcm" : keyLen === 24 ? "aes-192-gcm" : "aes-256-gcm";
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const encData = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv(algo, aesKeyRaw, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encData), decipher.final()]);
  return decrypted;
}

async function forwardToElevenLabsMultipart(file: Buffer, filename: string, mimeType: string, opts: { language_code?: string; model_id?: string }): Promise<{ transcript: string; provider: string; words?: any[] }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const endpoint = process.env.ELEVENLABS_STT_URL || "https://api.elevenlabs.io/v1/speech-to-text";
  const modelId = opts.model_id || process.env.ELEVENLABS_MODEL_ID || "scribe_v1";

  if (!apiKey) {
    throw Object.assign(new Error("Missing ELEVENLABS_API_KEY"), { code: "CONFIG" });
  }

  const form = new FormData();
  // Node 18+ supports Blob & FormData globally
  // Cast Buffer to acceptable BlobPart for TS (runtime OK in Node 18+)
  form.append("file", new Blob([file as any], { type: mimeType }), filename);
  form.append("model_id", modelId);
  form.append("enable_logging", "false");
  if (opts.language_code) form.append("language_code", opts.language_code);

  const start = Date.now();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });
  const durationMs = Date.now() - start;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(JSON.stringify({
      event: "stt_error",
      provider: "elevenlabs",
      status: res.status,
      durationMs,
      bytes: file.length,
      error: text.slice(0, 500),
    }));
    throw Object.assign(new Error(`ElevenLabs STT failed (${res.status})`), { status: 502, code: "UPSTREAM" });
  }
  const data: any = await res.json();
  const transcript = data.text || data.transcript || data.result || "";
  console.log(JSON.stringify({
    event: "stt_success",
    provider: "elevenlabs",
    status: res.status,
    durationMs,
    bytes: file.length,
    model: modelId,
    language_code: opts.language_code || null,
  }));
  return { transcript, provider: "elevenlabs", words: data.words || undefined };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Public key for client-side encryption (PEM spki). Ephemeral for this process.
  app.get("/api/crypto/public-key", (_req: Request, res: Response) => {
    const { publicPEM } = ensureRsaKeys();
    res.type("text/plain").send(publicPEM);
  });

  // New multipart Speech-to-Text endpoint (Phase 1 – unencrypted transport via TLS)
  app.post("/api/stt/transcribe", sttLimiter, upload.single("file"), async (req: Request, res: Response) => {
    try {
      const file = (req as any).file as any;
      if (!file) {
        return res.status(400).json({ code: "VALIDATION", message: "Missing 'file' multipart field" });
      }
      const mime = file.mimetype;
      const allow = ["audio/webm", "audio/wav", "audio/mpeg", "audio/ogg", "audio/x-wav"]; // extend as needed
      if (!allow.includes(mime)) {
        return res.status(400).json({ code: "VALIDATION", message: `Unsupported mime type: ${mime}` });
      }
      const { language_code, model_id } = req.body as { language_code?: string; model_id?: string };

      // Missing key logic with optional mock mode
      if (!process.env.ELEVENLABS_API_KEY) {
        if (process.env.USE_MOCK_STT === "1") {
          return res.json({
            transcript: "This is a mock transcript for testing configuration.",
            provider: "mock",
            mocked: true,
          });
        }
        return res.status(500).json({ code: "CONFIG", message: "Missing ELEVENLABS_API_KEY. Set it in server .env" });
      }

      const result = await forwardToElevenLabsMultipart(file.buffer, file.originalname || "audio.webm", mime, { language_code, model_id });
      res.json({ transcript: result.transcript, words: result.words, provider: result.provider });
    } catch (err: any) {
      const status = err?.status || 500;
      const code = err?.code || (status === 429 ? "RATE_LIMIT" : err?.status === 502 ? "UPSTREAM" : "UNKNOWN");
      res.status(status).json({ code, message: err?.message || "Transcription failed" });
    }
  });

  // Streaming Text-to-Speech endpoint: returns chunked audio for immediate playback
  app.post("/api/tts/stream", express.json({ limit: "1mb" }), async (req: Request, res: Response) => {
    try {
      const { text, voice_id, model_id } = (req.body || {}) as { text?: string; voice_id?: string; model_id?: string };
      if (!text || !text.trim()) {
        return res.status(400).json({ code: "VALIDATION", message: "Missing text" });
      }
      
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ code: "CONFIG", message: "Missing ELEVENLABS_API_KEY" });
      }
      
      // Smart sentence chunking for natural speech
      const chunkBySentences = (text: string, maxChunkSize: number = 150) => {
        const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
        const chunks: string[] = [];
        let currentChunk = "";
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? " " : "") + sentence;
          }
        }
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        return chunks;
      };
      
      const chunks = chunkBySentences(text);
      const vid = voice_id || process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
      
      // Process all chunks and return array of audio URLs
      const audioChunks = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(vid)}?optimize_streaming_latency=4`;
        
        const body = {
          text: chunk,
          model_id: model_id || "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.6,
            style: 0.0,
            use_speaker_boost: false
          }
        };
        
        const r = await fetch(ttsUrl, {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
          },
          body: JSON.stringify(body),
        });
        
        if (!r.ok) {
          console.error(`TTS chunk ${i} failed:`, r.status);
          continue;
        }
        
        const audio = Buffer.from(await r.arrayBuffer());
        const audioBase64 = audio.toString('base64');
        audioChunks.push({
          index: i,
          audio: `data:audio/mpeg;base64,${audioBase64}`,
          text: chunk
        });
      }
      
      res.json({ chunks: audioChunks });
    } catch (err: any) {
      console.error("Streaming TTS error:", err);
      res.status(500).json({ code: "UNKNOWN", message: err?.message || "Streaming TTS error" });
    }
  });

  // Text-to-Speech endpoint: returns audio/mpeg generated by ElevenLabs
  app.post("/api/tts/speak", express.json({ limit: "1mb" }), async (req: Request, res: Response) => {
    try {
      const { text, voice_id, model_id } = (req.body || {}) as { text?: string; voice_id?: string; model_id?: string };
      if (!text || !text.trim()) {
        return res.status(400).json({ code: "VALIDATION", message: "Missing text" });
      }
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ code: "CONFIG", message: "Missing ELEVENLABS_API_KEY" });
      }
      // Resolve a voice id: prefer request body, then env, else use default voice to avoid API lookup delay
      let vid = voice_id || process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB"; // Default to Adam voice
      if (!vid.match(/^[a-zA-Z0-9_-]+$/)) {
        return res.status(400).json({ code: "VALIDATION", message: "Invalid voice_id format" });
      }
      const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(vid)}?optimize_streaming_latency=4`;  // Enable streaming optimization
      // Optimize for much faster TTS: aggressive chunking and summarization
      const maxChunkLength = 800; // Much smaller chunks for faster processing
      let textToSpeak = text;
      
      if (text.length > maxChunkLength) {
        // Smart extraction for SOAP notes - get key clinical points
        if (text.includes('SUBJECTIVE:') || text.includes('OBJECTIVE:') || text.includes('ASSESSMENT:')) {
          // Extract key points from SOAP sections
          const sections = text.split(/(?:SUBJECTIVE:|OBJECTIVE:|ASSESSMENT:|PLAN:)/i);
          const keyPoints = [];
          
          // Get chief complaint from subjective
          const subjective = sections[1]?.substring(0, 200).trim();
          if (subjective) keyPoints.push(`Patient: ${subjective.split('.')[0]}.`);
          
          // Get vital signs from objective
          const objective = sections[2]?.substring(0, 200).trim();
          const vitalsMatch = objective?.match(/(?:vitals?|BP|HR|temp|temperature)[^.]*[.\n]/i);
          if (vitalsMatch) keyPoints.push(`Vitals: ${vitalsMatch[0].trim()}`);
          
          // Get diagnosis from assessment
          const assessment = sections[3]?.substring(0, 300).trim();
          if (assessment) keyPoints.push(`Assessment: ${assessment.split('.')[0]}.`);
          
          textToSpeak = keyPoints.length > 0 ? keyPoints.join(' ') : text.substring(0, maxChunkLength);
        } else {
          // For non-SOAP text, extract first few sentences
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const keyPoints = sentences.slice(0, 3).map(s => s.trim()).join('. ');
          textToSpeak = keyPoints.length > 0 ? keyPoints + '.' : text.substring(0, maxChunkLength);
        }
        
        // Final safety check
        if (textToSpeak.length > maxChunkLength) {
          textToSpeak = textToSpeak.substring(0, maxChunkLength) + "...";
        }
      }
      
      const body = {
        text: textToSpeak,
        model_id: model_id || process.env.ELEVENLABS_TTS_MODEL_ID || "eleven_turbo_v2_5", // Fastest model
        voice_settings: {
          stability: 0.4,   // Lower for speed
          similarity_boost: 0.6, // Lower for speed
          style: 0.0,
          use_speaker_boost: false // Disable for speed
        }
      } as any;
      const start = Date.now();
      const r = await fetch(ttsUrl, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify(body),
      });
      const durationMs = Date.now() - start;
      if (!r.ok) {
        const errTxt = await r.text().catch(() => "");
        console.error(JSON.stringify({ event: "tts_error", status: r.status, durationMs, error: errTxt.slice(0, 500) }));
        return res.status(502).json({ code: "UPSTREAM", message: `TTS failed (${r.status})` });
      }
      const audio = Buffer.from(await r.arrayBuffer());
      console.log(JSON.stringify({ event: "tts_success", status: r.status, durationMs, bytes: audio.length }));
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", String(audio.length));
      res.send(audio);
    } catch (err: any) {
      const status = err?.status || 500;
      res.status(status).json({ code: "UNKNOWN", message: err?.message || "TTS error" });
    }
  });

  // List available ElevenLabs voices for the current API key
  app.get("/api/tts/voices", async (_req: Request, res: Response) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) return res.status(500).json({ code: "CONFIG", message: "Missing ELEVENLABS_API_KEY" });
      const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": apiKey } });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        return res.status(502).json({ code: "UPSTREAM", message: `Voices fetch failed (${r.status})`, detail: txt.slice(0, 200) });
      }
      const data = await r.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ code: "UNKNOWN", message: err?.message || "Voices error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
