"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavbarWhite  } from "@/layout/Navbar";
import { HeroSection } from "@/components/HeroSection";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("workshop_token");
    if (token) {
      router.replace("/app");
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-background font-mono">
      <NavbarWhite  />
      <HeroSection />
    </main>
  );
}