"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { AuthFormField } from "@/components/ui/AuthFormField";

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
    <div className="flex flex-col gap-8 w-full max-w-[500px] mx-auto">
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

interface FormState {
  shopName: string;
  location: string;
  ownerName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const INITIAL: FormState = {
  shopName: "",
  location: "",
  ownerName: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const signupSchema = z
  .object({
    shopName: z.string().min(1, "Required"),
    location: z.string().min(1, "Required"),
    ownerName: z.string().min(1, "Required"),
    phone: z
      .string()
      .min(1, "Required")
      .transform((val) => val.replace(/[\s\-+]/g, ""))
      .pipe(z.string().regex(/^\d{7,15}$/, "Invalid phone format")),
    password: z.string().min(6, "Min 6 chars"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Must match",
    path: ["confirmPassword"],
  });

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
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

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const errs: Partial<FormState> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormState;
        if (key && !errs[key]) errs[key] = issue.message;
      });
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register-shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({ type: "error", title: "Registration Failed", description: data.error || "Failed to create shop account" });
        return;
      }

      toast({ type: "success", title: "Registered Successfully", description: "You can now log into your account." });
      router.push("/login");

    } catch (error) {
      toast({ type: "error", title: "Network Error", description: "Failed to connect to the server." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex bg-white font-mono overflow-hidden">
      {/* ── LEFT: Form panel ── */}
      <div className="flex flex-col justify-start w-full lg:w-1/2 px-6 sm:px-12 py-12 relative z-10 overflow-y-auto h-full no-scrollbar">
        
        {/* Brand Header */}
        <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
          <Link href="/" className="flex items-center flex-shrink-0">
            <span className="font-mono font-bold text-xl tracking-[0.2em] text-[oklch(0.15_0.025_240)] uppercase">
              Veh<span className="text-[oklch(0.38_0.13_248)]">Rep</span>
            </span>
          </Link>
        </div>

        <div className="mt-20 my-auto">
            <AuthFormWrapper
              badge="Setup Account"
              title="Register Shop"
              subtitle="Set up your independent auto repair shop globally in under 2 minutes."
              footer={
                <span>
                  Already registered?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-[oklch(0.38_0.13_248)] underline underline-offset-4 hover:text-[oklch(0.45_0.15_248)] transition-colors"
                  >
                    Sign in
                  </Link>
                </span>
              }
            >
              <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <AuthFormField
                    label="Shop Name"
                    type="text"
                    placeholder="Speed Auto Works"
                    value={form.shopName}
                    onChange={set("shopName")}
                    error={errors.shopName}
                  />
                  <AuthFormField
                    label="Owner Name"
                    type="text"
                    placeholder="Rajan K."
                    value={form.ownerName}
                    onChange={set("ownerName")}
                    error={errors.ownerName}
                  />
                  <AuthFormField
                    label="Location"
                    type="text"
                    placeholder="Kochi, Kerala"
                    value={form.location}
                    onChange={set("location")}
                    error={errors.location}
                  />
                  <AuthFormField
                    label="Phone Number"
                    type="tel"
                    placeholder="09876543210"
                    value={form.phone}
                    onChange={set("phone")}
                    error={errors.phone}
                  />
                  <AuthFormField
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set("password")}
                    error={errors.password}
                  />
                  <AuthFormField
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    error={errors.confirmPassword}
                  />
                </div>

                <div className="mt-2">
                  <WorkshopButton
                    type="submit"
                    variant="primary"
                    size="xl"
                    fullWidth
                    loading={loading}
                  >
                    Register Workshop
                  </WorkshopButton>
                </div>

                <p className="text-xs text-center font-medium text-[oklch(0.60_0.06_235)] mt-2">
                  By registering, you agree to the{" "}
                  <Link href="/terms" className="text-[oklch(0.38_0.13_248)] underline underline-offset-2 hover:text-[oklch(0.15_0.025_240)]">
                    Terms of Service
                  </Link>
                  .
                </p>
              </form>
            </AuthFormWrapper>
        </div>
      </div>

      {/* ── RIGHT: Image panel ── */}
      <div className="hidden lg:flex flex-1 relative bg-[oklch(0.96_0.008_240)]">
        <Image
          src="/images/auth/authpageimage1.jpg"
          alt="Auto repair workshop"
          fill
          className="object-cover object-center"
          priority
          sizes="50vw"
        />
        
        {/* Extremely subtle protective bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.13_0.03_248/0.2)] to-transparent pointer-events-none" />
        
        {/* Floating Review Card */}
        <div className="absolute bottom-16 right-16 z-20">
          <div className="bg-white/90 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-xl max-w-sm">
            <div className="flex gap-1 mb-3 text-yellow-500 text-sm">
              ★★★★★
            </div>
            <p className="text-[oklch(0.15_0.025_240)] font-medium leading-relaxed italic text-sm">
              &quot;The onboarding took 2 minutes. Now our entire 4-bay workshop is managed effortlessly from the primary screen. Unbelievable value.&quot;
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[oklch(0.38_0.13_248)] flex items-center justify-center font-bold text-white uppercase text-xs">
                SV
              </div>
              <div>
                <p className="font-bold text-sm text-[oklch(0.15_0.025_240)]">Sarah V.</p>
                <p className="text-xs text-[oklch(0.48_0.04_240)]">Manager, QuickFix Garage</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}