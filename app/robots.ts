import type { MetadataRoute } from "next";

/**
 * Robots policy: allow everything under marketing routes (/, /blog/*, /lp/*,
 * /sync/*, /integrations, ...). Disallow private app/auth/admin areas.
 *
 * Sitemap explicitly pointed at the canonical domain.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/admin/", "/auth/", "/oauth/", "/api/"],
      },
    ],
    sitemap: "https://www.fitmesh.fit/sitemap.xml",
    host: "https://www.fitmesh.fit",
  };
}
