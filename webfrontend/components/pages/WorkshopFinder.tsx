"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Wrench, X, Loader2, LocateFixed } from "lucide-react";

const ALL_SERVICES = [
  "General Servicing", "Oil Change", "Brake Repair", "Engine Diagnostics",
  "Tire Replacement & Balancing", "Wheel Alignment", "AC Service & Repair",
  "Battery & Electrical", "Denting & Painting", "Car Wash & Detailing",
  "Transmission Repair",
];

export function WorkshopFinder() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [service, setService] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showServiceMenu, setShowServiceMenu] = useState(false);

  const filteredServices = ALL_SERVICES.filter(s =>
    s.toLowerCase().includes(service.toLowerCase()) && s !== service
  );

  /* ── Use browser geolocation → reverse geocode city name ── */
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
          const res = await fetch(url, { headers: { "Accept-Language": "en" } });
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            data.address?.state_district ||
            "";
          setLocation(city || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch {
          setError("Could not determine your city. Please type it manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setError("Location access denied. Please type your city manually.");
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!location.trim() && !service.trim()) {
      setError("Enter a location or service to search.");
      return;
    }
    setError(null);
    setNavLoading(true);
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (service.trim()) params.set("service", service.trim());
    router.push(`/workshops?${params.toString()}`);
  };

  const selectService = (s: string) => {
    setService(s);
    setShowServiceMenu(false);
  };

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-5">
        <h2 className="font-mono font-bold text-foreground text-xl sm:text-2xl leading-snug">
          Find a <span className="text-primary">Workshop</span> Near You
        </h2>
        <p className="text-muted-foreground text-xs font-mono mt-1">
          Search across all verified garages on the platform
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3">

        {/* ── Location field ── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={location}
              onChange={e => { setLocation(e.target.value); setError(null); }}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="City, state or area…"
              className="w-full h-11 pl-9 pr-8 bg-muted/60 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15 rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200"
            />
            {location && (
              <button type="button" onClick={() => setLocation("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
          {/* Use my location button */}
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={geoLoading}
            title="Use my current location"
            className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl bg-muted/60 border border-border hover:border-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 disabled:opacity-50"
          >
            {geoLoading
              ? <Loader2 size={15} className="animate-spin text-primary" />
              : <LocateFixed size={15} />}
          </button>
        </div>

        {/* ── Service field ── */}
        <div className="relative">
          <Wrench size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
          <input
            type="text"
            value={service}
            onChange={e => { setService(e.target.value); setShowServiceMenu(true); setError(null); }}
            onFocus={() => setShowServiceMenu(true)}
            onBlur={() => setTimeout(() => setShowServiceMenu(false), 180)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Service needed…"
            className="w-full h-11 pl-9 pr-8 bg-muted/60 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15 rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200"
          />
          {service && (
            <button type="button" onClick={() => { setService(""); setShowServiceMenu(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X size={13} />
            </button>
          )}
          {showServiceMenu && filteredServices.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-44 overflow-y-auto">
              {filteredServices.map(s => (
                <button key={s} type="button" onMouseDown={() => selectService(s)}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-foreground/70 hover:text-foreground hover:bg-accent transition-colors font-mono flex items-center gap-2">
                  <Wrench size={11} className="text-primary/50 shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive font-mono px-1">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={navLoading || geoLoading}
          className="h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60"
        >
          {navLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          {navLoading ? "Loading…" : "Find Workshops"}
        </button>
      </form>
    </div>
  );
}
