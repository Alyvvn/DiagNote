// Client-side crypto helpers for optional audio encryption

export async function fetchServerPublicKeyPEM(): Promise<string> {
  const res = await fetch("/api/crypto/public-key");
  if (!res.ok) throw new Error("Failed to fetch server public key");
  return await res.text();
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");
  const raw = atob(b64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);
  return buffer.buffer;
}

export async function importServerPublicKey(pem: string): Promise<CryptoKey> {
  const spki = pemToArrayBuffer(pem);
  return crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
}

export async function generateAesKey(length: 128 | 192 | 256 = 256): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length }, true, ["encrypt"]);
}

export function randomIv(len = 12): Uint8Array {
  const iv = new Uint8Array(len);
  crypto.getRandomValues(iv);
  return iv;
}

export async function encryptBlobAesGcm(blob: Blob, key: CryptoKey) {
  const iv = randomIv(12);
  const arrBuf = await blob.arrayBuffer();
  // Ensure iv is provided as ArrayBuffer to satisfy BufferSource type
  const ivBuf = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer;
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: ivBuf }, key, arrBuf);
  const cipher = new Uint8Array(encrypted);
  return { iv, cipher };
}

export async function exportRawKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  return raw;
}

export async function rsaEncrypt(publicKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  // Copy into a standalone ArrayBuffer (not SharedArrayBuffer / not a view)
  const buf = new ArrayBuffer(data.byteLength);
  new Uint8Array(buf).set(data);
  const encBuf = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, buf as ArrayBuffer);
  return new Uint8Array(encBuf);
}

export function toB64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const arr = new Uint8Array(await blob.arrayBuffer());
  return toB64(arr);
}
