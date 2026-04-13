import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { WorkshopToastProvider } from "@/components/ui/WorkshopToast";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo-garage.vercel.app";
const SITE_NAME = "Repairo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  // ── Default title template applied to all child pages ──
  title: {
    default: "Repairo — #1 Garage Management Software in Kerala",
    template: "%s | Repairo",
  },

  description:
    "Repairo is the leading vehicle repair management platform for modern garages. Digitize job cards, invoicing, inventory, and customer tracking — built for workshops across Kerala and India.",

  keywords: [
    "garage management software",
    "vehicle repair management",
    "workshop management software India",
    "garage software Kerala",
    "auto repair shop software",
    "job card management",
    "mechanic software",
    "car service management",
    "Repairo",
    "repairo-garage.vercel.app",
    "workshop billing software",
    "GST invoice garage",
    "auto workshop CRM India",
    "find workshops near me Kerala",
    "garage finder India",
  ],

  authors: [{ name: "Repairo Team", url: SITE_URL }],
  creator: "Repairo",
  publisher: "Repairo",
  category: "Software",

  // ── Open Graph ──
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["en_US", "en_GB"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Repairo — #1 Garage Management Software in Kerala",
    description:
      "Track repairs, generate invoices, manage your team, and appear in our public workshop directory. Built for modern garages across India.",
    images: [
      {
        url: "/images/og/og-default.png",
        width: 1200,
        height: 630,
        alt: "Repairo — Workshop Management Platform Dashboard",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X ──
  twitter: {
    card: "summary_large_image",
    site: "@repairo_in",
    creator: "@repairo_in",
    title: "Repairo — #1 Garage Management Software",
    description:
      "Digitize your garage with Repairo. Job cards, invoicing, inventory, and public workshop finder — all in one platform.",
    images: ["/images/og/og-default.png"],
  },

  // ── Canonical & Alternates ──
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-IN": `${SITE_URL}`,
      "en-US": `${SITE_URL}`,
      "x-default": `${SITE_URL}`,
    },
  },

  // ── Robots ──
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Verification (add Search Console ID when live) ──
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google05d4ee03af8c52a3",
    // yandex: "...",
    // bing: "...",
  },

  // ── App / PWA ──
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  icons: {
    icon: '/images/logos/single.ico',
    shortcut: '/images/logos/single.ico',
    apple: '/images/logos/single.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        {/* Preconnect to external origins for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <WorkshopToastProvider>
            {children}
          </WorkshopToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}