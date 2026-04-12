import { Metadata } from "next";
import HomePageContent from "@/components/pages/HomePageContent";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo.in";

export const metadata: Metadata = {
  title: "Repairo — #1 Garage Management Software | Kerala & India",
  description:
    "Repairo is India's leading workshop management platform. Digitize job cards, GST invoicing, inventory, technician tracking — and get discovered by customers via our public garage finder. Built for modern garages in Kerala.",
  keywords: [
    "Repairo",
    "garage management software Kerala",
    "workshop management India",
    "vehicle repair tracking software",
    "job card software garage",
    "mechanic billing software India",
    "auto workshop CRM Kerala",
    "GST invoice garage software",
    "find workshop near me Kerala",
    "car service management software",
    "repairo.in",
    "garage software free trial",
    "digital workshop management",
    "technician management system",
    "workshop finder India",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Repairo — #1 Garage Management Software | Kerala & India",
    description:
      "Track repairs live, generate GST invoices, manage your team, and let customers find your garage instantly. The complete digital toolkit for modern workshops.",
    url: SITE_URL,
    images: [
      {
        url: "/images/og/og-home.png",
        width: 1200,
        height: 630,
        alt: "Repairo Garage Management Platform — Home",
      },
    ],
  },
  twitter: {
    title: "Repairo — #1 Garage Management Software",
    description:
      "Track repairs live, invoice instantly, and get discovered by customers. Repairo is built for modern garages across Kerala and India.",
    images: ["/images/og/og-home.png"],
  },
};

// ── Structured Data helpers ──
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Repairo",
  url: SITE_URL,
  logo: `${SITE_URL}/images/logos/logo.png`,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-8921837945",
    contactType: "Customer Support",
    areaServed: "IN",
    availableLanguage: ["English", "Malayalam"],
  },
  sameAs: [],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Repairo",
  operatingSystem: "Web",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Garage Management Software",
  description:
    "End-to-end vehicle repair management system for auto workshops — job cards, GST invoicing, inventory, and public garage finder.",
  url: SITE_URL,
  offers: {
    "@type": "Offer",
    price: "2999",
    priceCurrency: "INR",
    priceValidUntil: "2027-01-01",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "320",
    bestRating: "5",
    worstRating: "1",
  },
  screenshot: `${SITE_URL}/images/og/og-home.png`,
  featureList:
    "Job Card Management, GST Invoice Generation, Inventory Tracking, Technician Assignment, Public Garage Directory, Real-Time Repair Tracking",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Repairo",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/workshops?location={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Repairo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Repairo is a cloud-based workshop management platform that helps garages digitize job cards, invoicing, inventory, and customer management. It also powers a public garage finder for customers to discover workshops across Kerala and India.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Repairo cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Repairo is available for ₹2,999 per month (approximately $36 USD) for the full-featured Standard plan. Custom enterprise builds start at ₹20,000.",
      },
    },
    {
      "@type": "Question",
      name: "Does Repairo support GST invoicing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Repairo generates professional PDF invoices with itemized parts, service charges, and GST tax breakdowns compliant with Indian tax requirements.",
      },
    },
    {
      "@type": "Question",
      name: "Can customers find my garage on Repairo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every registered garage is automatically listed on Repairo's public Workshop Finder. Customers can search by city, state, or service type and instantly see your contact details, operating hours, and get directions via Google Maps.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free trial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Repairo offers a 30-day free trial for new garages with no credit card required.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      {/* SoftwareApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      {/* WebSite + SearchAction Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <HomePageContent />
    </>
  );
}