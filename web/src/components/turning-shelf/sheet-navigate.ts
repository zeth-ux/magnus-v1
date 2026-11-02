"use client";

import { gsap, MOTION_OK } from "@/lib/gsap";

/**
 * Grow a blank sheet of paper out of `from` (a turned-out cover) until it
 * fills the screen, then call `go` (usually a router.push). The new page
 * arrives on the same paper. The sheet removes itself after `go`, or after a
 * few seconds if navigation never finishes. Reduced motion: just `go`.
 */
export function growSheetThen(from: HTMLElement, go: () => void) {
  if (!window.matchMedia(MOTION_OK).matches) return go();
  const r = from.getBoundingClientRect();
  const W = window.innerWidth;
  const H = window.innerHeight;
  const sheet = document.createElement("div");
  sheet.setAttribute("aria-hidden", "true");
  sheet.style.cssText = "position:fixed;inset:0;z-index:300;background:var(--color-paper);pointer-events:none";
  document.body.appendChild(sheet);
  gsap.set(sheet, { transformOrigin: `${r.left + r.width / 2}px ${r.top + r.height / 2}px` });
  const remove = () => sheet.remove();
  gsap.fromTo(
    sheet,
    { clipPath: `inset(${r.top}px ${W - r.right}px ${H - r.bottom}px ${r.left}px round 3px)`, rotation: -4.5 },
    {
      clipPath: "inset(0px 0px 0px 0px round 0px)",
      rotation: 0,
      duration: 0.9,
      ease: "sheet",
      onComplete: () => {
        go();
        // The next page paints under the sheet; lift it off once it has.
        window.setTimeout(remove, 4000);
        requestAnimationFrame(() => requestAnimationFrame(() => (sheet.dataset.ready = "1")));
      },
    },
  );
  return remove;
}
