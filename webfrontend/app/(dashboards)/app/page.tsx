"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, LogOut } from "lucide-react";

export default function WorkshopAppDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Basic standard authentication guard
    const token = localStorage.getItem("workshop_token");
    const rawUser = localStorage.getItem("workshop_user");

    if (!token || !rawUser) {
      router.replace("/login");
      return;
    }

    try {
      setUser(JSON.parse(rawUser));
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background font-mono">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  function handleLogout() {
    localStorage.removeItem("workshop_token");
    localStorage.removeItem("workshop_user");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-background font-mono">
     
    </div>
  );
}

