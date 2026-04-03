"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Locate } from 'lucide-react';
import { useToast } from './WorkshopToast';
import { cn } from '@/lib/utils';

interface LocationResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface WorkshopLocationInputProps {
  label?: string;
  value: string;
  onChange: (result: LocationResult) => void;
  error?: string;
  placeholder?: string;
}

interface GeoapifyFeature {
  properties: {
    place_id: string;
    formatted: string;
    lat: number;
    lon: number;
    country_code: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

const API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

export function WorkshopLocationInput({
  label = "Workshop Location",
  value,
  onChange,
  error,
  placeholder = "Start typing your address...",
}: WorkshopLocationInputProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && query.length >= 3 && query !== value) {
        performSearch(query);
      } else if (!query || query.length < 3) {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, value]);

  const performSearch = async (val: string) => {
    if (!API_KEY) {
      console.error("NEXT_PUBLIC_GEOAPIFY_API_KEY is not set");
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(val)}&limit=5&format=json&apiKey=${API_KEY}`
      );
      const data = await res.json();
      const results: GeoapifyFeature[] = data.results?.map((r: any) => ({
        properties: {
          place_id: r.place_id || String(r.rank?.confidence || Math.random()),
          formatted: r.formatted,
          lat: r.lat,
          lon: r.lon,
          country_code: r.country_code,
          city: r.city,
          state: r.state,
          country: r.country,
        },
      })) ?? [];
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    } catch (err) {
      console.error("Geoapify error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (item: GeoapifyFeature) => {
    const { formatted, lat, lon, place_id } = item.properties;
    setQuery(formatted);
    setShowDropdown(false);
    onChange({
      address: formatted,
      lat,
      lng: lon,
      placeId: place_id,
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast({ type: "error", title: "Not Supported", description: "Geolocation not supported by your browser." });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        try {
          const res = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${API_KEY}`
          );
          const data = await res.json();
          const r = data.results?.[0];
          const address = r?.formatted || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setQuery(address);
          onChange({
            address,
            lat: latitude,
            lng: longitude,
            placeId: r?.place_id || "",
          });
          toast({ type: "success", title: "Located", description: "Location detected successfully." });
        } catch {
          const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setQuery(fallback);
          onChange({ address: fallback, lat: latitude, lng: longitude, placeId: "" });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast({ type: "error", title: "Permission Denied", description: "Please allow location access." });
      }
    );
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1 flex items-center gap-1.5">
          <MapPin size={12} className="text-primary" /> {label}
        </label>
      )}

      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-background border border-border",
            "text-foreground text-sm font-semibold",
            "rounded-md px-4 py-2.5 pr-20",
            "placeholder:text-muted-foreground/30",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
            "transition-all duration-200",
            error && "border-destructive focus:border-destructive"
          )}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searching && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            className="p-1.5 hover:bg-muted rounded-md transition-colors text-primary disabled:opacity-50"
            title="Use my location"
          >
            {locating
              ? <Loader2 size={14} className="animate-spin" />
              : <Locate size={14} />
            }
          </button>
        </div>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
              {suggestions.map((item) => (
                <button
                  key={item.properties.place_id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0 flex gap-3 items-start group"
                >
                  <MapPin size={16} className="text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                  <div className="flex flex-col text-left">
                    <span className="text-foreground leading-snug">
                      {item.properties.formatted}
                    </span>
                    {item.properties.country && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {[item.properties.city, item.properties.state, item.properties.country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="px-3 py-1.5 border-t border-border/50 flex justify-end">
              <span className="text-[10px] text-muted-foreground/50">Powered by Geoapify</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <span className="text-[10px] text-destructive font-bold ml-1">{error}</span>
      )}
    </div>
  );
}
