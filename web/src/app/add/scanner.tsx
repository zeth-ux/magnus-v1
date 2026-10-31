"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeIsbn } from "@/lib/books/isbn";

/**
 * Reads a book's barcode with the phone camera (ZXing, loaded only when you
 * open the scanner). Only book barcodes (EAN-13 with a valid ISBN) count;
 * anything else keeps scanning. Calls onDetected once, then stops the camera.
 */
export function Scanner({ onDetected, onClose }: { onDetected: (isbn: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const done = useRef(false);
  // Keep the latest callback without restarting the camera when it changes.
  const detected = useRef(onDetected);
  useEffect(() => {
    detected.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        if (cancelled || !video.current) return;
        const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]]]);
        const reader = new BrowserMultiFormatReader(hints);
        const controls = await reader.decodeFromConstraints({ video: { facingMode: "environment" } }, video.current, (result) => {
          if (!result || done.current) return;
          const isbn = normalizeIsbn(result.getText());
          if (!isbn) return; // a price or product barcode: keep looking
          done.current = true;
          controls.stop();
          detected.current(isbn);
        });
        stop = () => controls.stop();
        if (cancelled) stop();
      } catch {
        setProblem("Couldn't open the camera. Allow camera access, or type the ISBN instead.");
      }
    })();
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-[10px] bg-paper/10 p-4">
      <video ref={video} className="aspect-[4/3] w-full rounded-lg bg-black object-cover" muted playsInline aria-label="Camera preview" />
      <p aria-live="polite" className="text-[15px] text-paper/80">
        {problem ?? "Point the camera at the barcode on the back cover."}
      </p>
      <button type="button" onClick={onClose} className="self-start text-[15px] font-semibold underline underline-offset-4">
        Close the camera
      </button>
    </div>
  );
}
