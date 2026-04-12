import { NavbarWhite } from "@/layout/Navbar";
import Link from "next/link";
import { Wrench, Users, Globe, ShieldCheck, Zap, BarChart3, Car, Clock, ArrowRight } from "lucide-react";
import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo.in";

export const metadata: Metadata = {
  title: "About Repairo — Garage Management Platform Built for Kerala",
  description:
    "Learn how Repairo is transforming vehicle repair management for modern garages across Kerala and India. Built with Next.js, Node.js and PostgreSQL for reliability at scale.",
  keywords: [
    "about Repairo",
    "garage management platform India",
    "workshop software company Kerala",
    "vehicle repair platform",
    "Repairo story",
    "auto workshop tech India",
  ],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About Repairo — The Workshop Platform Kerala Garages Trust",
    description:
      "Repairo was built to give every garage the same digital tools that enterprise workshops enjoy — job cards, invoicing, and a public finder for customers.",
    url: `${SITE_URL}/about`,
    images: [{ url: "/images/og/og-about.png", width: 1200, height: 630, alt: "About Repairo" }],
  },
  twitter: {
    title: "About Repairo",
    description: "Built for modern Kerala garages. Digitize everything from job cards to customer discovery.",
    images: ["/images/og/og-about.png"],
  },
};

const aboutSchemas = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Repairo",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logos/logo.png`,
    foundingLocation: { "@type": "Place", name: "Kerala, India" },
    description:
      "Repairo is India's leading workshop management platform. Built for modern garages in Kerala — digitizing job cards, invoicing, inventory and enabling public garage discovery.",
    contactPoint: { "@type": "ContactPoint", telephone: "+91-8921837945", contactType: "Customer Support", areaServed: "IN" },
  },
  {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Repairo",
    url: `${SITE_URL}/about`,
    description: "Learn how Repairo is transforming vehicle repair management for garages across Kerala and India.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/about` },
      ],
    },
  },
];

const pillars = [
  {
    icon: <Wrench className="w-6 h-6 text-primary" />,
    title: "Built for Garages",
    desc: "Designed from the ground up for workshop owners — from job card creation to invoicing, every feature matches how real garages work.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-primary" />,
    title: "Real-Time Tracking",
    desc: "Know the live status of every repair job, technician assignment, and vehicle in your workshop at a glance.",
  },
  {
    icon: <Globe className="w-6 h-6 text-primary" />,
    title: "Public Discovery",
    desc: "Registered garages are visible on our public search platform — customers can find your workshop by location or service without any extra effort on your part.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-primary" />,
    title: "Secure & Role-Based",
    desc: "Super-admins, shop owners, technicians and receptionists each see only what they need — with granular permission controls protecting your data.",
  },
  {
    icon: <Zap className="w-6 h-6 text-primary" />,
    title: "Instant Invoicing",
    desc: "Generate professional PDF invoices with tax breakdowns, part line items and customer signatures — directly from the job card.",
  },
  {
    icon: <Car className="w-6 h-6 text-primary" />,
    title: "Vehicle Registry",
    desc: "Maintain a full service history for every vehicle — all makes, models, and types — with searchable customer records.",
  },
];

const stack = [
  "Next.js 15 (App Router)",
  "Node.js + Express",
  "PostgreSQL (Neon)",
  "Cloudflare R2 Storage",
  "Tailwind CSS",
  "TypeScript",
  "React 19",
  "Lucide Icons",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD: Organization + AboutPage + Breadcrumb */}
      {aboutSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <NavbarWhite />

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-[1px] w-6 bg-primary" />
          <span className="font-mono text-[10px] text-primary uppercase tracking-[0.3em]">About Repairo</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-foreground leading-tight tracking-tight mb-6">
          The Workshop Platform<br />
          <span className="text-primary">Kerala Garages Trust</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Repairo was built with one goal: give every garage — big or small — the same digital tools that enterprise workshops enjoy. 
          We digitize your entire repair workflow so you can focus on fixing vehicles, not managing paperwork.
        </p>
      </section>

      {/* Mission Banner */}
      <section className="bg-primary/5 border-y border-border py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
            "We believe every mechanic deserves a <span className="text-primary">digital co-pilot</span> — 
            not just the big dealerships."
          </p>
          <p className="text-muted-foreground mt-4 text-sm">— Repairo Team, Kerala</p>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-3">What Repairo Does</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl">
          Repairo is a full-stack workshop management platform with two core pillars:
          <strong className="text-foreground"> internal garage management</strong> for shop staff, and 
          <strong className="text-foreground"> public discovery</strong> for customers looking for nearby workshops.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-3 hover:border-primary/30 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                {p.icon}
              </div>
              <h3 className="font-bold text-foreground">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Public Access Section */}
      <section className="bg-card border-y border-border py-20 px-6">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <span className="font-mono text-xs text-primary uppercase tracking-widest">Public Platform</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Helping Customers Find the Right Garage
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Beyond the internal management tools, Repairo operates a public-facing workshop directory. 
              Customers can search for verified garages by city, state, or specific service — like "Oil Change in Kochi" — 
              and get instant results with contact details, hours, and a direct Google Maps link.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every garage registered on Repairo automatically appears in the finder with zero extra effort. 
              This means your shop gets discovered by new customers the moment you go live on the platform.
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            {["Search by City, State or Area", "Filter by Service Type", "Call Now or Get Directions", "View Operating Hours & Open/Closed Status"].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-sm text-foreground font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-3">Built with Modern Tech</h2>
        <p className="text-muted-foreground mb-10 max-w-xl">
          Repairo is engineered on a production-grade stack designed for reliability, speed, and scalability.
        </p>
        <div className="flex flex-wrap gap-3">
          {stack.map((tech) => (
            <span key={tech} className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-semibold font-mono">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6 max-w-5xl mx-auto">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">Ready to digitize your garage?</h3>
            <p className="text-muted-foreground text-sm mt-1">Start with a 30-day free trial. No card required.</p>
          </div>
          <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shrink-0">
            Get Started Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Bottom bar */}
      <div className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground font-mono">© {new Date().getFullYear()} Repairo. All rights reserved.</p>
      </div>
    </div>
  );
}
