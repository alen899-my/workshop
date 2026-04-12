import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo-garage.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all crawlers on all public pages
        userAgent: "*",
        allow: [
          "/",
          "/workshops",
          "/pricing",
          "/about",
          "/privacy",
          "/terms",
          "/login",
          "/signup",
        ],
        disallow: [
          "/app/",          // Internal dashboard
          "/app/*",
          "/api/",          // API routes
          "/_next/",        // Next.js internals
          "/admin/",
        ],
      },
      {
        // Let Googlebot crawl everything public freely
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/app/", "/api/"],
      },
      {
        // Block AI scrapers from training data
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "Claude-Web",
        disallow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
