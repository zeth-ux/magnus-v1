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
 * The CSP is deliberately small (frames, base, plugins) so it can't break the
 * app's scripts, fonts, GSAP or book covers; a full script policy needs nonces.
 */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
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
