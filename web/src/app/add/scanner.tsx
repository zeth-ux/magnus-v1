"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeIsbn } from "@/lib/books/isbn";

type Status = "starting" | "scanning" | "found" | "error";

/** The browser's own barcode reader (Chrome on Android, some desktops). Not in TypeScript's DOM types yet. */
type NativeDetector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type NativeDetectorClass = {
  new (opts: { formats: string[] }): NativeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

/** How often to try to read a frame (ms). Fast enough to feel instant, light enough for older phones. */
const EVERY = 180;

/**
 * Reads a book's barcode with the phone camera. Only book barcodes (EAN-13
 * with a valid ISBN) count; anything else (a price add-on, a product code)
 * keeps scanning. Calls onDetected once, then turns the camera off.
 *
 * We open the camera ourselves and read frames in a simple loop, so every
 * failure has a clear message and nothing waits forever on a library's
 * internal events (the old version did, and on some phones never started).
 * The browser's own BarcodeDetector is used where it exists; otherwise ZXing
 * (loaded only now) reads a crop of the middle of the frame, where the guide
 * box asks you to hold the barcode, which is faster and more reliable than
 * the whole picture.
 */
export function Scanner({ onDetected, onClose }: { onDetected: (isbn: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("starting");
  const [problem, setProblem] = useState<string | null>(null);
  const [torch, setTorch] = useState<{ on: boolean; toggle: () => void } | null>(null);
  const detected = useRef(onDetected);
  useEffect(() => {
    detected.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    const stop = () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };

    (async () => {
      const el = video.current;
      if (!el) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setProblem("This browser can't use the camera here. Type the ISBN instead (it's above the barcode).");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
      } catch (e) {
        setStatus("error");
        const name = e instanceof DOMException ? e.name : "";
        setProblem(
          name === "NotAllowedError"
            ? "Camera access is blocked. Allow it in your browser's settings for this site, or type the ISBN instead."
            : name === "NotFoundError"
              ? "No camera found. Type the ISBN instead (it's above the barcode)."
              : name === "NotReadableError"
                ? "Another app is using the camera. Close it and try again, or type the ISBN."
                : "Couldn't open the camera. Type the ISBN instead (it's above the barcode).",
        );
        return;
      }
      if (stopped) return stop();
      el.srcObject = stream;
      el.setAttribute("playsinline", "true");
      await el.play().catch(() => undefined);

      // A torch button when the phone offers one (dim rooms, glossy covers).
      const track = stream.getVideoTracks()[0];
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
      if (caps.torch) {
        let on = false;
        const toggle = () => {
          on = !on;
          void track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }).catch(() => undefined);
          setTorch({ on, toggle });
        };
        setTorch({ on, toggle });
      }

      const read = await pickReader();
      if (stopped) return stop();
      setStatus("scanning");

      const tick = async () => {
        if (stopped) return;
        if (el.readyState >= 2 && el.videoWidth > 0) {
          for (const text of await read(el).catch(() => [] as string[])) {
            const isbn = normalizeIsbn(text);
            if (isbn && !stopped) {
              setStatus("found");
              navigator.vibrate?.(60);
              stop();
              detected.current(isbn);
              return;
            }
          }
        }
        timer = window.setTimeout(tick, EVERY);
      };
      void tick();
    })();

    return stop;
  }, []);

  return (
    <div className="flex flex-col gap-3 card p-3">
      <div className="relative overflow-hidden rounded-[2px] bg-ink">
        <video ref={video} className="aspect-[4/3] w-full object-cover" muted playsInline autoPlay aria-label="Camera preview" />
        {/* The guide: hold the barcode inside this box. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className={`scan-guide ${status === "found" ? "is-found" : ""}`} />
        </div>
      </div>
      <p aria-live="polite" className={`text-[15px] ${status === "error" ? "text-vermilion" : "text-ink/80"}`}>
        {problem ??
          (status === "starting"
            ? "Opening the camera…"
            : status === "found"
              ? "Got it. Looking up the book…"
              : "Hold the barcode on the back cover inside the box, about a hand's width away.")}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {torch ? (
          <button type="button" onClick={torch.toggle} aria-pressed={torch.on} className="btn-quiet !min-h-10">
            {torch.on ? "Light off" : "Light on"}
          </button>
        ) : null}
        <button type="button" onClick={onClose} className="text-[15px] font-semibold underline underline-offset-4">
          Close the camera
        </button>
      </div>
    </div>
  );
}

/** Returns a function that reads any barcodes in the current video frame. */
async function pickReader(): Promise<(el: HTMLVideoElement) => Promise<string[]>> {
  const Native = (globalThis as unknown as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
  if (Native) {
    try {
      const formats = (await Native.getSupportedFormats?.()) ?? [];
      if (formats.includes("ean_13")) {
        const detector = new Native({ formats: ["ean_13"] });
        return async (el) => (await detector.detect(el)).map((b) => b.rawValue);
      }
    } catch {
      // fall through to ZXing
    }
  }

  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import("@zxing/browser"),
    import("@zxing/library"),
  ]);
  const hints = new Map<number, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  const reader = new BrowserMultiFormatReader(hints);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return async (el) => {
    if (!ctx) return [];
    // The middle of the frame (the guide box), at most 1280 px wide.
    const w = el.videoWidth;
    const h = el.videoHeight;
    const cw = Math.round(w * 0.8);
    const ch = Math.round(h * 0.5);
    const scale = Math.min(1, 1280 / cw);
    canvas.width = Math.round(cw * scale);
    canvas.height = Math.round(ch * scale);
    ctx.drawImage(el, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, canvas.width, canvas.height);
    try {
      return [reader.decodeFromCanvas(canvas).getText()];
    } catch {
      return []; // nothing readable in this frame
    }
  };
}
