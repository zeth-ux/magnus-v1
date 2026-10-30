"use client";

/**
 * One place to register GSAP plugins (all free since GSAP 3.13).
 * Import gsap, ScrollTrigger, SplitText and useGSAP from here, never from
 * "gsap" directly, so plugins are always registered before use.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, SplitText);

/** Motion only runs for people who haven't asked their device to reduce it. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, SplitText, useGSAP };
