"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { Menu, X, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

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
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(!!localStorage.getItem("workshop_token"));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header
        className={cn(
          "pointer-events-auto w-full max-w-4xl transition-all duration-500 ease-out",
          "rounded-[2rem_2rem_2rem_0.5rem]",
          (scrolled || mobileOpen)
            ? "bg-background dark:bg-[#050505] border border-border shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
            : "bg-background/10 dark:bg-white/5 border border-white/10 dark:border-white/5 shadow-none"
        )}
      >
        <nav className="px-5 sm:px-7 h-14 flex items-center justify-between gap-4">

          <Link href="/" className="flex items-center flex-shrink-0">
            <span className="font-mono text-xl font-black tracking-[0.2em] text-primary uppercase ">
              REPAIRO
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
                    "rounded-full transition-all duration-200",
                    (scrolled || mobileOpen) 
                      ? "text-foreground hover:text-primary hover:bg-primary/8" 
                      : "text-white hover:text-white/80 hover:bg-white/10"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* ── Desktop CTAs ── */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0 font-bold">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-full transition-all duration-300 border border-transparent",
                (scrolled || mobileOpen)
                  ? "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20"
                  : "text-white hover:text-white/80 hover:bg-white/10 hover:border-white/20"
              )}
              aria-label="Toggle theme"
            >
              {!mounted ? (
                <div className="w-5 h-5 transition-all duration-500" />
              ) : resolvedTheme === "dark" ? (
                <Sun className="w-5 h-5 rotate-0 scale-100 transition-all" />
              ) : (
                <Moon className="w-5 h-5 rotate-0 scale-100 transition-all" />
              )}
            </button>

            {!isLoggedIn && (
              <div className="flex items-center gap-3">
             
                <Link href="/login">
                  <WorkshopButton
                    variant="primary"
                    size="sm"
                    className="!font-mono !text-[10px] !tracking-[0.2em] !uppercase !py-2.5 !px-6 !rounded-sm shadow-[0_8px_20px_var(--primary)/0.3] hover:shadow-[0_12px_24px_var(--primary)/0.4]"
                  >
                   Login
                  </WorkshopButton>
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile toggle ── */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-primary/8 text-primary transition-colors"
              aria-label="Toggle theme"
            >
              {!mounted ? (
                <div className="w-5 h-5" />
              ) : resolvedTheme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              className="text-primary p-1.5 rounded-full hover:bg-primary/8 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* ── Mobile dropdown ── */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-out",
          mobileOpen ? "max-h-80 pb-5" : "max-h-0"
        )}>
          <div className="border-t border-border mx-5 pt-3 flex flex-col gap-3">
            <ul className="flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-[0.65rem] tracking-[0.18em] uppercase text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all block px-3 py-2 rounded-xl"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              {!isLoggedIn && (
                <>
                  <Link
                    href="/login"
                    className={cn(
                      "flex-1 text-center font-mono text-xs tracking-[0.15em] uppercase px-4 py-2",
                      "rounded-sm border border-border",
                      "text-primary",
                      "hover:bg-primary/6",
                      "transition-all duration-200"
                    )}
                  >
                    Login
                  </Link>
                 
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}