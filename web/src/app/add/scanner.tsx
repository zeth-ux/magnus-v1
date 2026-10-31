"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reads a book's barcode with the phone camera (ZXing, loaded only when you
 * open the scanner). Calls onDetected once with the digits, then stops.
 */
export function Scanner({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled || !video.current) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          video.current,
          (result) => {
            if (!result || done.current) return;
            const text = result.getText();
            if (/^\d{10,13}$|^\d{9}X$/i.test(text)) {
              done.current = true;
              controls.stop();
              onDetected(text);
            }
          },
        );
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
  }, [onDetected]);

  return (
    <div className="flex flex-col gap-3 rounded-[10px] bg-paper/10 p-4">
      <video ref={video} className="aspect-[4/3] w-full rounded-lg bg-black object-cover" muted playsInline aria-label="Camera preview" />
      <p className="text-[15px] text-paper/80">
        {problem ?? "Point the camera at the barcode on the back cover."}
      </p>
      <button type="button" onClick={onClose} className="self-start text-[15px] font-semibold underline underline-offset-4">
        Close the camera
      </button>
    </div>
  );
}
