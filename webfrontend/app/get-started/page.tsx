"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { useToast } from "@/components/ui/WorkshopToast";
import { shopService, type Shop } from "@/services/shop.service";
import {
  Wrench,
  CheckCircle2,
  ArrowRight,
  Building2,
  Clock,
  Sparkles,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

const STEPS = [
  { id: "welcome", label: "Welcome", icon: Sparkles },
  { id: "profile", label: "Profile", icon: Building2 },
  { id: "services", label: "Services", icon: Wrench },
  { id: "hours", label: "Hours", icon: Clock },
  { id: "done", label: "Done", icon: CheckCircle2 },
];

const SERVICE_OPTIONS = [
  "General Repair",
  "Engine Service",
  "Brake Repair",
  "AC Service",
  "Tire Change",
  "Oil Change",
  "Electrical",
  "Body Paint",
  "Diagnostics",
  "Towing",
  "Battery",
  "Transmission",
  "Suspension",
  "Exhaust",
  "Wheel Alignment",
];

const VEHICLE_TYPES = [
  "Hatchback",
  "Sedan",
  "SUV",
  "MUV",
  "Pickup",
  "Van",
  "Motorcycle",
  "Scooter",
  "EV",
  "Luxury",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function GetStartedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
  });

  const [services, setServices] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);

  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    Object.fromEntries(DAYS.map((d) => [d, { open: "09:00", close: "18:00", closed: d === "Sunday" }]))
  );

  useEffect(() => {
    const token = localStorage.getItem("workshop_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    const user = localStorage.getItem("workshop_user");
    if (user) {
      try {
        const u = JSON.parse(user);
        if (u.shop_name) setProfile((p) => ({ ...p, name: u.shop_name }));
      } catch {}
    }
    setChecking(false);
  }, [router]);

  if (checking) return null;

  function toggleService(s: string) {
    setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function toggleVehicle(v: string) {
    setVehicleTypes((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const user = localStorage.getItem("workshop_user");
      const shopId = user ? JSON.parse(user).shop_id : null;
      if (!shopId) {
        toast({ type: "error", title: "Error", description: "Shop not found. Please try again." });
        return;
      }

      const payload: Record<string, unknown> = {
        services_offered: services,
        vehicle_types: vehicleTypes,
        operating_hours: hours,
      };
      if (profile.address) payload.address = profile.address;
      if (profile.city) payload.city = profile.city;
      if (profile.state) payload.state = profile.state;
      if (profile.phone) payload.phone = profile.phone;

      const res = await shopService.update(shopId, payload as Partial<Shop>);
      if (res.success) {
        toast({ type: "success", title: "All Set!", description: "Your workshop is ready to go." });
        router.push("/app");
      } else {
        toast({ type: "error", title: "Update Failed", description: res.error || "Please try again." });
      }
    } catch {
      toast({ type: "error", title: "Error", description: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  function canProceed(): boolean {
    switch (STEPS[step].id) {
      case "profile":
        return profile.name.trim().length > 0;
      case "services":
        return services.length > 0;
      case "hours":
        return true;
      default:
        return true;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logos/logo.png"
              alt="Repairo"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
            />
          </Link>
          <span className="text-xs font-medium text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-transparent text-muted-foreground"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`hidden text-[10px] font-bold uppercase tracking-wider sm:block ${
                        done || active ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-2 h-px w-8 sm:mx-4 sm:w-16 ${
                        i < step ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
          {step === 0 && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
                Welcome to Repairo
              </h1>
              <p className="mb-2 max-w-md text-muted-foreground">
                Let&apos;s get your workshop set up in just a few steps. You&apos;ll be
                managing jobs, invoices, and customers in no time.
              </p>
              <p className="mb-8 text-sm text-muted-foreground">
                We&apos;ll guide you through your profile, services, and hours.
              </p>
              <WorkshopButton
                variant="primary"
                size="lg"
                icon={<ArrowRight className="h-4 w-4" />}
                iconPosition="right"
                onClick={() => setStep(1)}
              >
                Get Started
              </WorkshopButton>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-foreground">Workshop Profile</h2>
              <p className="mb-6 text-sm text-muted-foreground">Tell us about your workshop.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Speed Auto Works"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Address
                  </label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                    placeholder="123 Main Street"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    City
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                    placeholder="Kochi"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    State
                  </label>
                  <input
                    type="text"
                    value={profile.state}
                    onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))}
                    placeholder="Kerala"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 9876543210"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-foreground">Services &amp; Vehicles</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Select the services you offer and vehicle types you work on.
              </p>

              <h3 className="mb-3 text-sm font-semibold text-foreground">Services Offered</h3>
              <div className="mb-8 flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleService(s)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                      services.includes(s)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <h3 className="mb-3 text-sm font-semibold text-foreground">Vehicle Types</h3>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleVehicle(v)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                      vehicleTypes.includes(v)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-foreground">Operating Hours</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Set your weekly business hours.
              </p>
              <div className="space-y-3">
                {DAYS.map((day) => {
                  const h = hours[day];
                  return (
                    <div
                      key={day}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 sm:flex-nowrap"
                    >
                      <div className="flex w-28 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!h.closed}
                          onChange={() =>
                            setHours((prev) => ({
                              ...prev,
                              [day]: { ...prev[day], closed: !prev[day].closed },
                            }))
                          }
                          className="h-4 w-4 accent-primary"
                        />
                        <span
                          className={`text-sm font-medium ${
                            h.closed ? "text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {day}
                        </span>
                      </div>
                      {!h.closed && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={h.open}
                            onChange={(e) =>
                              setHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], open: e.target.value },
                              }))
                            }
                            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                          />
                          <span className="text-muted-foreground">to</span>
                          <input
                            type="time"
                            value={h.close}
                            onChange={(e) =>
                              setHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], close: e.target.value },
                              }))
                            }
                            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                          />
                        </div>
                      )}
                      {h.closed && (
                        <span className="text-sm text-muted-foreground">Closed</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
                You&apos;re All Set!
              </h1>
              <p className="mb-2 max-w-md text-muted-foreground">
                Your workshop profile is complete. You can now start managing repairs,
                creating invoices, and tracking customers.
              </p>
              <p className="mb-8 text-sm text-muted-foreground">
                You can always update these details later from your dashboard.
              </p>
              <WorkshopButton
                variant="primary"
                size="lg"
                icon={<ChevronRight className="h-4 w-4" />}
                iconPosition="right"
                loading={loading}
                onClick={handleFinish}
              >
                Go to Dashboard
              </WorkshopButton>
            </div>
          )}

          {/* Navigation */}
          {step > 0 && step < 4 && (
            <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
              <WorkshopButton
                variant="ghost"
                size="md"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </WorkshopButton>
              <WorkshopButton
                variant="primary"
                size="md"
                icon={<ArrowRight className="h-4 w-4" />}
                iconPosition="right"
                disabled={!canProceed()}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
              </WorkshopButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
