"use client";

/**
 * One place to register GSAP plugins (all free since GSAP 3.13).
 * Import gsap, ScrollTrigger and useGSAP from here, never from "gsap"
 * directly, so plugins are always registered before use. Register more
 * plugins (SplitText, DrawSVGPlugin, ...) here when a component needs them.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

/** The two eases of the paper design (docs/brand.md): text slides and turns, and a sheet unfolding. */
CustomEase.create("paper", "0.2,0.8,0.2,1");
CustomEase.create("sheet", "0.76,0,0.18,1");

/** Motion only runs for people who haven't asked their device to reduce it. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, useGSAP };
