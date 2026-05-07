import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    typeof process.env.NEXT_PUBLIC_BASE_URL === "string"
      ? process.env.NEXT_PUBLIC_BASE_URL
      : "https://auditai.example.com";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/audit", "/results", "/report/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}

