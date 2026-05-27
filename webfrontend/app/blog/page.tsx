import { Metadata } from "next";
import { NavbarWhite } from "@/layout/Navbar";
import { Footer } from "@/layout/Footer";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo-garage.vercel.app";

export const metadata: Metadata = {
  title: "Blog — Garage & Workshop Management Guides | Repairo",
  description:
    "Expert guides on garage management software, workshop management systems, GST invoicing for auto workshops, and running a successful vehicle repair business in India.",
  keywords: [
    "garage management blog",
    "workshop management tips India",
    "auto repair software guide",
    "garage software tips",
    "mechanic business tips India",
    "GST invoicing garage",
  ],
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Blog — Garage & Workshop Management Guides | Repairo",
    description:
      "Expert guides on running a modern, digital auto workshop in India. Job cards, invoicing, inventory, and customer management explained.",
    url: `${SITE_URL}/blog`,
    images: [{ url: "/images/og/og-home.png", width: 1200, height: 630, alt: "Repairo Blog" }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
  ],
};

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Repairo Blog — Garage & Workshop Management Guides",
  url: `${SITE_URL}/blog`,
  description: "Expert guides on garage management software and workshop management for Indian auto repair businesses.",
  publisher: {
    "@type": "Organization",
    name: "Repairo",
    logo: { "@type": "ImageObject", url: `${SITE_URL}/images/logos/logo.png` },
  },
};

const articles = [
  {
    slug: "garage-management-software-guide",
    category: "Software Guide",
    title: "Complete Guide to Garage Management Software in India (2025)",
    excerpt:
      "Everything you need to know about modern workshop management software — from job card tracking and GST invoicing to inventory control and customer management.",
    readTime: "12 min read",
    date: "May 2025",
    tags: ["Garage Software", "Workshop Management", "India"],
    featured: true,
  },
  {
    slug: "workshop-management-system-benefits",
    category: "Business Tips",
    title: "7 Ways a Workshop Management System Grows Your Garage Revenue",
    excerpt:
      "Discover how switching from paper to a digital workshop management system can directly increase revenue, reduce costs, and improve customer retention for your auto garage.",
    readTime: "8 min read",
    date: "May 2025",
    tags: ["Revenue", "Workshop Tips", "Management"],
    featured: false,
  },
  {
    slug: "gst-invoicing-garage-india",
    category: "GST & Billing",
    title: "GST Invoicing for Auto Garages in India: A Complete Guide",
    excerpt:
      "How to generate proper GST-compliant invoices for your garage — CGST, SGST, HSN codes for auto parts and services, and how software makes it effortless.",
    readTime: "10 min read",
    date: "April 2025",
    tags: ["GST", "Invoicing", "Compliance"],
    featured: false,
  },
];

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      <NavbarWhite />

      <div className="pt-28 pb-24 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-[1px] w-6 bg-primary" />
            <span className="font-mono text-[10px] text-primary uppercase tracking-[0.3em]">Repairo Blog</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-4">
            Garage & Workshop{" "}
            <span className="text-primary">Management Guides</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Expert guides to help Indian garage owners run smarter, more profitable workshops — from choosing the right software to mastering GST billing.
          </p>
        </div>

        {/* Featured Article */}
        {articles.filter((a) => a.featured).map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group block mb-10 bg-card border border-primary/20 rounded-2xl p-8 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-mono uppercase tracking-widest rounded-full font-bold">
                ★ Featured
              </span>
              <span className="px-3 py-1 bg-muted text-muted-foreground text-[10px] font-mono uppercase tracking-widest rounded-full">
                {article.category}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
              {article.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-5">{article.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><Clock size={11} />{article.readTime}</span>
                <span>·</span>
                <span>{article.date}</span>
              </div>
              <span className="flex items-center gap-1 text-primary text-sm font-bold group-hover:gap-2 transition-all">
                Read Article <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        ))}

        {/* Article Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {articles.filter((a) => !a.featured).map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group block bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <span className="px-2.5 py-1 bg-muted text-muted-foreground text-[9px] font-mono uppercase tracking-widest rounded-full mb-3 inline-block">
                {article.category}
              </span>
              <h2 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                {article.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{article.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                  <Clock size={10} />{article.readTime}
                </span>
                <span className="text-primary text-xs font-bold group-hover:underline flex items-center gap-1">
                  Read <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-16 bg-primary/5 border border-primary/20 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">Ready to digitize your workshop?</h3>
            <p className="text-sm text-muted-foreground mt-1">Start your 30-day free trial. No credit card required.</p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all"
          >
            Get Started Free <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
