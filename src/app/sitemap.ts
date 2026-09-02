import type { MetadataRoute } from "next";
import { getMomentViews, getPublishedEpisodes, getPublishedGuests, getPublishedTopics, site } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.baseUrl;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pro-partnera`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/podminky-poctive`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/otazky-pro-hosty`, changeFrequency: "monthly", priority: 0.4 },
    ...getPublishedTopics().map((t) => ({ url: `${base}/tema/${t.topic.id}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...getMomentViews().map((m) => ({ url: `${base}/m/${m.id}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...getPublishedGuests().map((g) => ({ url: `${base}/host/${g.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...getPublishedEpisodes().map((e) => ({ url: `${base}/podcast/${e.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
