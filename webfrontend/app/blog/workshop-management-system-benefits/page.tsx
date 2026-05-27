import { Metadata } from "next";
import { NavbarWhite } from "@/layout/Navbar";
import { Footer } from "@/layout/Footer";
import Link from "next/link";
import { ArrowRight, Clock, TrendingUp, CheckCircle2 } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo-garage.vercel.app";

export const metadata: Metadata = {
  title: "7 Ways a Workshop Management System Grows Your Garage Revenue | Repairo",
  description:
    "Discover how a workshop management system directly increases revenue for Indian auto garages. Learn how digitizing job cards, billing, inventory, and customer management boosts profits.",
  keywords: [
    "workshop management system",
    "workshop management system India",
    "garage revenue tips India",
    "auto workshop software benefits",
    "increase garage revenue",
    "workshop management system benefits",
    "digital garage India",
    "mechanic shop management system",
    "auto repair shop software India",
    "garage management tips Kerala",
  ],
  alternates: { canonical: `${SITE_URL}/blog/workshop-management-system-benefits` },
  openGraph: {
    title: "7 Ways a Workshop Management System Grows Your Garage Revenue",
    description:
      "How a digital workshop management system helps Indian garages serve more customers, reduce costs, and grow monthly revenue.",
    url: `${SITE_URL}/blog/workshop-management-system-benefits`,
    images: [{ url: "/images/og/og-home.png", width: 1200, height: 630, alt: "Workshop Management System Benefits" }],
  },
  twitter: {
    title: "7 Ways a Workshop Management System Grows Your Garage Revenue",
    description: "How going digital helps Indian garages handle more jobs and earn more — without more staff.",
    images: ["/images/og/og-home.png"],
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "7 Ways a Workshop Management System Grows Your Garage Revenue",
  description:
    "Discover how a digital workshop management system helps Indian auto garages serve more customers, reduce waste, and increase monthly revenue.",
  author: { "@type": "Organization", name: "Repairo", url: SITE_URL },
  publisher: {
    "@type": "Organization",
    name: "Repairo",
    logo: { "@type": "ImageObject", url: `${SITE_URL}/images/logos/logo.png` },
  },
  datePublished: "2025-05-01",
  dateModified: new Date().toISOString().split("T")[0],
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/workshop-management-system-benefits` },
  image: `${SITE_URL}/images/og/og-home.png`,
  keywords: "workshop management system, garage revenue, auto repair software India",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    { "@type": "ListItem", position: 3, name: "Workshop Management System Benefits", item: `${SITE_URL}/blog/workshop-management-system-benefits` },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a workshop management system?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A workshop management system is software that helps auto garages and vehicle repair workshops manage job cards, customer records, inventory, technician assignments, and invoicing from a single digital platform — replacing paper-based processes.",
      },
    },
    {
      "@type": "Question",
      name: "How does a workshop management system increase revenue?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A workshop management system increases revenue by allowing mechanics to handle more jobs per day through efficient task assignment, reducing billing errors that cause revenue leakage, enabling upselling through service history insights, and getting garages discovered by new customers via online listings.",
      },
    },
    {
      "@type": "Question",
      name: "Is a workshop management system worth it for a small garage in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Even a small 2-3 bay garage in India benefits significantly from a workshop management system. The time saved on paperwork, the reduction in billing errors, and the professional invoices often pay for the software subscription within the first week of use.",
      },
    },
  ],
};

const benefits = [
  {
    number: "01",
    title: "Handle More Jobs Per Day Without Hiring",
    body: `The biggest revenue bottleneck for most garages isn't a shortage of customers — it's capacity. When mechanics spend time asking "whose car is that?" or "what work needs doing next?", the workshop slows down.

A workshop management system assigns each mechanic clear digital job cards with priority levels and milestones. This alone can increase the number of jobs completed per day by 25–40%, directly growing your revenue without adding to your payroll.

Garages using Repairo report completing on average 8–12 more repair jobs per week after switching from paper systems.`,
  },
  {
    number: "02",
    title: "Eliminate Invoice Errors That Cost You Money",
    body: `Manual invoicing in garages is riddled with errors — parts get forgotten on bills, labour charges are underquoted, and GST calculations are wrong. Each error either costs you money or creates disputes with customers.

A workshop management system auto-generates invoices directly from the job card, pulling in every part used and every service logged. There's nothing to forget, and the GST calculation is automatic. Indian garage owners report recovering ₹5,000–₹20,000/month in previously un-billed charges after switching to digital invoicing.`,
  },
  {
    number: "03",
    title: "Convert First-Time Visitors Into Repeat Customers",
    body: `Repeat customers are worth 5–7x more to your garage than new ones — they spend more, trust your prices, and refer friends. But most garages have no system to track who came in last month or when a customer's next service is due.

A workshop management system maintains a complete CRM with every customer's vehicle history, past repairs, and contact number. Use this to send service reminders via WhatsApp: "Your Maruti Swift's next oil change is due in 500 km" brings customers back before they think of going elsewhere.`,
  },
  {
    number: "04",
    title: "Reduce Spare Parts Wastage and Over-Purchasing",
    body: `Parts inventory is where many garages silently lose money. Without tracking, mechanics over-order parts, some go unused, others are used but not billed. The combined loss can be significant.

Workshop management software tracks every part in and out — linking each one to a specific job card. You get accurate inventory counts, low-stock alerts, and clear data on what parts move fast vs. what's sitting idle. Garages report 15–25% reduction in parts wastage within the first three months.`,
  },
  {
    number: "05",
    title: "Get Discovered by New Customers Online",
    body: `When a vehicle owner in your city searches "best garage near me" or "mechanic in Kochi", does your workshop appear? For most independent garages in India, the answer is no — because they have no online presence.

Platforms like Repairo include a public workshop finder that automatically lists your garage with your name, address, contact details, services offered, and operating hours. New customers find your workshop through the platform and can call you directly — with zero marketing effort on your part.`,
  },
  {
    number: "06",
    title: "Build Trust With Professional Invoices and Reports",
    body: `Customers compare garages based on trust and professionalism. A garage that hands over a printed, itemized PDF invoice with your logo, GST number, and WhatsApp-shareable link feels more credible than one that scrawls numbers on a notebook.

Professional invoicing through a workshop management system upgrades how customers perceive your business — making them more comfortable with your pricing, more likely to return, and more likely to recommend your workshop to family and friends.`,
  },
  {
    number: "07",
    title: "Make Data-Driven Decisions With Revenue Reports",
    body: `Most garage owners have no idea which services bring in the most revenue, which mechanic is most productive, or which months are slowest. Without data, you can't make smart business decisions.

A workshop management system gives you real-time revenue dashboards — daily, weekly, and monthly reports broken down by service type, technician, and customer. Use this data to offer seasonal promotions when business is slow, reward top performers, and double down on your most profitable services.`,
  },
];

export default function WorkshopManagementBenefitsPage() {
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
          <span className="text-foreground">Workshop Management System Benefits</span>
        </nav>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-[1px] w-6 bg-primary" />
            <span className="font-mono text-[10px] text-primary uppercase tracking-[0.3em]">Business Tips · 2025</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight mb-6">
            7 Ways a{" "}
            <span className="text-primary">Workshop Management System</span>{" "}
            Grows Your Garage Revenue
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            Discover how switching to a digital workshop management system can directly increase the revenue of your Indian auto garage — without hiring more staff or expanding your space.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5"><Clock size={12} /> 8 min read</span>
            <span>·</span>
            <span>Updated May 2025</span>
            <span>·</span>
            <span>By Repairo Team</span>
          </div>
        </header>

        {/* Intro */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-12">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground text-sm">Quick Summary</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Indian garages that adopt a workshop management system report serving <strong className="text-foreground">25–40% more jobs per day</strong>, recovering <strong className="text-foreground">₹5,000–₹20,000/month</strong> in previously un-billed charges, and converting significantly more first-time visitors into loyal repeat customers — often within the first month.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-16">
          {benefits.map((b, i) => (
            <section key={b.number} id={`benefit-${b.number}`}>
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-mono font-black text-primary text-sm">
                  {b.number}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-black text-foreground mb-4 leading-tight">
                    {b.title}
                  </h2>
                  {b.body.split("\n\n").map((para, j) => (
                    <p key={j} className="text-muted-foreground leading-relaxed mb-4 last:mb-0">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
              {i < benefits.length - 1 && <div className="mt-12 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />}
            </section>
          ))}
        </div>

        {/* Summary Checklist */}
        <div className="mt-16 bg-card border border-border rounded-2xl p-8">
          <h2 className="text-xl font-black text-foreground mb-6">The Complete Workshop Management System Checklist</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Digital job card creation & assignment",
              "Real-time repair status tracking",
              "GST-compliant PDF invoice generation",
              "WhatsApp invoice sharing",
              "Customer & vehicle history CRM",
              "Technician workload management",
              "Spare parts inventory tracking",
              "Revenue & analytics dashboard",
              "Public workshop finder listing",
              "Role-based staff access control",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            All of the above are included in <strong className="text-foreground">Repairo</strong> — India's leading workshop management system — starting at ₹2,999/month.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16">
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
        </div>

        {/* Related Articles */}
        <div className="mt-16">
          <h2 className="text-xl font-black text-foreground mb-6">Related Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/blog/garage-management-software-guide" className="group block bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">Software Guide</p>
              <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors leading-snug">
                Complete Guide to Garage Management Software in India (2025)
              </h3>
            </Link>
            <Link href="/pricing" className="group block bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">Pricing</p>
              <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors leading-snug">
                Repairo Pricing — ₹2,999/month, Everything Included
              </h3>
            </Link>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-black text-foreground mb-2">Ready to implement your workshop management system?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Join 300+ workshops in Kerala already using Repairo. 30-day free trial, no credit card required.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Get Started Free <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
