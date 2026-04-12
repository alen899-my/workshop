"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { shopService, Shop } from "@/services/shop.service";
import { NavbarWhite } from "@/layout/Navbar";
import { WorkshopRegionSelects } from "@/components/ui/WorkshopRegionSelects";

import {
  Search, MapPin, Wrench, Phone, Building2,
  Clock, X, Loader2, ArrowLeft, ChevronRight, SlidersHorizontal, Navigation
} from "lucide-react";

const predefinedServices = [
  "General Servicing", "Oil Change", "Brake Repair", "Engine Diagnostics",
  "Tire Replacement & Balancing", "Wheel Alignment", "AC Service & Repair",
  "Battery & Electrical", "Denting & Painting", "Car Wash & Detailing",
  "Transmission Repair",
];

/* ── Helpers ────────────────────────── */
function todayKey() {
  return ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][new Date().getDay()];
}
function formatHours(hours: any, day: string) {
  const d = hours?.[day];
  if (!d) return "—";
  return d.closed ? "Closed" : `${d.open} – ${d.close}`;
}

/** Best available Google Maps directions URL for a shop */
function mapsUrl(shop: Shop): string {
  if (shop.latitude && shop.longitude) {
    const dest = `${shop.latitude},${shop.longitude}`;
    const placeParam = shop.place_id ? `&destination_place_id=${shop.place_id}` : "";
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}${placeParam}`;
  }
  if (shop.place_id) {
    return `https://www.google.com/maps/place/?q=place_id:${shop.place_id}`;
  }
  const query = encodeURIComponent(
    [shop.name, shop.address, shop.city, shop.state].filter(Boolean).join(", ")
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function OpenBadge({ hours }: { hours: any }) {
  const d = hours?.[todayKey()];
  const isOpen = d && !d.closed;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
      isOpen
        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
        : "bg-red-500/10 text-red-500 border border-red-500/20"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
      {isOpen ? "Open Now" : "Closed"}
    </span>
  );
}

/* ── Shop Result Card ────────────────── */
function ShopCard({ shop }: { shop: Shop }) {
  const today = todayKey();
  const phone = shop.owner_phone || shop.phone;

  return (
    <div className="group flex flex-col sm:flex-row gap-4 bg-card border border-border hover:border-primary/40 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-md">
      
      {/* Square image */}
      <div className="shrink-0 w-full h-40 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
        {shop.shop_image
          ? <img src={shop.shop_image} alt={shop.name} className="w-full h-full object-cover" />
          : <Building2 size={32} className="text-muted-foreground/25" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">

        {/* Row 1: Name + Open badge */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h3 className="font-bold text-foreground text-base leading-tight">{shop.name}</h3>
          <OpenBadge hours={shop.operating_hours} />
        </div>

        {/* Row 2: Location */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={11} className="shrink-0 text-primary/60" />
          <span className="truncate">
            {[shop.city, shop.state].filter(Boolean).join(", ") || shop.location || "—"}
          </span>
        </div>

        {/* Row 3: Address */}
        {shop.address && (
          <p className="text-[11px] text-muted-foreground/60 truncate">{shop.address}</p>
        )}

        {/* Row 4: Today's hours */}
        {shop.operating_hours && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock size={11} className="text-primary/50 shrink-0" />
            <span>Today: <span className="font-semibold text-foreground">{formatHours(shop.operating_hours, today)}</span></span>
          </div>
        )}

        {/* Row 5: Services */}
        {shop.services_offered && shop.services_offered.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Wrench size={10} /> Services Offered
            </p>
            <div className="flex flex-wrap gap-1.5">
              {shop.services_offered.map((s, i) => (
                <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Row 6: Action buttons — Call + Directions */}
        <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-2">
          {phone && (
            <a
              href={`tel:${phone}`}
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Phone size={13} className="shrink-0" />
              Call Now
            </a>
          )}
          <a
            href={mapsUrl(shop)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-accent border border-border hover:border-primary/40 text-foreground rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all duration-200"
          >
            <Navigation size={13} className="shrink-0 text-primary" />
            Get Directions
          </a>
        </div>
      </div>
    </div>
  );
}


/* ── Inner search-aware content ─────── */
function WorkshopsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [region, setRegion] = useState({ 
    country: searchParams.get("country") || "IN", 
    state: searchParams.get("state") || "", 
    city: searchParams.get("city") || "" 
  });
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [service, setService] = useState(searchParams.get("service") || "");
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showServiceMenu, setShowServiceMenu] = useState(false);

  /* Run on initial mount (from URL params) */
  useEffect(() => {
    const loc = searchParams.get("location") || "";
    const svc = searchParams.get("service") || "";
    const st = searchParams.get("state") || "";
    const ct = searchParams.get("city") || "";
    if (loc || svc || st || ct) {
      doSearch(loc, svc, st, ct);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSearch(loc: string, svc: string, state: string, city: string) {
    setLoading(true);
    setSearched(false);
    const res = await shopService.search(loc, svc, state, city);
    setShops(res.success ? res.data : []);
    setLoading(false);
    setSearched(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    // Explicit regions take precedence for filtering
    if (region.country) params.set("country", region.country);
    if (region.state) params.set("state", region.state);
    if (region.city) params.set("city", region.city);
    
    // Keep raw location string if present from landing page search
    // But if they selected a new specific state/city, we prioritize those.
    if (location.trim() && !region.state && !region.city) {
      params.set("location", location.trim());
    }
    
    if (service.trim()) params.set("service", service.trim());
    router.replace(`/workshops?${params.toString()}`);
    doSearch(location.trim() && !region.state && !region.city ? location.trim() : "", service, region.state, region.city);
  };

  const filteredServices = predefinedServices.filter(s =>
    s.toLowerCase().includes(service.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navbar only */}
      <NavbarWhite />

      {/* Page content — padded below navbar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-32 pb-12">
        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors mb-6">
          <ArrowLeft size={14} /> Back to home
        </button>

        {/* Search form inline */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8 bg-card border border-border p-4 sm:p-5 rounded-2xl shadow-sm">
          
          {/* Top Row: Region Selection */}
          <WorkshopRegionSelects
            country={region.country}
            state={region.state}
            city={region.city}
            onChange={(res) => {
              setRegion(res);
              setLocation(""); // Clear text location if they manually pick regions
            }}
          />

          {/* Bottom Row: Service & Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Service */}
            <div className="relative flex-1">
              <Wrench size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none z-10" />
              <input
                value={service}
                onChange={e => { setService(e.target.value); setShowServiceMenu(true); }}
                onFocus={() => setShowServiceMenu(true)}
                onBlur={() => setTimeout(() => setShowServiceMenu(false), 180)}
                placeholder="Service needed (e.g. Oil Change)…"
                className="w-full h-11 pl-9 pr-8 bg-muted/40 border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl text-sm text-foreground outline-none transition-all"
              />
              {service && (
                <button type="button" onClick={() => setService("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
                  <X size={13} />
                </button>
              )}
              {showServiceMenu && filteredServices.length > 0 && (
                <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-44 overflow-y-auto">
                  {filteredServices.map(s => (
                    <button key={s} type="button" onMouseDown={() => { setService(s); setShowServiceMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-mono text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="h-11 px-8 bg-primary text-primary-foreground text-xs font-bold font-mono uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shrink-0 transition-all hover:bg-primary/90 disabled:opacity-60 shadow-sm">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              Search
            </button>
          </div>
        </form>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Find a Workshop
          </h1>
          {searched && (
            <p className="text-sm text-muted-foreground mt-1">
              {shops.length > 0
                ? `${shops.length} verified workshop${shops.length !== 1 ? "s" : ""} found`
                : "No workshops matched your search."}

              {(location || service) && (
                <span className="ml-1">
                  {location && <span> in <strong className="text-foreground">{location}</strong></span>}
                  {service && <span> for <strong className="text-foreground">{service}</strong></span>}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="w-24 h-24 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 flex flex-col gap-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-muted rounded-full w-20" />
                    <div className="h-5 bg-muted rounded-full w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {searched && !loading && shops.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Building2 size={28} className="text-muted-foreground/40" />
            </div>
            <h3 className="font-bold text-foreground">No workshops found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Try searching with a different location or service. More workshops join the platform every day.
            </p>
          </div>
        )}

        {/* Initial state — no search yet */}
        {!searched && !loading && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <SlidersHorizontal size={26} className="text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Search for a Workshop</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Enter a location or service above to find verified workshops near you.
            </p>
          </div>
        )}

        {/* Results grid */}
        {!loading && shops.length > 0 && (
          <div className="flex flex-col gap-4">
            {shops.map(shop => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page root ── */
export default function WorkshopsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    }>
      <WorkshopsContent />
    </Suspense>
  );
}
