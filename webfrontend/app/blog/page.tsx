"use client";

import { useState, useMemo } from "react";
import { Metadata } from "next";
import { NavbarWhite } from "@/layout/Navbar";
import { Footer } from "@/layout/Footer";
import Link from "next/link";
import { ArrowRight, Clock, ChevronRight } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo-garage.vercel.app";

// This would normally come from metadata export, but we're using "use client"
// So we'll document it separately
const BLOG_METADATA = {
  title: "Blog — Garage & Workshop Management Guides | Repairo",
  description:
    "Expert guides on garage management software, workshop management systems, GST invoicing for auto workshops, and running a successful vehicle repair business in India.",
};

interface Article {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  tags: string[];
  featured: boolean;
  author?: {
    name: string;
    role?: string;
  };
}

const articles: Article[] = [
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
    author: {
      name: "Alen Mohammed",
      role: "Founder & CEO",
    },
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
    author: {
      name: "Priya Kumar",
      role: "Business Consultant",
    },
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
    author: {
      name: "Rajesh Sharma",
      role: "Compliance Expert",
    },
  },
  {
    slug: "vehicle-inspection-tracking",
    category: "Software Guide",
    title: "Advanced Vehicle Inspection & Damage Tracking",
    excerpt:
      "Master the art of documenting vehicle conditions and tracking damage with photo annotations, repair estimates, and customer approval workflows.",
    readTime: "9 min read",
    date: "April 2025",
    tags: ["Inspection", "Documentation", "Best Practices"],
    featured: false,
    author: {
      name: "Vikram Patel",
      role: "Workshop Expert",
    },
  },
  {
    slug: "inventory-management-tips",
    category: "Business Tips",
    title: "Optimize Your Garage Inventory: Stock Management Best Practices",
    excerpt:
      "Learn how to maintain optimal inventory levels, reduce waste, track expiry dates, and integrate supplier management for your workshop.",
    readTime: "7 min read",
    date: "March 2025",
    tags: ["Inventory", "Cost Reduction", "Efficiency"],
    featured: false,
    author: {
      name: "Anaya Desai",
      role: "Operations Manager",
    },
  },
  {
    slug: "customer-retention-strategies",
    category: "Business Tips",
    title: "5 Proven Customer Retention Strategies for Auto Workshops",
    excerpt:
      "Build lasting customer relationships with follow-up automation, loyalty programs, and personalized service reminders that keep vehicles coming back.",
    readTime: "8 min read",
    date: "March 2025",
    tags: ["Customer Service", "Growth", "Retention"],
    featured: false,
    author: {
      name: "Meera Singh",
      role: "Customer Success Lead",
    },
  },
];

const CATEGORIES = ["All", "Software Guide", "Business Tips", "GST & Billing"];
const SORT_OPTIONS = [
  { id: "recent", label: "Most Recent" },
  { id: "popular", label: "Most Popular" },
  { id: "trending", label: "Trending" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className={`group block transition-all duration-300 ${
        featured
          ? "bg-card border border-primary/20 rounded-2xl p-8 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
          : "bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
      }`}
    >
      {featured && (
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-mono uppercase tracking-widest rounded-full font-bold flex items-center gap-1">
            ★ Featured
          </span>
          <span className="px-3 py-1 bg-secondary/20 text-secondary text-[10px] font-mono uppercase tracking-widest rounded-full">
            {article.category}
          </span>
        </div>
      )}

      <h2
        className={`font-black text-foreground mb-3 group-hover:text-primary transition-colors leading-tight ${
          featured ? "text-2xl sm:text-3xl" : "text-lg"
        }`}
      >
        {article.title}
      </h2>

      <p className={`leading-relaxed mb-5 ${featured ? "text-muted-foreground" : "text-sm text-muted-foreground line-clamp-2"}`}>
        {article.excerpt}
      </p>

      {featured && (
        <div className="mb-6 pb-6 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-primary-foreground">
              {article.author?.name && getInitials(article.author.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{article.author?.name}</p>
              <p className="text-xs text-muted-foreground">{article.author?.role}</p>
            </div>
          </div>
        </div>
      )}

      <div className={`flex items-center justify-between ${featured ? "" : "flex-col sm:flex-row gap-2"}`}>
        <div className={`flex items-center gap-3 font-mono ${featured ? "text-xs text-muted-foreground" : "text-xs text-muted-foreground"}`}>
          <span className="flex items-center gap-1">
            <Clock size={featured ? 14 : 12} />
            {article.readTime}
          </span>
          <span>·</span>
          <span>{article.date}</span>
        </div>
        <span className="flex items-center gap-1 text-primary font-bold group-hover:gap-2 transition-all text-sm">
          Read <ChevronRight size={featured ? 16 : 14} />
        </span>
      </div>
    </Link>
  );
}

export default function BlogIndexPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSort, setSelectedSort] = useState("recent");

  // Filter articles
  const filteredArticles = useMemo(() => {
    let filtered = articles.filter(
      (article) => selectedCategory === "All" || article.category === selectedCategory
    );

    // Sort
    if (selectedSort === "recent") {
      // Keep original order (already sorted by date descending in data)
    } else if (selectedSort === "popular") {
      // Shuffle for demo (in real app, would be based on views/engagement)
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }

    return filtered;
  }, [selectedCategory, selectedSort]);

  const featuredArticle = filteredArticles.find((a) => a.featured);
  const regularArticles = filteredArticles.filter((a) => !a.featured);

  return (
    <div className="min-h-screen bg-background">
      <NavbarWhite />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="pt-28 pb-16 px-6 max-w-7xl mx-auto">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-[1px] w-8 bg-primary" />
              <span className="font-mono text-[11px] text-primary uppercase tracking-[0.3em] font-bold">Repairo Blog</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-black text-foreground tracking-tight mb-6 leading-[1.1]">
              Garage & Workshop{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">Management</span>
                <span className="absolute -inset-2 bg-primary/10 rounded-lg -z-10" />
              </span>{" "}
              Guides
            </h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Expert guides to help Indian garage owners run smarter, more profitable workshops — from choosing the right software to mastering GST billing and customer retention.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="px-6 max-w-7xl mx-auto py-16">
        {/* Featured Article */}
        {featuredArticle && (
          <div className="mb-16">
            <ArticleCard article={featuredArticle} featured={true} />
          </div>
        )}

        {/* Filters & Sort */}
        <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-mono text-sm font-bold transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Sort:</label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-4 py-2 rounded-lg bg-muted text-foreground font-mono text-sm font-bold border border-border hover:border-primary/50 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22><path fill=%22%23666%22 d=%22M0 0l6 8 6-8z%22/></svg>')] bg-no-repeat bg-right bg-[length:1.2em] pr-8"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Articles Grid */}
        {regularArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {regularArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No articles found in this category.</p>
          </div>
        )}

        {/* Pagination (mock) */}
        {regularArticles.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-16">
            <button className="w-10 h-10 rounded-lg border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all flex items-center justify-center font-bold">
              ←
            </button>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${
                    page === 1
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button className="w-10 h-10 rounded-lg border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all flex items-center justify-center font-bold">
              →
            </button>
          </div>
        )}

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-foreground mb-3">Ready to digitize your workshop?</h3>
            <p className="text-muted-foreground max-w-md">
              Start your 30-day free trial. No credit card required. Join hundreds of garage owners already using Repairo.
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 whitespace-nowrap"
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
