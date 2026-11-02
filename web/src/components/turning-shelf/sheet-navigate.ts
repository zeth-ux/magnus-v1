"use client";

import { gsap, MOTION_OK } from "@/lib/gsap";

/**
 * Grow a blank sheet of paper out of `from` (a turned-out cover) until it
 * fills the screen, then call `go` (usually a router.push). The new page
 * arrives on the same paper.
 *
 * Returns `cancel`: it stops the grow (so `go` never runs if the reader went
 * somewhere else meanwhile) and removes the sheet. The caller cancels when its
 * page goes away; failing that, the sheet removes itself 4 s after `go`.
 * Reduced motion: just `go`.
 */
export function growSheetThen(from: HTMLElement, go: () => void): () => void {
  if (!window.matchMedia(MOTION_OK).matches) {
    go();
    return () => {};
  }
  const r = from.getBoundingClientRect();
  const W = window.innerWidth;
  const H = window.innerHeight;
  const sheet = document.createElement("div");
  sheet.setAttribute("aria-hidden", "true");
  sheet.style.cssText = "position:fixed;inset:0;z-index:300;background:var(--color-paper);pointer-events:none";
  document.body.appendChild(sheet);
  gsap.set(sheet, { transformOrigin: `${r.left + r.width / 2}px ${r.top + r.height / 2}px` });

  let timer = 0;
  const tween = gsap.fromTo(
    sheet,
    { clipPath: `inset(${r.top}px ${W - r.right}px ${H - r.bottom}px ${r.left}px round 3px)`, rotation: -4.5 },
    {
      clipPath: "inset(0px 0px 0px 0px round 0px)",
      rotation: 0,
      duration: 0.9,
      ease: "sheet",
      onComplete: () => {
        // Set the safety timer first, so a failing `go` can't leave the sheet up.
        timer = window.setTimeout(cancel, 4000);
        go();
      },
    },
  );
  function cancel() {
    tween.kill();
    window.clearTimeout(timer);
    sheet.remove();
  }
  return cancel;
}
