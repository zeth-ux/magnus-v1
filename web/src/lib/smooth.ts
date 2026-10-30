import type Lenis from "lenis";

/** The live Lenis instance (null on touch or reduced motion), so a dialog can pause it. */
export const smooth: { lenis: Lenis | null } = { lenis: null };
