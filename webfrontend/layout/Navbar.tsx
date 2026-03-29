"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export function NavbarWhite() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("workshop_token"));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header
        className={cn(
          "pointer-events-auto w-full max-w-4xl transition-all duration-500 ease-out",
          "rounded-[2rem_2rem_2rem_0.5rem]",
          scrolled
            ? "bg-white/95 backdrop-blur-xl border border-[oklch(0.82_0.022_235)] shadow-[0_8px_40px_oklch(0.38_0.13_248/0.15),0_0_0_1px_oklch(0.82_0.022_235)]"
            : "bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_4px_24px_oklch(0.38_0.13_248/0.10)]"
        )}
      >
        <nav className="px-5 sm:px-7 h-14 flex items-center justify-between gap-4">

          {/* ── Logo (text only) ── */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <span className="font-mono font-bold text-sm tracking-[0.2em] text-[oklch(0.15_0.025_240)] uppercase">
              Veh<span className="text-[oklch(0.38_0.13_248)]">Rep</span>
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <ul className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={cn(
                    "font-mono text-[0.65rem] tracking-[0.18em] uppercase px-3.5 py-1.5",
                    "rounded-full text-[oklch(0.45_0.04_240)]",
                    "hover:text-[oklch(0.38_0.13_248)] hover:bg-[oklch(0.38_0.13_248/0.08)]",
                    "transition-all duration-200"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* ── Desktop CTAs ── */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {!isLoggedIn ? (
              <Link
                href="/login"
                className={cn(
                  "font-mono text-xs tracking-[0.15em] uppercase px-4 py-2",
                  "rounded-sm border border-[oklch(0.82_0.022_235)]",
                  "text-[oklch(0.38_0.13_248)] bg-transparent",
                  "hover:bg-[oklch(0.38_0.13_248/0.06)] hover:border-[oklch(0.38_0.13_248/0.4)]",
                  "transition-all duration-200"
                )}
              >
                Login
              </Link>
            ) : (
              <Link
                href="/app"
                className={cn(
                  "font-mono text-xs tracking-[0.15em] uppercase px-4 py-2",
                  "rounded-sm border border-[oklch(0.38_0.13_248)]",
                  "text-white bg-[oklch(0.38_0.13_248)]",
                  "hover:bg-[oklch(0.45_0.15_248)]",
                  "transition-all duration-200"
                )}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* ── Mobile toggle ── */}
          <button
            className="md:hidden text-[oklch(0.38_0.13_248)] p-1.5 rounded-full hover:bg-[oklch(0.38_0.13_248/0.08)] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* ── Mobile dropdown ── */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-out",
          mobileOpen ? "max-h-80 pb-5" : "max-h-0"
        )}>
          <div className="border-t border-[oklch(0.82_0.022_235)] mx-5 pt-3 flex flex-col gap-3">
            <ul className="flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-[0.65rem] tracking-[0.18em] uppercase text-[oklch(0.45_0.04_240)] hover:text-[oklch(0.38_0.13_248)] hover:bg-[oklch(0.38_0.13_248/0.08)] transition-all block px-3 py-2 rounded-xl"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              {!isLoggedIn ? (
                <>
                  <Link
                    href="/login"
                    className={cn(
                      "flex-1 text-center font-mono text-xs tracking-[0.15em] uppercase px-4 py-2",
                      "rounded-sm border border-[oklch(0.82_0.022_235)]",
                      "text-[oklch(0.38_0.13_248)]",
                      "hover:bg-[oklch(0.38_0.13_248/0.06)]",
                      "transition-all duration-200"
                    )}
                  >
                    Login
                  </Link>
                  <WorkshopButton
                    variant="primary"
                    size="sm"
                    fullWidth
                    className="!rounded-full shadow-[0_0_18px_oklch(0.58_0.175_248/0.35)]"
                  >
                    Get Started
                  </WorkshopButton>
                </>
              ) : (
                <Link
                  href="/app"
                  className={cn(
                    "flex-1 text-center font-mono text-xs tracking-[0.15em] uppercase px-4 py-2",
                    "rounded-sm border border-[oklch(0.38_0.13_248)]",
                    "text-white bg-[oklch(0.38_0.13_248)]",
                    "hover:bg-[oklch(0.45_0.15_248)]",
                    "transition-all duration-200 shadow-[0_0_18px_oklch(0.58_0.175_248/0.35)]"
                  )}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}