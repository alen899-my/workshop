import { Metadata } from "next";
import { NavbarWhite } from "@/layout/Navbar";
import { Footer } from "@/layout/Footer";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Wrench, BarChart3, FileText, Users, Package } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo-garage.vercel.app";

export const metadata: Metadata = {
  title: "Complete Guide to Garage Management Software in India (2025) | Repairo",
  description:
    "Everything you need to know about garage management software in India. Learn how workshop management systems improve job card tracking, GST invoicing, inventory, and customer management for auto garages in Kerala and across India.",
  keywords: [
    "garage management software India",
    "workshop management software",
    "garage management system",
    "auto workshop software India",
    "garage software Kerala",
    "workshop management system India",
    "car repair shop software",
    "mechanic shop management",
    "auto repair management software",
    "garage billing software India",
    "workshop job card software",
    "garage CRM India",
    "best garage software 2025",
    "free garage management software India",
  ],
  alternates: {
    canonical: `${SITE_URL}/blog/garage-management-software-guide`,
  },
  openGraph: {
    title: "Complete Guide to Garage Management Software in India (2025)",
    description:
      "How modern workshop management software transforms auto garages — job cards, GST invoicing, inventory tracking, and customer management explained.",
    url: `${SITE_URL}/blog/garage-management-software-guide`,
    images: [{ url: "/images/og/og-home.png", width: 1200, height: 630, alt: "Garage Management Software Guide" }],
  },
  twitter: {
    title: "Complete Guide to Garage Management Software in India 2025",
    description: "How workshop management software helps Indian garages go digital — job cards, billing, inventory & more.",
    images: ["/images/og/og-home.png"],
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Complete Guide to Garage Management Software in India (2025)",
  description:
    "Everything you need to know about garage management software in India — from job card tracking to GST invoicing and customer management.",
  author: { "@type": "Organization", name: "Repairo", url: SITE_URL },
  publisher: {
    "@type": "Organization",
    name: "Repairo",
    logo: { "@type": "ImageObject", url: `${SITE_URL}/images/logos/logo.png` },
  },
  datePublished: "2025-01-01",
  dateModified: new Date().toISOString().split("T")[0],
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/garage-management-software-guide` },
  image: `${SITE_URL}/images/og/og-home.png`,
  keywords: "garage management software, workshop management, auto repair software India",
  articleSection: "Technology",
  about: [
    { "@type": "Thing", name: "Garage Management Software" },
    { "@type": "Thing", name: "Workshop Management System" },
    { "@type": "Thing", name: "Auto Repair Software" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is garage management software?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Garage management software is a digital platform that helps auto workshops and garages manage their daily operations — including job card creation, vehicle repair tracking, customer records, staff assignments, inventory management, and GST invoice generation. It replaces paper-based processes with a centralized digital system.",
      },
    },
    {
      "@type": "Question",
      name: "What is the best garage management software in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Repairo is one of the best garage management software options in India, particularly popular in Kerala. It offers job card management, GST invoicing, inventory tracking, customer CRM, technician management, and a public workshop finder — all at ₹2,999/month.",
      },
    },
    {
      "@type": "Question",
      name: "How much does workshop management software cost in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Workshop management software in India typically costs between ₹1,000 to ₹5,000 per month for standard plans. Repairo offers full-featured garage management software at ₹2,999/month with a 30-day free trial and no credit card required.",
      },
    },
    {
      "@type": "Question",
      name: "Does garage management software support GST billing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Most modern garage management software in India includes GST-compliant invoice generation. Repairo generates PDF invoices with itemized parts, labour charges, CGST/SGST breakdowns, and supports WhatsApp sharing directly from the job card.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use workshop management software on a mobile phone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Cloud-based workshop management software like Repairo is fully mobile-responsive and can be accessed from any smartphone, tablet, or computer without installing any app. This allows mechanics and owners to manage repairs on the go.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free workshop management software in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Repairo offers a 30-day free trial with no credit card required, giving you full access to all features including job cards, invoicing, inventory, and the workshop finder. After the trial, plans start at ₹2,999/month.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    {
      "@type": "ListItem",
      position: 3,
      name: "Garage Management Software Guide",
      item: `${SITE_URL}/blog/garage-management-software-guide`,
    },
  ],
};

const features = [
  {
    icon: <FileText className="w-5 h-5 text-primary" />,
    title: "Digital Job Card Management",
    desc: "Create, assign, and track job cards from vehicle intake to delivery. No more lost paperwork or missed repairs.",
  },
  {
    icon: <Wrench className="w-5 h-5 text-primary" />,
    title: "Real-Time Repair Tracking",
    desc: "Monitor the status of every repair in progress. Know which technician is working on which vehicle at any time.",
  },
  {
    icon: <FileText className="w-5 h-5 text-primary" />,
    title: "GST Invoice Generation",
    desc: "Generate professional PDF invoices with CGST/SGST breakdowns and share them via WhatsApp instantly.",
  },
  {
    icon: <Package className="w-5 h-5 text-primary" />,
    title: "Inventory & Parts Management",
    desc: "Track spare parts stock, set reorder alerts, and link parts directly to job cards for accurate billing.",
  },
  {
    icon: <Users className="w-5 h-5 text-primary" />,
    title: "Customer & Vehicle CRM",
    desc: "Maintain complete service history per vehicle. Store customer contact details and send follow-up reminders.",
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-primary" />,
    title: "Revenue & Performance Reports",
    desc: "Track daily, weekly, and monthly revenue. See top-performing technicians and most profitable services.",
  },
];

const tableOfContents = [
  { id: "what-is", label: "What is Garage Management Software?" },
  { id: "why-need", label: "Why Your Workshop Needs It" },
  { id: "key-features", label: "Key Features to Look For" },
  { id: "benefits", label: "Benefits for Indian Garages" },
  { id: "how-to-choose", label: "How to Choose the Right Software" },
  { id: "repairo", label: "Repairo: Built for Indian Garages" },
  { id: "faq", label: "Frequently Asked Questions" },
];

export default function GarageManagementGuide() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <NavbarWhite />

      {/* Breadcrumb */}
      <div className="pt-28 pb-0 px-6 max-w-4xl mx-auto">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-foreground">Garage Management Software Guide</span>
        </nav>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-[1px] w-6 bg-primary" />
            <span className="font-mono text-[10px] text-primary uppercase tracking-[0.3em]">Workshop Management Guide · 2025</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight mb-6">
            Complete Guide to{" "}
            <span className="text-primary">Garage Management Software</span>{" "}
            in India (2025)
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            Everything you need to know about modern workshop management software — from job card tracking and GST invoicing to
            inventory control and customer management. Built specifically for Indian auto garages and mechanics.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5"><Clock size={12} /> 12 min read</span>
            <span>·</span>
            <span>Updated May 2025</span>
            <span>·</span>
            <span>By Repairo Team</span>
          </div>
        </header>
      </div>

      {/* Main layout: sidebar TOC + content */}
      <div className="px-6 max-w-6xl mx-auto pb-24 flex flex-col lg:flex-row gap-12">

        {/* Sidebar TOC */}
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-28 bg-card border border-border rounded-2xl p-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold mb-4">Table of Contents</p>
            <nav>
              <ol className="space-y-2">
                {tableOfContents.map((item, i) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                    >
                      <span className="font-mono text-[10px] text-primary/60 w-4">{i + 1}.</span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="mt-6 pt-6 border-t border-border">
              <Link
                href="/signup"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold text-xs font-mono uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all"
              >
                Try Free for 30 Days <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </aside>

        {/* Article Body */}
        <article className="flex-1 max-w-3xl prose prose-neutral dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-muted-foreground">

          {/* Section 1 */}
          <section id="what-is" className="mb-16 not-prose">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">What is Garage Management Software?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">Garage management software</strong> (also called workshop management software or auto repair management system) is a cloud-based digital platform that helps vehicle repair shops and automobile workshops manage their entire operation from a single dashboard.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Instead of relying on paper job cards, manual ledgers, and verbal communication between mechanics — garage management software centralizes everything: repair jobs, customer records, vehicle history, spare parts inventory, invoices, and staff assignments.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              In India, where thousands of independent garages and multi-bay workshops operate without any digital system, the shift to <strong className="text-foreground">workshop management software</strong> represents a massive leap in operational efficiency, customer satisfaction, and revenue growth.
            </p>
          </section>

          {/* Section 2 */}
          <section id="why-need" className="mb-16 not-prose">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">Why Your Workshop Needs Management Software</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Most Indian garage owners face the same daily challenges: vehicles pile up without clear priority, mechanics don't know which job is next, customers call repeatedly asking for updates, and invoicing is slow and error-prone.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { problem: "Paperwork gets lost or damaged", solution: "All job cards stored digitally in the cloud" },
                { problem: "Mechanics unsure what to work on", solution: "Assigned jobs with clear priorities and milestones" },
                { problem: "Billing errors and GST miscalculations", solution: "Auto-generated, GST-compliant PDF invoices" },
                { problem: "No service history for returning vehicles", solution: "Complete vehicle & customer records with full history" },
                { problem: "Inventory running out unexpectedly", solution: "Real-time parts tracking with low-stock alerts" },
                { problem: "Customers don't know repair status", solution: "Status updates via WhatsApp-shared invoices" },
              ].map(({ problem, solution }) => (
                <div key={problem} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-destructive font-bold mb-1">❌ {problem}</p>
                  <p className="text-xs text-primary font-bold">✅ {solution}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section id="key-features" className="mb-16 not-prose">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">Key Features to Look For in Garage Management Software</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              When evaluating <strong className="text-foreground">workshop management systems</strong> for your garage in India, these are the essential features that will make the biggest difference to your daily operations:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">{f.icon}</div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 */}
          <section id="benefits" className="mb-16 not-prose">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">Benefits of Workshop Management Software for Indian Garages</h2>
            <div className="space-y-6">
              {[
                {
                  title: "Faster Vehicle Turnaround",
                  body: "When mechanics have clear digital job assignments and milestones, repair turnaround time drops significantly. Garages using Repairo report completing 30-40% more jobs per day after switching from paper systems.",
                },
                {
                  title: "GST Compliance Made Simple",
                  body: "Generating GST-compliant invoices manually is time-consuming and error-prone. Workshop management software auto-calculates CGST, SGST, and IGST based on your registered location, keeping your garage 100% tax-compliant.",
                },
                {
                  title: "Better Customer Retention",
                  body: "A complete CRM that stores each customer's vehicle history, previous services, and contact details lets you send service reminders and build long-term loyalty — turning one-time visitors into regular clients.",
                },
                {
                  title: "Reduced Parts Wastage",
                  body: "Inventory management features track every spare part used per job, giving you accurate data to negotiate better with suppliers and eliminate over-purchasing.",
                },
                {
                  title: "Online Discoverability",
                  body: "Platforms like Repairo include a public workshop finder that lists your garage for free. Customers searching for 'mechanic near me' or 'garage in Kochi' can find and contact your workshop directly.",
                },
              ].map(({ title, body }) => (
                <div key={title} className="flex gap-4">
                  <div className="mt-1 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5 */}
          <section id="how-to-choose" className="mb-16 not-prose">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">How to Choose the Right Garage Management Software in India</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              With several options available in the Indian market, here's what to evaluate when choosing garage management software:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border border-border rounded-xl overflow-hidden text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-4 py-3 text-foreground font-bold text-xs uppercase tracking-wider">Criterion</th>
                    <th className="text-left px-4 py-3 text-foreground font-bold text-xs uppercase tracking-wider">What to Check</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["GST Invoicing", "Must generate CGST/SGST compliant invoices for Indian tax filing"],
                    ["Mobile Access", "Works on smartphones without installing an app (web-based)"],
                    ["Cloud Storage", "Data stored securely in the cloud — accessible from anywhere"],
                    ["Free Trial", "Offers a trial period before committing to a subscription"],
                    ["Customer Support", "Hindi/regional language support, WhatsApp or phone contact"],
                    ["Pricing Transparency", "Clear monthly pricing with no hidden charges or per-user fees"],
                    ["Training & Onboarding", "Quick setup with video guides or onboarding support available"],
                  ].map(([criterion, check], i) => (
                    <tr key={i} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                      <td className="px-4 py-3 font-semibold text-foreground">{criterion}</td>
                      <td className="px-4 py-3 text-muted-foreground">{check}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6: Repairo CTA */}
          <section id="repairo" className="mb-16 not-prose">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">Repairo: Garage Management Software Built for Indian Workshops</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              <strong className="text-foreground">Repairo</strong> is India's leading workshop management platform, purpose-built for auto garages in Kerala and across India. Unlike generic business software, every feature in Repairo was designed around how Indian mechanics and garage owners actually work.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[
                  "Digital Job Card Creation & Assignment",
                  "Real-Time Repair Status Tracking",
                  "GST-Compliant PDF Invoice Generation",
                  "WhatsApp Invoice Sharing",
                  "Customer & Vehicle History CRM",
                  "Technician Workload Management",
                  "Spare Parts Inventory Tracking",
                  "Public Workshop Finder Listing",
                  "Revenue & Analytics Dashboard",
                  "Role-Based Staff Permissions",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {feat}
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all"
                >
                  Start Free Trial — No Card Needed <ArrowRight size={14} />
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border text-foreground font-bold text-sm rounded-xl hover:border-primary/30 transition-all"
                >
                  View Pricing — ₹2,999/month
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="mb-16 not-prose">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqSchema.mainEntity.map((faq) => (
                <details
                  key={faq.name}
                  className="group bg-card border border-border rounded-xl overflow-hidden"
                >
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

          {/* Final CTA */}
          <section className="not-prose">
            <div className="bg-card border border-primary/20 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-black text-foreground mb-2">Ready to Digitize Your Garage?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Join 300+ workshops in Kerala already using Repairo. 30-day free trial, no credit card required.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Get Started Free <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </article>
      </div>

      <Footer />
    </div>
  );
}
