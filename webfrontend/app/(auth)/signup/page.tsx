"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { WorkshopSearchableSelect } from "@/components/ui/WorkshopSearchableSelect";
import { Country } from "country-state-city";
import countryToCurrency from "country-to-currency";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

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
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
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

      <div className="w-full">{children}</div>

      {footer && (
        <div className="text-center text-sm font-medium text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}

interface FormState {
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  country: string;
  currency: string;
  password: string;
  confirmPassword: string;
}

const INITIAL: FormState = {
  shopName: "",
  ownerName: "",
  phone: "",
  email: "",
  country: "IN",
  currency: "INR",
  password: "",
  confirmPassword: "",
};

const signupSchema = z
  .object({
    shopName: z.string().min(1, "Required"),
    ownerName: z.string().min(1, "Required"),
    phone: z.string().min(8, "Invalid phone"),
    email: z.string().email("Invalid email"),
    country: z.string().min(1, "Required"),
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

  useEffect(() => {
    const token = localStorage.getItem("workshop_token");
    if (token) {
      router.replace("/app");
    } else {
      setChecking(false);
    }
  }, [router]);

  const countryOptions = React.useMemo(
    () => Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name })),
    []
  );

  if (checking) return null;

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const errs: Partial<FormState> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormState;
        if (key && !errs[key]) errs[key] = (issue as any).message;
      });
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const payload = { ...form, location: "Not Set" };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register-shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({ type: "error", title: "Registration Failed", description: data.error || "Could not register shop" });
        return;
      }

      toast({ type: "success", title: "Registered Successfully", description: "You can now log in." });
      router.push("/login");
    } catch (error) {
      toast({ type: "error", title: "Network Error", description: "Connectivity issue with the server" });
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Outer shell: full viewport, centered on both axes always */
    <div className="min-h-screen relative flex items-center justify-center font-mono p-0 sm:p-10">

      {/* Background image (desktop only) */}
      <div className="absolute inset-0 z-0 hidden sm:block">
        <Image
          src="/images/auth/auth.jpg"
          alt="Workshop Background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      {/* Card — wider on desktop, full-screen on mobile */}
      <div className="relative z-10 w-full sm:max-w-[800px]">
        <div className="
          bg-background sm:bg-card
          border-0 sm:border sm:border-border
          shadow-none sm:shadow-2xl
          rounded-none sm:rounded-2xl
          min-h-screen sm:min-h-0
          flex flex-col items-center justify-center
          px-7 py-14
          sm:px-16 sm:py-
        ">

          {/* Logo — centered, tall */}
          <div className="w-full flex justify-center ">
            <img
              src="/images/logos/logo.png"
              alt="Repairo Logo"
              className="h-[120px] sm:h-[150px] w-auto object-contain"
            />
          </div>

          {/* Form wrapper */}
          <div className="w-full">
            <AuthFormWrapper
              badge="Setup Account"
              title="Register Workshop"
              subtitle="Register your workshop to get started"
              footer={
                <span className="text-muted-foreground/80">
                  Already registered?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                  >
                    Sign in
                  </Link>
                </span>
              }
            >
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Shop & Owner Names */}
                  <div className="sm:col-span-1">
                    <AuthFormField
                      label="Shop Name"
                      type="text"
                      placeholder="Speed Auto Works"
                      value={form.shopName}
                      onChange={set("shopName")}
                      error={errors.shopName}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <AuthFormField
                      label="Owner Name"
                      type="text"
                      placeholder="Rajan K."
                      value={form.ownerName}
                      onChange={set("ownerName")}
                      error={errors.ownerName}
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="sm:col-span-1 flex flex-col gap-2">
                    <label className="text-xs font-normal text-muted-foreground ml-0.5">
                      Phone Number
                    </label>
                    <PhoneInput
                      country={form.country.toLowerCase()}
                      value={form.phone}
                      onChange={(phone) => setForm((f) => ({ ...f, phone: `+${phone}` }))}
                      containerClass="!w-full"
                      inputClass="!w-full !h-[42px] !bg-background !border !border-border !text-foreground !text-sm !rounded-md !px-4 !py-2.5 !pl-12 focus:!border-primary focus:!ring-2 focus:!ring-primary/10 transition-all duration-200"
                      buttonClass="!bg-transparent !border !border-border !border-r-0 !rounded-l-md hover:!bg-muted/50"
                      dropdownClass="!bg-card !border !border-border !text-foreground !shadow-xl !rounded-xl"
                      searchClass="!bg-muted !border !border-border !text-foreground"
                    />
                    {errors.phone && (
                      <span className="text-[10px] text-destructive font-bold ml-1">{errors.phone}</span>
                    )}
                  </div>
                  <div className="sm:col-span-1 flex flex-col justify-end">
                    <AuthFormField
                      label="Email Address"
                      type="email"
                      placeholder="workshop@example.com"
                      value={form.email}
                      onChange={set("email")}
                      error={errors.email}
                    />
                  </div>

                  {/* Country */}
                  <div className="sm:col-span-2">
                    <WorkshopSearchableSelect
                      label="Country"
                      placeholder="Select Country..."
                      options={countryOptions}
                      value={form.country}
                      onChange={(val) => {
                        const code = String(val);
                        const curr = (countryToCurrency as any)[code] || "USD";
                        setForm((f) => ({ ...f, country: code, currency: curr }));
                      }}
                      error={errors.country}
                    />
                  </div>

                  {/* Password & Confirm */}
                  <div className="sm:col-span-1">
                    <AuthFormField
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={set("password")}
                      error={errors.password}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <AuthFormField
                      label="Confirm Password"
                      type="password"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                      error={errors.confirmPassword}
                    />
                  </div>

                </div>

                <div className="mt-2">
                  <WorkshopButton
                    type="submit"
                    variant="primary"
                    size="xl"
                    fullWidth
                    loading={loading}
                    className="h-[52px] rounded-xl shadow-none"
                  >
                    Sign Up
                  </WorkshopButton>
                </div>
              </form>
            </AuthFormWrapper>
          </div>

        </div>
      </div>
    </div>
  );
}