import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site/url";

/**
 * Search engines may read the public pages; the app stays out of results.
 * /browse too, on purpose: it's open to visitors now, but book pages carry
 * readers' areas, and those shouldn't sit in search engines.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/privacy"],
      disallow: ["/auth/", "/offline.html", "/welcome", "/browse", "/shelf", "/add", "/activity", "/me", "/wishlist", "/report", "/feedback"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
