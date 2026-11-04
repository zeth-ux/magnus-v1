import type { NextConfig } from "next";

/**
 * Security headers on every response.
 * - frame-ancestors / X-Frame-Options: no other site can put Bayu in a frame
 *   (stops clickjacking, e.g. a fake page over the "Accept" button).
 * - HSTS: browsers only ever use https for this site (two years; no preload
 *   list). Sent only on Vercel, where the site is served over https (browsers
 *   ignore it over plain http anyway). With a custom domain later,
 *   includeSubDomains covers all its subdomains: decide that on purpose.
 * - COOP (same-origin-allow-popups): a page Bayu opens, or one that opens Bayu,
 *   gets no handle on this window (stops tab-nabbing). Popups we open still work.
 * - nosniff: files are only treated as the type we say they are.
 * - Referrer-Policy: other sites see only "magnus-v1.vercel.app", never a full URL.
 * - Permissions-Policy: camera for the barcode scanner on our own pages only;
 *   microphone, location, payments and the like are off.
 * The enforced CSP is deliberately small (frames, base, plugins, where forms
 * may post) so it can't break the app's scripts, fonts, GSAP or book covers.
 * A full policy runs as Report-Only first: browsers log what it *would* block
 * (in the console) without blocking anything. Once a real phone shows no
 * reports on every page, it can be switched to enforcing (OWASP ASVS V3.4).
 * script-src keeps 'unsafe-inline' because Next's inline scripts would need
 * per-request nonces; the policy still stops scripts from any other site.
 * Expected reports, not bugs: Vercel's preview toolbar (vercel.live) on preview
 * deployments. Don't loosen the production policy for them. Reports appear in
 * the browser console only (no report-to endpoint yet).
 */
const SUPABASE = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
  } catch {
    return "";
  }
})();
const FULL_CSP = [
  "default-src 'self'",
  // next dev's React runtime uses eval; production never does, so it's allowed in dev only.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://books.google.com https://books.googleusercontent.com https://covers.openlibrary.org",
  "font-src 'self' data:",
  // Book lookups run on the server (lib/books/lookup.ts), so the browser only talks to us and Supabase.
  `connect-src 'self'${SUPABASE ? ` https://${SUPABASE} wss://${SUPABASE}` : ""}`,
  "media-src 'self' blob:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "Content-Security-Policy-Report-Only", value: FULL_CSP },
  { key: "X-Frame-Options", value: "DENY" },
  ...(process.env.VERCEL ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Don't advertise the framework in every response.
  poweredByHeader: false,
  // Source maps stay private (the default; written down so nobody turns it on by accident).
  productionBrowserSourceMaps: false,
  partialPrefetching: true,
  // The service worker must never be cached, so a fix reaches phones on the next visit.
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
