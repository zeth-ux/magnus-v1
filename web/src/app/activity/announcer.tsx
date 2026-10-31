"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

/**
 * One status region for the whole Activity page. A request's buttons often
 * disappear after they work (the request moves to "Earlier"), so the result
 * is announced here, where it survives the refresh, and focus moves here.
 */
const Ctx = createContext<(message: string) => void>(() => {});

export function Announcer({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const region = useRef<HTMLParagraphElement>(null);
  const announce = useCallback((m: string) => {
    setMessage(m);
    // After React paints the message, bring keyboard focus to it.
    requestAnimationFrame(() => region.current?.focus());
  }, []);
  return (
    <Ctx.Provider value={announce}>
      <p ref={region} tabIndex={-1} role="status" className="min-h-6 text-[17px] text-paper outline-none">
        {message}
      </p>
      {children}
    </Ctx.Provider>
  );
}

export const useAnnounce = () => useContext(Ctx);
