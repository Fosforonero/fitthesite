import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.fitmesh.fit";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "monthly", priority: 1.0 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
