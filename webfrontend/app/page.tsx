import { Metadata } from "next";
import HomePageContent from "@/components/pages/HomePageContent";

// ── SEO METADATA ──
export const metadata: Metadata = {
  title: "WorkshopPro | #1 Vehicle Repair Management Software in Kerala",
  description:
    "Elevate your garage with WorkshopPro. Track repairs in real-time, generate GST invoices, manage mechanics, and boost customer trust. Built specifically for vehicle workshops in Kerala.",
  keywords: [
    "workshop management software kerala",
    "vehicle repair tracking",
    "garage billing software",
    "job card management system",
    "auto workshop CRM",
    "GST invoicing for mechanics",
    "VehRep workshop pro",
  ],
  openGraph: {
    title: "WorkshopPro — Professional Garage Management",
    description: "The complete digital toolkit for modern vehicle workshops.",
    url: "https://vehrep.com",
    siteName: "WorkshopPro",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "WorkshopPro Dashboard Preview",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  alternates: {
    canonical: "https://vehrep.com",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <>
      {/* ── Structured Data (JSON-LD) for SEO ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "WorkshopPro",
            "operatingSystem": "Web-based",
            "applicationCategory": "BusinessApplication",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "320"
            },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            }
          }),
        }}
      />

      <HomePageContent />
    </>
  );
}