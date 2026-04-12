"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Globe, MessageSquare, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Job Cards", href: "#job-cards" },
    { label: "Inventory", href: "#inventory" },
    { label: "Pricing", href: "#pricing" },
  ],
  company: [
    { label: "About Us", href: "#about" },
    { label: "Careers", href: "#careers" },
    { label: "Contact", href: "#contact" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
  resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Support Center", href: "/support" },
    { label: "API Reference", href: "/api" },
    { label: "Workshop Blog", href: "/blog" },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-background pt-24 pb-12 overflow-hidden border-t border-border/40 selection:bg-primary/20 transition-colors duration-500">
      
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-20">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-5 flex flex-col items-start gap-6">
            <Link href="/" className="inline-block">
               <img src="/images/logos/logo.png" alt="Repairo Logo" className="h-[40px] w-auto object-contain" />
            </Link>
            <p className="font-sans text-muted-foreground text-base max-w-sm leading-relaxed">
              The #1 vehicle repair management software built for modern garages in Kerala. 
              Digitize your workflow, tracking, and invoicing in real-time.
            </p>
            
            <div className="flex flex-col gap-4 mt-2">
              <a 
                href="mailto:alenjames899@gmail.com" 
                className="group flex items-center gap-3 text-foreground hover:text-primary transition-colors duration-300"
              >
                <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <span className="font-mono text-sm tracking-widest font-bold">alenjames899@gmail.com</span>
              </a>
              <a 
                href="tel:+918921837945" 
                className="group flex items-center gap-3 text-foreground hover:text-primary transition-colors duration-300"
              >
                <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <span className="font-mono text-sm tracking-widest font-bold">+91 8921837945</span>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-4">
            <div>
              <h4 className="font-mono text-[10px] tracking-[0.3em] uppercase text-foreground font-black mb-8">Product</h4>
              <ul className="flex flex-col gap-4">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-muted-foreground hover:text-primary text-sm font-medium transition-all hover:pl-1">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-mono text-[10px] tracking-[0.3em] uppercase text-foreground font-black mb-8">Platform</h4>
              <ul className="flex flex-col gap-4">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-muted-foreground hover:text-primary text-sm font-medium transition-all hover:pl-1">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-[10px] tracking-[0.3em] uppercase text-foreground font-black mb-8">Legal</h4>
              <ul className="flex flex-col gap-4">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="group flex items-center gap-1.5 text-muted-foreground hover:text-primary text-sm font-medium transition-all">
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-y-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <p className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground/60">
            © {currentYear} WORKSHOPPRO. ALL RIGHTS RESERVED.
          </p>

          <div className="flex items-center gap-6">
            <Link href="#" className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <Globe className="w-5 h-5" />
            </Link>
            <Link href="#" className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <MessageSquare className="w-5 h-5" />
            </Link>
            <Link href="#" className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <Mail className="w-5 h-5" />
            </Link>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
