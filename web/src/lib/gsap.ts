"use client";

/**
 * One place to register GSAP plugins (all free since GSAP 3.13).
 * Import gsap, ScrollTrigger and useGSAP from here, never from "gsap"
 * directly, so plugins are always registered before use. Register more
 * plugins (SplitText, DrawSVGPlugin, ...) here when a component needs them.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Motion only runs for people who haven't asked their device to reduce it. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, useGSAP };
