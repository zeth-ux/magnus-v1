import { normaliseSiteOrigin } from "@/lib/auth/site-origin";

/** The public address, for absolute links (metadata, sitemap). Falls back to production. */
export const SITE_URL =
  normaliseSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
  normaliseSiteOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  "https://magnus-v1.vercel.app";
