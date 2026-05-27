import { Metadata } from "next";
import { NavbarWhite } from "@/layout/Navbar";
import { Footer } from "@/layout/Footer";
import Link from "next/link";
import { ArrowRight, Clock, CheckCircle2 } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo-garage.vercel.app";

export const metadata: Metadata = {
  title: "GST Invoicing for Auto Garages in India: Complete Guide (2025) | Repairo",
  description:
    "How to generate GST-compliant invoices for your auto garage in India. Covers CGST, SGST, HSN codes for auto parts and services, mandatory fields, and how workshop software makes it effortless.",
  keywords: [
    "GST invoicing garage India",
    "garage GST invoice",
    "auto workshop GST billing",
    "mechanic GST invoice India",
    "car repair GST bill",
    "workshop billing software India",
    "garage invoice software",
    "HSN code auto parts India",
    "GST for auto repair India",
    "workshop management software billing",
  ],
  alternates: { canonical: `${SITE_URL}/blog/gst-invoicing-garage-india` },
  openGraph: {
    title: "GST Invoicing for Auto Garages in India: Complete Guide (2025)",
    description:
      "A complete guide to GST invoicing for Indian auto garages — CGST, SGST, HSN codes, mandatory fields, and how billing software handles it all automatically.",
    url: `${SITE_URL}/blog/gst-invoicing-garage-india`,
    images: [{ url: "/images/og/og-home.png", width: 1200, height: 630, alt: "GST Invoicing Guide for Garages India" }],
  },
  twitter: {
    title: "GST Invoicing for Auto Garages in India: Complete Guide 2025",
    description: "Everything Indian garage owners need to know about GST billing — plus how software makes it automatic.",
    images: ["/images/og/og-home.png"],
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "GST Invoicing for Auto Garages in India: Complete Guide (2025)",
  description: "A complete guide to generating GST-compliant invoices for auto garages in India — CGST, SGST, HSN codes, and how workshop billing software automates the process.",
  author: { "@type": "Organization", name: "Repairo", url: SITE_URL },
  publisher: {
    "@type": "Organization",
    name: "Repairo",
    logo: { "@type": "ImageObject", url: `${SITE_URL}/images/logos/logo.png` },
  },
  datePublished: "2025-04-01",
  dateModified: new Date().toISOString().split("T")[0],
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/gst-invoicing-garage-india` },
  image: `${SITE_URL}/images/og/og-home.png`,
  keywords: "GST invoicing garage India, auto workshop GST billing, garage invoice software",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    { "@type": "ListItem", position: 3, name: "GST Invoicing for Garages", item: `${SITE_URL}/blog/gst-invoicing-garage-india` },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is GST applicable to auto garage services in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Auto garage and vehicle repair services in India are taxable under GST. The GST rate for repair and maintenance services is 18%. For spare parts sold as part of the service, GST rates vary by part type — typically 18% or 28% for certain auto components.",
      },
    },
    {
      "@type": "Question",
      name: "What HSN/SAC code should a garage use for repair services?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Auto garages should use SAC (Services Accounting Code) 998714 for 'Maintenance and repair services for motor vehicles'. For spare parts sold, the relevant HSN code depends on the part type — for example, engine parts fall under HSN 8409, tyres under 4011, and batteries under 8507.",
      },
    },
    {
      "@type": "Question",
      name: "What is the GST rate for vehicle repair services?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vehicle repair and maintenance services attract 18% GST in India (9% CGST + 9% SGST for intra-state transactions). This applies to labour charges and the overall repair service. Spare parts are billed separately at their applicable GST rate.",
      },
    },
    {
      "@type": "Question",
      name: "Do small garages need to register for GST in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GST registration is mandatory for garages with annual turnover exceeding ₹20 lakhs (₹10 lakhs in special category states). Below this threshold, registration is optional but recommended for professional invoicing, input tax credit, and customer trust.",
      },
    },
  ],
};

const mandatoryFields = [
  { field: "GSTIN of supplier (your garage)", required: true },
  { field: "Invoice number (unique, sequential)", required: true },
  { field: "Invoice date", required: true },
  { field: "Customer name and address", required: true },
  { field: "GSTIN of customer (if registered)", required: false },
  { field: "SAC/HSN code for each service/part", required: true },
  { field: "Description of goods/services", required: true },
  { field: "Quantity (for parts)", required: true },
  { field: "Rate per unit", required: true },
  { field: "Total taxable value", required: true },
  { field: "CGST rate & amount", required: true },
  { field: "SGST rate & amount (intra-state)", required: true },
  { field: "IGST rate & amount (inter-state)", required: false },
  { field: "Total invoice value", required: true },
  { field: "Place of supply", required: true },
];

export default function GSTInvoicingGaragePage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <NavbarWhite />

      <div className="pt-28 pb-24 px-6 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-foreground">GST Invoicing for Garages</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-[1px] w-6 bg-primary" />
            <span className="font-mono text-[10px] text-primary uppercase tracking-[0.3em]">GST & Billing · 2025</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight mb-6">
            GST Invoicing for{" "}
            <span className="text-primary">Auto Garages</span>{" "}
            in India: Complete Guide (2025)
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            Everything Indian garage owners need to know about GST invoicing — from applicable rates and HSN/SAC codes to mandatory invoice fields and how workshop billing software automates the entire process.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5"><Clock size={12} /> 10 min read</span>
            <span>·</span>
            <span>Updated April 2025</span>
            <span>·</span>
            <span>By Repairo Team</span>
          </div>
        </header>

        {/* Article Sections */}
        <article className="space-y-16">

          <section id="gst-overview">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">GST for Auto Garages: The Basics</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Goods and Services Tax (GST) applies to auto garage services across India. Whether you're running a two-bay mechanic shop in Thrissur or a multi-service auto centre in Bangalore, your repair services are taxable under GST at <strong className="text-foreground">18%</strong> (9% CGST + 9% SGST for intra-state transactions).
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              This applies to both <strong className="text-foreground">labour charges</strong> (the cost of the mechanic's work) and <strong className="text-foreground">spare parts</strong> sold as part of the repair. However, spare parts are typically billed at their own applicable GST rates, which can differ from the service rate.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border border-border rounded-xl overflow-hidden text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-4 py-3 text-foreground font-bold text-xs uppercase tracking-wider">Item Type</th>
                    <th className="text-left px-4 py-3 text-foreground font-bold text-xs uppercase tracking-wider">GST Rate</th>
                    <th className="text-left px-4 py-3 text-foreground font-bold text-xs uppercase tracking-wider">HSN/SAC Code</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Repair & maintenance labour", "18%", "SAC 998714"],
                    ["Engine parts & components", "18%", "HSN 8409"],
                    ["Tyres & tubes", "18%", "HSN 4011/4013"],
                    ["Batteries", "18%", "HSN 8507"],
                    ["Air filters", "18%", "HSN 8421"],
                    ["Brake pads & discs", "18%", "HSN 8708"],
                    ["Windshields & auto glass", "18%", "HSN 7007"],
                    ["Lubricants & oils", "18%", "HSN 2710"],
                  ].map(([item, rate, code], i) => (
                    <tr key={i} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                      <td className="px-4 py-3 text-foreground">{item}</td>
                      <td className="px-4 py-3 font-mono text-primary font-bold">{rate}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">* GST rates may change. Always verify with the latest GST council notifications or a tax professional.</p>
          </section>

          <section id="mandatory-fields">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">Mandatory Fields in a GST Invoice for Garages</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              A GST tax invoice from your garage must include specific fields to be legally valid. Missing any mandatory field can lead to invoice rejection or penalties during audits:
            </p>
            <div className="space-y-2">
              {mandatoryFields.map(({ field, required }) => (
                <div key={field} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${required ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  <span className="text-sm text-foreground flex-1">{field}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {required ? "Required" : "If applicable"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section id="software-solution">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">How Garage Management Software Automates GST Invoicing</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Manually creating GST invoices for every repair job is time-consuming and error-prone. Workshop management software like <strong className="text-foreground">Repairo</strong> automates the entire billing process:
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "Auto-generated from job cards",
                  desc: "Every part used and service performed is logged in the job card. When the repair is complete, the system generates a complete GST invoice automatically — no manual data entry.",
                },
                {
                  title: "Automatic GST calculation",
                  desc: "The software calculates CGST and SGST based on your registered state and the applicable rates for each item. No manual calculation, no errors.",
                },
                {
                  title: "HSN/SAC codes pre-configured",
                  desc: "Common auto parts and services come pre-configured with their correct HSN/SAC codes, ensuring compliance without you needing to look anything up.",
                },
                {
                  title: "Professional PDF generation",
                  desc: "Invoices are generated as branded, professional PDFs with your garage name, GSTIN, and logo — ready to print or share digitally.",
                },
                {
                  title: "WhatsApp sharing in one click",
                  desc: "Share the PDF invoice directly with the customer via WhatsApp from the billing screen — customers get a professional invoice instantly on their phone.",
                },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-4 bg-card border border-border rounded-xl p-5">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq">
            <h2 className="text-2xl font-black text-foreground mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqSchema.mainEntity.map((faq) => (
                <details key={faq.name} className="group bg-card border border-border rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-foreground text-sm hover:bg-primary/5 transition-colors list-none">
                    {faq.name}
                    <span className="text-primary group-open:rotate-45 transition-transform shrink-0 ml-4">+</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {faq.acceptedAnswer.text}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </article>

        {/* Related Articles */}
        <div className="mt-16">
          <h2 className="text-xl font-black text-foreground mb-6">Related Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/blog/garage-management-software-guide" className="group block bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">Software Guide</p>
              <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors leading-snug">
                Complete Guide to Garage Management Software in India
              </h3>
            </Link>
            <Link href="/blog/workshop-management-system-benefits" className="group block bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">Business Tips</p>
              <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors leading-snug">
                7 Ways a Workshop Management System Grows Your Revenue
              </h3>
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-black text-foreground mb-2">Stop doing GST invoicing manually</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Repairo auto-generates fully GST-compliant invoices from your job cards. 30-day free trial, no credit card needed.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Start Free Trial <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
