"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavbarWhite } from "@/layout/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/pages/Featuressection";
import { CTASection } from "@/components/pages/Ctasection";
import { PreviewSection } from "@/components/pages/Previewsection";
import { MarqueeSection } from "@/components/pages/Marqueesection";
import { permissionService } from "@/services/permission.service";
import { Footer } from "@/layout/Footer";

export default function HomePageContent() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("workshop_token") : null;
    if (token) {
      if (!document.cookie.includes("workshop_token") || !document.cookie.includes("workshop_permissions")) {
        const fetchAndSync = async () => {
          const storedUser = localStorage.getItem("workshop_user");
          const user = storedUser ? JSON.parse(storedUser) : null;
          const role = user?.role || "worker";
          const permsRes = await permissionService.getRolePermissions(role);
          const perms = permsRes.success ? permsRes.data?.join(',') : "";
          
          document.cookie = `workshop_token=${token}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `workshop_role=${role}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `workshop_permissions=${perms}; path=/; max-age=604800; SameSite=Lax`;
          router.refresh(); 
        };
        fetchAndSync();
      } else {
        router.replace("/app");
      }
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-background font-mono overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* Semantic regions for SEO */}
      <nav aria-label="Main Navigation">
        <NavbarWhite />
      </nav>

      <article>
        <section id="hero" aria-label="Hero Section">
          <HeroSection />
        </section>

    
        <section id="preview" aria-label="Product Preview">
          <PreviewSection />
        </section>

        <section id="features" aria-label="Core Features">
          <FeaturesSection />
        </section>

        <section id="conversion" aria-label="Call to Action">
          <CTASection />
        </section>
      </article>

      <Footer />
    </main>
  );
}
