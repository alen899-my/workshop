"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/layout/Appsidebar"
import { AppHeader } from "@/layout/AppHeader"
import { RBACProvider } from "@/lib/rbac"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("workshop_token");
    const saved = localStorage.getItem("workshop_user");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.error("Session parse error", e);
      }
    }

    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary" />
          <p className="text-xs font-medium tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <RBACProvider user={user}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          {/* App Header */}
          <AppHeader />

          {/* Themed Page Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar relative overflow-hidden">
            {/* Subtle Background Identity Shapes */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="max-w-7xl mx-auto pt-6 sm:pt-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RBACProvider>
  )
}