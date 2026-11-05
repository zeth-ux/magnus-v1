"use client";

import { useEffect, useRef, useState } from "react";
import type { DecodeHintType } from "@zxing/library";
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
  // Set when the reader has to tap to (re)start: play() was refused, or the camera stopped.
  const [tapToStart, setTapToStart] = useState<null | "play" | "restart">(null);
  // Bumped to open the camera again from scratch.
  const [run, setRun] = useState(0);
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
    const fail = (message: string) => {
      stop();
      setTorch(null);
      setStatus("error");
      setProblem(message);
    };

    (async () => {
      const el = video.current;
      if (!el) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        // Also what in-app browsers (KakaoTalk, Instagram) and plain-http pages show.
        return fail("This browser can't use the camera here. Open this page in Safari or Chrome, or type the ISBN (it's above the barcode).");
      }
      try {
        stream = await openCamera();
      } catch (e) {
        return fail(cameraErrorMessage(e));
      }
      if (stopped) return stop();

      try {
        el.muted = true;
        el.srcObject = stream;
        el.setAttribute("playsinline", "true");
        // Some phones refuse to play without a fresh tap (the permission prompt used up the first one).
        await el.play().catch(() => setTapToStart("play"));

        const track = stream.getVideoTracks()[0];
        if (!track) return fail("Couldn't open the camera. Type the ISBN instead (it's above the barcode).");
        // The picture freezes if the phone takes the camera back (another app, the tab hidden for long).
        track.addEventListener("ended", () => {
          if (stopped) return;
          stop();
          setTorch(null);
          setStatus("error");
          setProblem("The camera stopped.");
          setTapToStart("restart");
        });

        // A torch button when the phone offers one (dim rooms, glossy covers).
        const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        if (caps.torch) {
          let on = false;
          const toggle = () => {
            if (stopped) return;
            const want = !on;
            track
              .applyConstraints({ advanced: [{ torch: want } as MediaTrackConstraintSet] })
              .then(() => {
                on = want;
                setTorch({ on, toggle });
              })
              .catch(() => undefined);
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
          if (!stopped) timer = window.setTimeout(tick, EVERY);
        };
        void tick();
      } catch {
        // Most likely the barcode reader failed to load (offline, or a new version of the app went out).
        fail("Couldn't start the scanner. Check your connection and try again, or type the ISBN instead.");
      }
    })();

    return stop;
  }, [run]);

  function startTap() {
    if (tapToStart === "play") {
      setTapToStart(null);
      void video.current?.play().catch(() => setTapToStart("play"));
      return;
    }
    // Restart from scratch.
    setTapToStart(null);
    setProblem(null);
    setStatus("starting");
    setRun((n) => n + 1);
  }

  const error = status === "error";
  return (
    <div className="flex flex-col gap-3 card p-3">
      <div className="relative overflow-hidden rounded-[2px] bg-ink">
        <video ref={video} className="aspect-[4/3] w-full object-cover" muted playsInline autoPlay aria-label="Camera preview" />
        {/* The guide: hold the barcode inside this box. */}
        {error ? null : (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className={`scan-guide ${status === "found" ? "is-found" : ""}`} />
          </div>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-[15px] text-vermilion">
          {problem}
        </p>
      ) : (
        <p aria-live="polite" className="text-[15px] text-ink/80">
          {status === "starting"
            ? "Opening the camera…"
            : status === "found"
              ? "Got it. Looking up the book…"
              : "Hold the barcode on the back cover inside the box, about a hand's width away."}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {tapToStart ? (
          <button type="button" onClick={startTap} className="btn-primary !min-h-11">
            {tapToStart === "play" ? "Tap to start the camera" : "Start the camera again"}
          </button>
        ) : null}
        {torch ? (
          <button type="button" onClick={torch.toggle} aria-pressed={torch.on} className="btn-quiet !min-h-11">
            {torch.on ? "Light off" : "Light on"}
          </button>
        ) : null}
        <button type="button" onClick={onClose} className="min-h-11 px-1 text-[15px] font-semibold underline underline-offset-4">
          Close the camera
        </button>
      </div>
    </div>
  );
}

/**
 * The back camera, sharp enough for a barcode. `ideal` never fails a phone
 * that can't do 1080p (it gets the nearest size), but a few Android phones
 * refuse to start at high sizes, so try once more with no size asked for.
 */
async function openCamera(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    });
  } catch (e) {
    const name = errorName(e);
    if (name !== "NotReadableError" && name !== "AbortError" && name !== "OverconstrainedError") throw e;
    return navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "environment" } });
  }
}

/** Errors from getUserMedia aren't always DOMExceptions (Chrome's OverconstrainedError, old Safari), so read the name. */
function errorName(e: unknown): string {
  const name = (e as { name?: unknown } | null)?.name;
  return typeof name === "string" ? name : "";
}

function cameraErrorMessage(e: unknown): string {
  switch (errorName(e)) {
    case "NotAllowedError":
      return "Camera access is blocked. Allow it in your browser's settings for this site, or type the ISBN instead.";
    case "SecurityError":
      return "This page isn't allowed to use the camera. Open it in Safari or Chrome, or type the ISBN instead.";
    case "NotFoundError":
      return "No camera found. Type the ISBN instead (it's above the barcode).";
    case "NotReadableError":
      return "Another app is using the camera. Close it and try again, or type the ISBN.";
    default:
      return "Couldn't open the camera. Type the ISBN instead (it's above the barcode).";
  }
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
  const hints = new Map<DecodeHintType, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  const reader = new BrowserMultiFormatReader(hints);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return async (el) => {
    if (!ctx) return [];
    // The middle of the frame, at most 960 px wide (plenty for EAN-13, and quick on older phones).
    const w = el.videoWidth;
    const h = el.videoHeight;
    const cw = Math.round(w * 0.8);
    const ch = Math.round(h * 0.5);
    const scale = Math.min(1, 960 / cw);
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
