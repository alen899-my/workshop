import { NavbarWhite } from "@/layout/Navbar";
import { Footer } from "@/layout/Footer";
import Link from "next/link";
import { Check, Zap, Star, MessageCircle } from "lucide-react";
import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo-garage.vercel.app";

export const metadata: Metadata = {
  title: "Pricing — \u20b92,999/month | Repairo Garage Software",
  description:
    "Repairo offers transparent, all-inclusive pricing starting at \u20b92,999 per month (~$36 USD). Full access to garage management, invoicing, inventory, and the public workshop finder. No hidden fees.",
  keywords: [
    "Repairo pricing",
    "garage software price India",
    "workshop management software cost",
    "affordable garage software Kerala",
    "car repair software subscription",
    "custom garage application India",
  ],
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    title: "Repairo Pricing — \u20b92,999/month, Everything Included",
    description:
      "One plan, full access. Get job cards, GST invoicing, inventory, garage finder listing, and more for \u20b92,999/month. Custom builds from \u20b920,000.",
    url: `${SITE_URL}/pricing`,
    images: [{ url: "/images/og/og-pricing.png", width: 1200, height: 630, alt: "Repairo Pricing Plans" }],
  },
  twitter: {
    title: "Repairo Pricing — \u20b92,999/month",
    description: "Full garage management software. One price, no tiers, no hidden fees.",
    images: ["/images/og/og-pricing.png"],
  },
};

// JSON-LD for rich results in Google
const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Repairo Standard Plan",
  description: "Full-featured garage management software subscription for workshops across India.",
  brand: { "@type": "Brand", name: "Repairo" },
  offers: [
    {
      "@type": "Offer",
      name: "Standard Monthly Plan",
      price: "2999",
      priceCurrency: "INR",
      priceValidUntil: "2027-01-01",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/pricing`,
      description: "Full access to all Repairo features for one workshop.",
    },
    {
      "@type": "Offer",
      name: "Custom Build",
      price: "20000",
      priceCurrency: "INR",
      availability: "https://schema.org/PreOrder",
      url: `${SITE_URL}/pricing`,
      description: "Bespoke workshop application with custom branding, features, and domain.",
    },
  ],
};

const standardFeatures = [
  "Interactive Dashboard & Analytics",
  "Repair Job Card Management",
  "Customer Management",
  "Vehicle Management",
  "Worker / Technician Management",
  "PDF Invoice Generation with Tax",
  "WhatsApp Report Sharing",
  "Full Service History per Vehicle",
  "Public Workshop Finder Listing",
  "Operating Hours Management",
  "Real-Time Job Status Tracking",
  "Role-Based Permissions Control",
  "Mobile Responsive Dashboard",
  "Monthly Subscription — No Lock-In",
];

const customFeatures = [
  "Everything in Standard Plan",
  "Custom Branding & Domain",
  "Dedicated Database Instance",
  "Custom Feature Development",
  "White-Label Option",
  "Priority Support & SLA",
  "API Access & Webhooks",
  "Staff Training & Onboarding",
  "Custom Reports & Analytics",
  "Payment Gateway Integration",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD: Product + Offers rich result */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      <NavbarWhite />


      {/* Hero */}
      <section className="pt-36 pb-16 px-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Zap size={12} className="text-primary" />
          <span className="font-mono text-[10px] text-primary uppercase tracking-[0.25em]">Simple Pricing</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-4">
          One Price.<br />
          <span className="text-primary">Everything Included.</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          No tiers, no feature gates, no surprises. Get full access to Repairo for your entire team.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Standard Plan */}
          <div className="relative bg-card border-2 border-primary rounded-2xl p-8 flex flex-col gap-6 shadow-lg shadow-primary/10">
            {/* Popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <div className="inline-flex items-center gap-1.5 px-4 py-1 bg-primary text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
                <Star size={10} fill="currentColor" /> Most Popular
              </div>
            </div>

            <div>
              <p className="font-mono text-xs text-primary uppercase tracking-widest mb-1">Standard Plan</p>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-5xl font-black text-foreground tracking-tight">₹2,999</span>
                <span className="text-muted-foreground text-sm font-mono mb-1.5">/month</span>
              </div>
              <p className="text-muted-foreground text-xs font-mono mt-1">≈ $36 USD / month</p>
              <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                Everything you need to run a modern, fully digital garage. For one workshop, unlimited staff.
              </p>
            </div>

            <Link href="/signup"
              className="w-full py-3 bg-primary text-primary-foreground font-bold font-mono text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-primary/90 shadow-sm">
              Start Free Trial
            </Link>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">What's Included</p>
              {standardFeatures.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Check size={10} className="text-primary" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground/60 text-center font-mono border-t border-border pt-4">
              Pay via UPI · No credit card required · Cancel anytime
            </div>
          </div>

          {/* Custom / Enterprise Plan */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col gap-6">
            <div>
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">Custom Build</p>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-5xl font-black text-foreground tracking-tight">₹20,000</span>
                <span className="text-muted-foreground text-sm font-mono mb-1.5">one-time</span>
              </div>
              <p className="text-muted-foreground text-xs font-mono mt-1">≈ $240 USD starting</p>
              <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                Need a bespoke workshop application? We'll build a fully custom solution tailored to your exact business workflow.
              </p>
            </div>

            <a href="mailto:alenjames899@gmail.com?subject=Custom Workshop Application Inquiry"
              className="w-full py-3 bg-muted border border-border hover:border-primary/40 text-foreground font-bold font-mono text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-primary/5">
              <MessageCircle size={15} />
              Get a Quote
            </a>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">Everything in Standard, Plus</p>
              {customFeatures.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                    <Check size={10} className="text-muted-foreground" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground/60 text-center font-mono border-t border-border pt-4">
              Project scoped per requirements · Timeline discussed on call
            </div>
          </div>
        </div>

        {/* FAQ / Note */}
        <div className="max-w-4xl mx-auto mt-14 text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl px-8 py-8 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="text-left">
              <h3 className="font-bold text-foreground">Not sure which plan is right?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Most single-location garages choose Standard. Multi-site operations or unique workflows → Custom Build.
              </p>
            </div>
            <a href="tel:+918921837945"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all">
              📞 Call Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
