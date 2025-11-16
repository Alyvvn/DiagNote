import { useEffect, useRef, useState } from "react";

// Vanta is browser-only. Use dynamic imports to avoid SSR issues.
export default function VantaBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const vantaRef = useRef<any>(null);
  const [isFading, setIsFading] = useState(false);

  // Read current theme based on documentElement class
  const getIsDark = () => document.documentElement.classList.contains("dark");

  const getColors = () => {
    if (getIsDark()) {
      return { color1: 0x092929, color2: 0x1f3760 };
    }
    return { color1: 0xf6f9f9, color2: 0xb0c9f4 };
  };

  useEffect(() => {
    let disposed = false;

    (async () => {
      const [{ default: CELLS }, THREE] = await Promise.all([
        import("vanta/dist/vanta.cells.min"),
        import("three"),
      ]);

      if (!containerRef.current || disposed) return;

      const { color1, color2 } = getColors();

      vantaRef.current = CELLS({
        el: containerRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        color1,
        color2,
      });

      // Observe theme changes via class mutation on <html>
      const observer = new MutationObserver(() => {
        // Fade out, swap colors, fade in
        setIsFading(true);
        const apply = () => {
          const { color1, color2 } = getColors();
          try {
            vantaRef.current?.setOptions?.({ color1, color2 });
          } catch {}
          // small delay to ensure canvas repaints before fade-in
          setTimeout(() => setIsFading(false), 150);
        };
        // match CSS transition timing below
        setTimeout(apply, 150);
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => {
        observer.disconnect();
      };
    })();

    return () => {
      disposed = true;
      try {
        vantaRef.current?.destroy?.();
      } catch {}
      vantaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={[
        "fixed inset-0 -z-10 pointer-events-none",
        "transition-opacity duration-300",
        isFading ? "opacity-0" : "opacity-100",
      ].join(" ")}
    />
  );
}
