import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    typeof process.env.NEXT_PUBLIC_BASE_URL === "string"
      ? process.env.NEXT_PUBLIC_BASE_URL
      : "https://auditai.example.com";

  const now = new Date().toISOString();

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/audit`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/results`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}

