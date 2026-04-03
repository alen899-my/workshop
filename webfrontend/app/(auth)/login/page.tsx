"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

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
            <span className="w-6 h-px bg-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              {badge}
            </span>
          </div>
        )}
        <h1 className="font-bold text-3xl sm:text-4xl tracking-tight leading-tight text-foreground uppercase">
          {title}
        </h1>
        <p className="text-muted-foreground font-medium text-sm leading-relaxed">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <div className="w-2 h-2 bg-primary rotate-45 flex-shrink-0" />
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="w-full">{children}</div>

      {footer && (
        <div className="text-center text-sm font-medium text-muted-foreground mt-2">
          {footer}
        </div>
      )}
    </div>
  );
}

const loginSchema = z.object({
  phone: z.string().min(8, "Invalid phone number"),
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
        if (key && !errs[key]) errs[key] = (issue as any).message || issue.message;
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
    <div className="h-screen flex bg-background font-mono overflow-hidden">
      {/* ── LEFT: Form panel ── */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-6 sm:px-12 py-12 relative z-10 overflow-y-auto h-full no-scrollbar">
        
        {/* Brand Header */}
        <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
          <Link href="/" className="flex items-center flex-shrink-0">
            <span className="font-mono font-bold text-xl tracking-[0.2em] text-foreground uppercase">
              Veh<span className="text-primary">Rep</span>
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
                  className="font-bold text-primary underline underline-offset-4 hover:opacity-80 transition-colors"
                >
                  Register your shop
                </Link>
              </span>
            }
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">Phone Number</label>
                <PhoneInput
                  country="in"
                  value={form.phone}
                  onChange={(phone) => setForm({ ...form, phone: `+${phone}` })}
                  containerClass="!w-full"
                  inputClass="!w-full !h-[42px] !bg-background !border !border-border !text-foreground !text-sm !rounded-md !px-4 !py-2.5 !pl-12 focus:!border-primary focus:!ring-2 focus:!ring-primary/10 transition-all duration-200"
                  buttonClass="!bg-background !border !border-border !border-r-0 !rounded-l-md hover:!bg-muted"
                  dropdownClass="!bg-card !border !border-border !text-foreground !shadow-xl !rounded-md"
                  searchClass="!bg-muted !border !border-border !text-foreground"
                />
                {errors.phone && <span className="text-[10px] text-destructive font-bold ml-1">{errors.phone}</span>}
              </div>

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
                  className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
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
      <div className="hidden lg:flex flex-1 relative bg-muted">
        <Image
          src="/images/auth/authpageimage1.jpg"
          alt="Vehicle repair workshop"
          fill
          className="object-cover object-center"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--foreground)/0.2] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}