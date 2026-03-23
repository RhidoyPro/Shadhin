import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/settings/", "/suspended"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
