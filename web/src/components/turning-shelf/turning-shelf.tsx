"use client";

import { memo, useEffect, useId, useRef } from "react";
import type { ShelfCopy } from "@/content/shelf";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { activeIndex, bookHeight, bookX, copiesFor, dims, nearestTarget, openness, smoothstep, wrapRel, type Dims } from "./geometry";
import { PrintCover, PrintSpine } from "./print-art";

/**
 * The turning shelf (docs/landing.md). Books stand spine out; the one in the
 * middle turns in 3D to show its cover, leans a little and comes towards you.
 * Move along with the arrows, the keyboard, a drag or a sideways scroll, or
 * click a spine; click the open cover to open the book.
 *
 * React renders the books once; one GSAP ticker loop then writes transforms
 * straight to the DOM (no React state per frame). The caption and the tabs are
 * also updated directly, so nothing re-renders while the shelf moves.
 */

export type TurningShelfProps = {
  copies: ShelfCopy[];
  /** Name of the shelf for screen readers. */
  label: string;
  /** Opens the centred book. `cover` is its turned-out cover face (for the sheet animation). */
  onOpen: (copy: ShelfCopy, cover: HTMLElement) => void;
  /** Starting book (index into copies). */
  start?: number;
};

const SETTLED = 1e-4;

/** Caption lines for one book: title, author, then facts as boxed labels. */
function captionParts(copy: ShelfCopy) {
  const facts = copy.mode === "give" ? ["To give", copy.area] : ["To lend", ...(copy.lendFor ? [`Up to ${copy.lendFor}`] : []), copy.area];
  return { title: copy.title, author: copy.author, facts };
}

function fillCaption(line: HTMLElement, kind: "title" | "author" | "facts", copy: ShelfCopy) {
  const parts = captionParts(copy);
  const span = document.createElement("span");
  span.className = "ts-cap-item";
  if (kind === "facts") {
    for (const fact of parts.facts) {
      const box = document.createElement("span");
      box.className = "box lbl";
      box.textContent = fact;
      span.appendChild(box);
    }
  } else {
    span.textContent = parts[kind];
  }
  line.appendChild(span);
  return span;
}

/** The caption, rendered once for the first book; later books are swapped in directly. */
const Caption = memo(function Caption({ copy }: { copy: ShelfCopy }) {
  const p = captionParts(copy);
  return (
    <>
      <span className="ts-cap-line ts-cap-title font-display" data-line="title">
        <span className="ts-cap-item">{p.title}</span>
      </span>
      <span className="ts-cap-line ts-cap-author lbl text-cobalt" data-line="author">
        <span className="ts-cap-item">{p.author}</span>
      </span>
      <span className="ts-cap-line ts-cap-facts" data-line="facts">
        <span className="ts-cap-item">
          {p.facts.map((f) => (
            <span key={f} className="box lbl">
              {f}
            </span>
          ))}
        </span>
      </span>
    </>
  );
});

export function TurningShelf({ copies, label, onOpen, start = 0 }: TurningShelfProps) {
  const root = useRef<HTMLElement>(null);
  const helpId = `ts-help-${useId().replace(/:/g, "")}`;
  const n = copies.length;
  const reps = copiesFor(n);
  const total = n * reps;
  // Start in a middle copy so the shelf can move both ways without wrapping on screen.
  const startS = start + n * Math.floor(reps / 2);
  const gives = copies.findIndex((c) => c.mode === "give");
  const lends = copies.findIndex((c) => c.mode === "lend");
  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
  });

  useGSAP(
    (_ctx, contextSafe) => {
      const el = root.current;
      if (!el || n === 0 || !contextSafe) return;
      const stage = el.querySelector<HTMLElement>(".ts-stage")!;
      const books = Array.from(el.querySelectorAll<HTMLElement>(".ts-book"));
      const covers = books.map((b) => b.querySelector<HTMLElement>(".ts-cover")!);
      const probe = el.querySelector<HTMLElement>(".ts-probe")!;
      const ring = el.querySelector<HTMLElement>(".ts-open")!;
      const cursor = el.querySelector<HTMLElement>(".ts-cursor");
      const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>(".ts-tab"));
      const indicator = el.querySelector<HTMLElement>(".ts-tab-ink")!;
      const lines = Array.from(el.querySelectorAll<HTMLElement>(".ts-cap-line"));
      const live = el.querySelector<HTMLElement>(".ts-live")!;
      const heights = copies.map((c) => bookHeight(c.length));

      const mm = gsap.matchMedia();
      let still = true;
      mm.add({ motion: MOTION_OK, fine: "(pointer: fine)" }, (c) => {
        still = !c.conditions?.motion;
        el.dataset.fine = c.conditions?.fine ? "1" : "0";
      });

      let D: Dims = dims(400);
      let W = 0;
      let shelfY = 0; // the shelf's centre line (the stage origin), relative to the section
      const measure = () => {
        D = dims(probe.getBoundingClientRect().height || 400);
        W = el.clientWidth;
        stage.style.setProperty("--ws", `${D.ws}px`);
        stage.style.setProperty("--d", `${D.d}px`);
        stage.style.setProperty("--H", `${D.H}px`);
        const sr = stage.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        shelfY = sr.top - er.top;
        ring.style.left = `${W / 2 - D.d / 2 - 6}px`;
        ring.style.top = `${shelfY + D.H * 0.36}px`;
        dirty = true;
      };

      let s = startS;
      let T = startS;
      let active = activeIndex(s, n);
      let announced = active;
      let dirty = true;
      const lift = new Float32Array(total);
      const liftTarget = new Float32Array(total);
      let tiltX = 0;
      let tiltY = 0;
      let mx = -1;
      let my = -1;
      let pointerIn = false;
      let onCover = false;
      let dragging = false;
      let down: { x: number; T0: number; id: number } | null = null;
      let suppressClick = false;
      let wheelTimer = 0;
      // Read, not assumed: Next can hide this page and re-run setup while a book is open.
      let paused = el.dataset.paused === "1";

      // ---- tabs: the cobalt block sits under the active book's mode ----
      const setTabs = () => {
        const mode = copies[active].mode;
        tabs.forEach((t) => {
          const on = t.dataset.mode === mode;
          t.classList.toggle("is-on", on);
          t.setAttribute("aria-pressed", on ? "true" : "false");
          if (on) {
            indicator.style.width = `${t.offsetWidth}px`;
            indicator.style.transform = `translateX(${t.offsetLeft}px)`;
          }
        });
      };

      // ---- caption: the new line slides in through its mask, the old one out ----
      const swapCaption = (dir: number) => {
        const copy = copies[active];
        for (const line of lines) {
          const kind = line.dataset.line as "title" | "author" | "facts";
          const old = Array.from(line.querySelectorAll<HTMLElement>(".ts-cap-item:not([data-leaving])"));
          const fresh = fillCaption(line, kind, copy);
          if (still) {
            old.forEach((o) => o.remove());
            continue;
          }
          gsap.fromTo(fresh, { yPercent: dir * 105 }, { yPercent: 0, duration: 0.65, ease: "paper" });
          old.forEach((o) => {
            o.dataset.leaving = "1";
            gsap.to(o, { yPercent: -dir * 105, duration: 0.65, ease: "paper", onComplete: () => o.remove() });
          });
        }
      };

      const render = (dt: number) => {
        const k = still ? 1e3 : dragging ? 18 : 5.2;
        const prevS = s;
        s += (T - s) * (1 - Math.exp(-k * dt));
        if (Math.abs(T - s) < SETTLED) s = T;
        // Keep numbers small: shift both by whole loops.
        if (Math.abs(s) > total * 4) {
          const shift = Math.round(s / total) * total;
          s -= shift;
          T -= shift;
        }
        const nowActive = activeIndex(s, n);
        if (nowActive !== active) {
          active = nowActive;
          swapCaption(Math.sign(T - prevS) || 1);
          setTabs();
        }

        // Tell screen readers once the shelf has stopped on a book, not for every book it passes.
        if (s === T && announced !== active) {
          announced = active;
          announce();
        }

        // Tilt: the open cover leans towards the pointer like a card held in the hand.
        const cy = shelfY;
        const settled = Math.abs(T - s) < 0.3;
        onCover = pointerIn && !paused && settled && Math.abs(mx - W / 2) < 0.55 * D.d && Math.abs(my - cy) < 0.55 * D.H;
        const tyT = still || !pointerIn ? 0 : onCover ? ((mx - W / 2) / (0.55 * D.d)) * 9 : ((mx - W / 2) / W) * 5;
        const txT = still || !onCover ? 0 : (-(my - cy) / (D.H / 2)) * 6;
        const te = 1 - Math.exp(-7 * dt);
        const ntY = tiltY + (tyT - tiltY) * te;
        const ntX = tiltX + (txT - tiltX) * te;
        const le = still ? 1 : 1 - Math.exp(-12 * dt);
        let liftMoving = false;
        for (let v = 0; v < total; v++) {
          const nl = lift[v] + (liftTarget[v] - lift[v]) * le;
          if (Math.abs(nl - lift[v]) > SETTLED) liftMoving = true;
          lift[v] = Math.abs(nl - liftTarget[v]) < SETTLED ? liftTarget[v] : nl;
        }
        const moving = s !== prevS || Math.abs(ntY - tiltY) > 1e-3 || Math.abs(ntX - tiltX) > 1e-3 || liftMoving;
        tiltY = ntY;
        tiltX = ntX;

        if (cursor) {
          const state = paused ? "" : onCover ? "open" : cursor.dataset.over === "spine" ? "spine" : cursor.dataset.over === "btn" ? "btn" : "";
          if (cursor.dataset.state !== state) cursor.dataset.state = state;
        }
        if (!moving && !dirty) return;
        dirty = false;

        const { H, d } = D;
        const limit = W / 2 + 1.5 * d;
        for (let v = 0; v < total; v++) {
          const b = books[v];
          const r = wrapRel(v, s, total);
          const x = bookX(r, D);
          if (Math.abs(x) > limit) {
            if (b.style.visibility !== "hidden") b.style.visibility = "hidden";
            continue;
          }
          if (b.style.visibility === "hidden") b.style.visibility = "";
          const o = openness(r);
          const h = heights[v % n];
          const y = (H - h * H) / 2 - o * 0.025 * H - lift[v] * 0.045 * H;
          b.style.transform =
            `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${(o * 0.2 * H).toFixed(2)}px) ` +
            `rotateZ(${(-4.5 * o).toFixed(3)}deg) rotateX(${(tiltX * o).toFixed(3)}deg) rotateY(${(-90 * o + tiltY * o).toFixed(3)}deg)`;
          b.style.zIndex = String(Math.round(100 - Math.abs(r) * 4));
          b.style.setProperty("--o", o.toFixed(3));
        }
        const ringScale = paused ? 0 : smoothstep(Math.max(0, 1 - Math.abs(T - s) * 3));
        ring.style.transform = `translate(-50%, -50%) scale(${ringScale.toFixed(3)})`;
        ring.tabIndex = ringScale > 0.5 ? 0 : -1;
      };

      // ---- the loop (only while the shelf is on screen) ----
      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(el);
      const tick = (_t: number, deltaMs: number) => {
        if (!visible) return;
        render(Math.min(deltaMs, 50) / 1000);
      };
      // The caption is changed directly, so after a re-run (e.g. coming back to a
      // page Next kept alive) rebuild it for the book actually in front.
      for (const line of lines) {
        line.replaceChildren();
        fillCaption(line, line.dataset.line as "title" | "author" | "facts", copies[active]);
      }
      const announce = (speak = true) => {
        const c = copies[active];
        // Silent at setup, so a page load (or coming back to the page) doesn't announce a book.
        if (speak) live.textContent = `${c.title} by ${c.author}. ${captionParts(c).facts.join(", ")}.`;
        ring.setAttribute("aria-label", `Open ${c.title}`);
      };
      announce(false);
      measure();
      setTabs();
      render(0);
      gsap.ticker.add(tick);
      const ro = new ResizeObserver(() => {
        measure();
        setTabs();
      });
      ro.observe(el);

      // ---- inputs ----
      const step = (dir: number) => {
        T = Math.round(T) + dir;
      };
      const goTo = (i: number) => {
        T = nearestTarget(T, i, n);
      };
      const open = () => {
        if (paused) return;
        T = Math.round(T);
        s = T;
        dirty = true;
        render(0);
        const v = books.findIndex((_, i) => Math.abs(wrapRel(i, s, total)) < 0.5);
        onOpenRef.current(copies[active], covers[Math.max(0, v)]);
      };

      const onBookClick = contextSafe((e: MouseEvent) => {
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        const v = books.indexOf(e.currentTarget as HTMLElement);
        const r = wrapRel(v, s, total);
        if (Math.abs(r) < 0.5) open();
        else T = Math.round(T + r);
      });
      const enter = (v: number) => () => {
        if (Math.abs(wrapRel(v, s, total)) > 0.5) liftTarget[v] = 1;
        if (cursor) cursor.dataset.over = Math.abs(wrapRel(v, s, total)) > 0.5 ? "spine" : "";
      };
      const leave = (v: number) => () => {
        liftTarget[v] = 0;
        if (cursor) cursor.dataset.over = "";
      };
      const offs: (() => void)[] = [];
      books.forEach((b, v) => {
        const en = enter(v);
        const le = leave(v);
        b.addEventListener("click", onBookClick);
        b.addEventListener("pointerenter", en);
        b.addEventListener("pointerleave", le);
        offs.push(() => {
          b.removeEventListener("click", onBookClick);
          b.removeEventListener("pointerenter", en);
          b.removeEventListener("pointerleave", le);
        });
      });

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
        pointerIn = true;
        if (cursor) {
          gsap.to(cursor, { x: mx, y: my, duration: still ? 0 : 0.18, ease: "power3.out", overwrite: true });
        }
        if (down) {
          const dx = e.clientX - down.x;
          if (!dragging && Math.abs(dx) > 5) {
            dragging = true;
            stage.setPointerCapture(down.id);
          }
          if (dragging) T = down.T0 - dx / (D.ws + D.gap);
        }
      };
      const onDown = (e: PointerEvent) => {
        if (paused || e.button !== 0) return;
        down = { x: e.clientX, T0: T, id: e.pointerId };
      };
      const onUp = () => {
        if (dragging) {
          T = Math.round(T);
          suppressClick = true;
          setTimeout(() => (suppressClick = false), 0);
        }
        dragging = false;
        down = null;
      };
      const onLeave = () => {
        pointerIn = false;
      };
      const onWheel = (e: WheelEvent) => {
        // Sideways scrolling moves the shelf; up and down still scroll the page.
        const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
        if (paused || !sideways) return;
        e.preventDefault();
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        T += (delta / (D.ws + D.gap)) * 0.5;
        window.clearTimeout(wheelTimer);
        wheelTimer = window.setTimeout(() => (T = Math.round(T)), 160);
      };
      const onKey = (e: KeyboardEvent) => {
        if (paused) return;
        if (e.key === "ArrowRight") step(1);
        else if (e.key === "ArrowLeft") step(-1);
        else if ((e.key === "Enter" || e.key === " ") && e.target === el.querySelector(".ts-shelf")) open();
        else return;
        e.preventDefault();
      };
      const onBtnOver = (e: PointerEvent) => {
        if (!cursor) return;
        const t = e.target as HTMLElement;
        if (t.closest("button:not(.ts-book), a")) cursor.dataset.over = "btn";
        else if (!t.closest(".ts-book")) cursor.dataset.over = "";
      };

      stage.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerover", onBtnOver);
      el.addEventListener("pointerleave", onLeave);
      stage.addEventListener("wheel", onWheel, { passive: false });
      el.addEventListener("keydown", onKey);

      const prev = el.querySelector<HTMLButtonElement>(".ts-prev")!;
      const next = el.querySelector<HTMLButtonElement>(".ts-next")!;
      const onPrev = () => step(-1);
      const onNext = () => step(1);
      const onRing = () => open();
      prev.addEventListener("click", onPrev);
      next.addEventListener("click", onNext);
      ring.addEventListener("click", onRing);
      const tabOffs = tabs.map((t) => {
        const fn = () => goTo(Number(t.dataset.first));
        t.addEventListener("click", fn);
        return () => t.removeEventListener("click", fn);
      });

      // The parent pauses the shelf while a book is open (see data-paused).
      const mo = new MutationObserver(() => {
        paused = el.dataset.paused === "1";
        dirty = true;
      });
      mo.observe(el, { attributes: true, attributeFilter: ["data-paused"] });

      return () => {
        gsap.ticker.remove(tick);
        io.disconnect();
        ro.disconnect();
        mo.disconnect();
        mm.revert();
        offs.forEach((f) => f());
        tabOffs.forEach((f) => f());
        stage.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerover", onBtnOver);
        el.removeEventListener("pointerleave", onLeave);
        stage.removeEventListener("wheel", onWheel);
        el.removeEventListener("keydown", onKey);
        prev.removeEventListener("click", onPrev);
        next.removeEventListener("click", onNext);
        ring.removeEventListener("click", onRing);
        window.clearTimeout(wheelTimer);
      };
    },
    { scope: root, dependencies: [copies], revertOnUpdate: true },
  );

  if (n === 0) return null;
  const first = copies[((start % n) + n) % n];

  return (
    <section ref={root} className="turning-shelf">
      <span className="ts-probe" aria-hidden="true" />

      <div className="ts-tabs" role="group" aria-label="Jump to books to give or to lend">
        <span className="ts-tab-ink" aria-hidden="true" />
        {gives >= 0 ? (
          <button type="button" className="ts-tab lbl" data-mode="give" data-first={gives} aria-pressed={first.mode === "give"}>
            To give
          </button>
        ) : null}
        {lends >= 0 ? (
          <button type="button" className="ts-tab lbl" data-mode="lend" data-first={lends} aria-pressed={first.mode === "lend"}>
            To lend
          </button>
        ) : null}
      </div>

      <div className="ts-plank" aria-hidden="true" />
      {/* Focusable so the arrow keys move the shelf and Enter opens the book in front. */}
      <div className="ts-shelf" tabIndex={0} role="group" aria-roledescription="shelf" aria-label={label} aria-describedby={helpId}>
        <div className="ts-stage">
          {Array.from({ length: total }, (_, v) => {
            const copy = copies[v % n];
            return (
              <div key={v} className="ts-book" aria-hidden="true" style={{ "--h": bookHeight(copy.length) } as React.CSSProperties}>
                <div className="ts-face ts-spine">
                  <PrintSpine copy={copy} />
                </div>
                <div className="ts-face ts-cover">
                  <PrintCover copy={copy} />
                </div>
                <div className="ts-face ts-top" />
              </div>
            );
          })}
        </div>
      </div>
      <p id={helpId} className="sr-only">
        Use the left and right arrow keys to move along the shelf, and Enter or Space to open the book in front.
      </p>
      {/* Announced once the shelf settles on a book (the visible caption changes too often to be live). */}
      <p className="ts-live sr-only" aria-live="polite" />

      <button type="button" className="ts-open" aria-label="Open this book" tabIndex={-1}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M3 18 L12 16 L21 18 L21 6 L12 4 L3 6 Z M12 4 L12 16" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="ts-caption" aria-hidden="true">
        <Caption copy={first} />
      </div>

      <button type="button" className="ts-arrow ts-prev" aria-label="Previous book">
        <svg viewBox="0 0 18 10" width="18" height="10" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <path d="M5 1 L1 5 L5 9 M1 5 L17 5" />
        </svg>
      </button>
      <button type="button" className="ts-arrow ts-next" aria-label="Next book">
        <svg viewBox="0 0 18 10" width="18" height="10" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <path d="M13 1 L17 5 L13 9 M17 5 L1 5" />
        </svg>
      </button>

      <div className="ts-cursor" aria-hidden="true">
        <span className="ts-cursor-ring" />
        <span className="ts-cursor-dot" />
        <span className="ts-cursor-label lbl">Open</span>
      </div>
    </section>
  );
}
