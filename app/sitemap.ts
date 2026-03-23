import { MetadataRoute } from "next";
import BangladeshStates from "@/data/bangladesh-states";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // District pages
  const districtPages: MetadataRoute.Sitemap = BangladeshStates.map(
    (state) => ({
      url: `${baseUrl}/events/${state.slug}`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })
  );

  // Live chat pages
  const chatPages: MetadataRoute.Sitemap = BangladeshStates.filter(
    (s) => s.slug !== "all-districts"
  ).map((state) => ({
    url: `${baseUrl}/live-chat/${state.slug}`,
    lastModified: new Date(),
    changeFrequency: "always" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...districtPages, ...chatPages];
}
