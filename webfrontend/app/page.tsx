"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavbarWhite } from "@/layout/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { permissionService } from "@/services/permission.service";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("workshop_token");
    if (token) {
      // Sync to cookies for middleware if missing
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
    <main className="min-h-screen bg-background font-mono">
      <NavbarWhite />
      <HeroSection />
    </main>
  );
}