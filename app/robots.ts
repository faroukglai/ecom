import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/api/", "/order/", "/ar/order/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
