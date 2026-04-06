"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { AuthFormField } from "@/components/ui/AuthFormField";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast({ type: "error", title: "Error", description: "Email is required" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({ type: "error", title: "Failed", description: data.error || "Something went wrong" });
        return;
      }

      toast({ type: "success", title: "Success", description: "Password reset link sent to your email" });
      setEmail("");
    } catch (error) {
      toast({ type: "error", title: "Network Error", description: "Could not connect to server" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex sm:items-center justify-center font-mono sm:p-8 sm:py-20 lg:p-12 xl:p-20">
      <div className="absolute inset-0 z-0 hidden sm:block">
        <Image
          src="/images/auth/auth.jpg"
          alt="Workshop Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-10 w-full sm:max-w-[480px]">
        <div className="bg-background sm:bg-white dark:sm:bg-card border-0 sm:border sm:border-border/50 shadow-none sm:shadow-2xl rounded-none sm:rounded-3xl p-6 py-12 sm:p-10 min-h-screen sm:min-h-0 flex flex-col justify-center">
          <div className="flex justify-center w-full mb-8 lg:mb-10">
            <span className="font-mono font-black text-3xl sm:text-4xl tracking-widest text-primary uppercase text-center">
              REPAIRO
            </span>
          </div>

          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-2 text-center mb-4">
              <h1 className="font-bold text-2xl tracking-tight text-foreground uppercase">
                Forgot Password
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your email address to receive a password reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
              <AuthFormField
                label="Email Address"
                type="email"
                placeholder="workshop@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <WorkshopButton
                type="submit"
                variant="primary"
                size="xl"
                fullWidth
                loading={loading}
                className="h-[52px] rounded-xl shadow-lg"
              >
                Send Reset Link
              </WorkshopButton>

              <div className="text-center text-sm font-medium text-muted-foreground mt-4">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-bold text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
