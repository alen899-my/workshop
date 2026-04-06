"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/WorkshopToast";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { AuthFormField } from "@/components/ui/AuthFormField";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast({ type: "error", title: "Error", description: "Password must be at least 6 characters" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ type: "error", title: "Error", description: "Passwords do not match" });
      return;
    }
    if (!token || !email) {
      toast({ type: "error", title: "Error", description: "Invalid reset link" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword: password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({ type: "error", title: "Failed", description: data.error || "Something went wrong" });
        return;
      }

      toast({ type: "success", title: "Success", description: "Password reset successfully. You can now login." });
      router.push("/login");
    } catch (error) {
      toast({ type: "error", title: "Network Error", description: "Could not connect to server" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <AuthFormField
        label="New Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <AuthFormField
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <WorkshopButton
        type="submit"
        variant="primary"
        size="xl"
        fullWidth
        loading={loading}
        className="h-[52px] rounded-xl shadow-lg"
      >
        Reset Password
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
  );
}

export default function ResetPasswordPage() {
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
                Create New Password
              </h1>
              <p className="text-muted-foreground text-sm">
                Please enter your new password below.
              </p>
            </div>

            <Suspense fallback={<div className="text-center">Loading...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
