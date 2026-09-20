import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { listFeed } from "@/lib/data/read";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/feed`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/sign-in`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let tests: MetadataRoute.Sitemap = [];
  try {
    const feed = await listFeed({ limit: 200 });
    tests = feed.flatMap((t) => [
      {
        url: `${base}/test/${t.slug}`,
        lastModified: new Date(t.createdAt),
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
      {
        url: `${base}/results/${t.slug}`,
        lastModified: new Date(t.createdAt),
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
    ]);
  } catch {
    // A sitemap is never worth failing a deploy over.
  }

  return [...staticRoutes, ...tests];
}
