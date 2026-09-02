import type { MetadataRoute } from "next";
import { site } from "@/lib/data";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/v/"] }],
    sitemap: `${site.baseUrl}/sitemap.xml`,
  };
}
