"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";

function AuthFormWrapper({
  badge,
  title,
  subtitle,
  children,
  footer,
}: {
  badge?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-[440px] mx-auto">
      <div className="flex flex-col gap-3">
        {badge && (
          <div className="flex items-center gap-3 mb-1">
            <span className="w-6 h-px bg-[oklch(0.38_0.13_248)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[oklch(0.38_0.13_248)]">
              {badge}
            </span>
          </div>
        )}
        <h1 className="font-bold text-3xl sm:text-4xl tracking-tight leading-tight text-[oklch(0.15_0.025_240)] uppercase">
          {title}
        </h1>
        <p className="text-[oklch(0.48_0.04_240)] font-medium text-sm leading-relaxed">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-[oklch(0.82_0.022_235)]" />
        <div className="w-2 h-2 bg-[oklch(0.38_0.13_248)] rotate-45 flex-shrink-0" />
        <div className="flex-1 h-px bg-[oklch(0.82_0.022_235)]" />
      </div>

      <div className="w-full">{children}</div>

      {footer && (
        <div className="text-center text-sm font-medium text-[oklch(0.48_0.04_240)] mt-2">
          {footer}
        </div>
      )}
    </div>
  );
}

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .transform((val) => val.replace(/[\s\-+]/g, ""))
    .pipe(z.string().regex(/^\d{7,15}$/, "Enter a valid phone number")),
  password: z.string().min(6, "Minimum 6 characters"),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [form, setForm] = useState({ phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem("workshop_token");
    if (token) {
      router.replace("/app");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString();
        if (key && !errs[key]) errs[key] = issue.message;
      });
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({ type: "error", title: "Login Failed", description: data.error || "Authentication failed" });
        return;
      }

      localStorage.setItem("workshop_token", data.token);
      localStorage.setItem("workshop_user", JSON.stringify(data.data));

      toast({ type: "success", title: "Welcome back", description: "Loading your dashboard..." });
      router.push("/app");
      
    } catch (error) {
      toast({ type: "error", title: "Network Error", description: "Failed to connect to the server." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex bg-white font-mono overflow-hidden">
      {/* ── LEFT: Form panel ── */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-6 sm:px-12 py-12 relative z-10 overflow-y-auto h-full no-scrollbar">
        
        {/* Brand Header */}
        <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
          <Link href="/" className="flex items-center flex-shrink-0">
            <span className="font-mono font-bold text-xl tracking-[0.2em] text-[oklch(0.15_0.025_240)] uppercase">
              Veh<span className="text-[oklch(0.38_0.13_248)]">Rep</span>
            </span>
          </Link>
        </div>

        <div className="mt-16">
          <AuthFormWrapper
            badge="Welcome back"
            title="Log In"
            subtitle="Access your active job cards, invoices, and technician status."
            footer={
              <span>
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-bold text-[oklch(0.38_0.13_248)] underline underline-offset-4 hover:text-[oklch(0.45_0.15_248)] transition-colors"
                >
                  Register your shop
                </Link>
              </span>
            }
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
              <AuthFormField
                label="Phone Number"
                type="tel"
                placeholder="09876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                error={errors.phone}
                autoComplete="tel"
              />

              <div className="flex flex-col gap-1.5 items-end">
                <AuthFormField
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  error={errors.password}
                  autoComplete="current-password"
                />
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-bold uppercase tracking-widest text-[oklch(0.48_0.04_240)] hover:text-[oklch(0.38_0.13_248)] transition-colors"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>

              <WorkshopButton
                type="submit"
                variant="primary"
                size="xl"
                fullWidth
                loading={loading}
                className="mt-2"
              >
                Sign In to Dashboard
              </WorkshopButton>

            </form>
          </AuthFormWrapper>
        </div>
      </div>

      {/* ── RIGHT: Image panel ── */}
      <div className="hidden lg:flex flex-1 relative bg-[oklch(0.96_0.008_240)]">
        <Image
          src="/images/auth/authpageimage1.jpg"
          alt="Vehicle repair workshop"
          fill
          className="object-cover object-center"
          priority
          sizes="50vw"
        />
        
        {/* Subtle bottom gradient just to ground elements slightly */}
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.13_0.03_248/0.25)] to-transparent pointer-events-none" />
        
        {/* Floating Review Card */}
        <div className="absolute bottom-16 right-16 z-20">
          <div className="bg-white/90 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-xl max-w-sm">
            <div className="flex gap-1 mb-3 text-yellow-500 text-sm">
              ★★★★★
            </div>
            <p className="text-[oklch(0.15_0.025_240)] font-medium leading-relaxed italic text-sm">
              &quot;VehRep completely transformed our repair bay. No more lost job cards and instant billing directly from my phone.&quot;
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[oklch(0.38_0.13_248)] flex items-center justify-center font-bold text-white uppercase text-xs">
                MD
              </div>
              <div>
                <p className="font-bold text-sm text-[oklch(0.15_0.025_240)]">Michael Davis</p>
                <p className="text-xs text-[oklch(0.48_0.04_240)]">Owner, Davis Auto Works</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}