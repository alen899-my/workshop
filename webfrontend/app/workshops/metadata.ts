// Metadata for the /workshops route (must be in a separate file since page.tsx is "use client")
import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo-garage.vercel.app";

export const metadata: Metadata = {
  title: "Find a Workshop Near You — Garage Finder | Repairo",
  description:
    "Search verified auto workshops and garages across Kerala and India by location, city, or service. Find nearby garages for oil change, brake repair, engine diagnostics, AC service, and more.",
  keywords: [
    "find workshop near me",
    "garage finder Kerala",
    "auto workshop search India",
    "car service near me Kerala",
    "mechanic near me",
    "oil change garage Kerala",
    "brake repair shop India",
    "engine diagnostics workshop",
    "AC service garage near me",
    "tire replacement shop",
    "wheel alignment center",
    "denting painting shop Kerala",
    "verified garage India",
    "Repairo workshop finder",
  ],
  alternates: {
    canonical: `${SITE_URL}/workshops`,
  },
  openGraph: {
    title: "Find a Workshop Near You — Repairo Garage Finder",
    description:
      "Search hundreds of verified garages across Kerala and India. Filter by city, state, and service type. Call directly or get directions instantly.",
    url: `${SITE_URL}/workshops`,
    images: [
      {
        url: "/images/og/og-workshops.png",
        width: 1200,
        height: 630,
        alt: "Repairo Workshop Finder — Search Garages Near You",
      },
    ],
  },
  twitter: {
    title: "Find a Garage Near You — Repairo",
    description:
      "Search verified workshops across Kerala and India. Filter by location and service.",
    images: ["/images/og/og-workshops.png"],
  },
};
