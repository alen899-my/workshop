"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Country, State, City } from "country-state-city";
import { WorkshopSearchableSelect } from "./WorkshopSearchableSelect";

interface RegionResult {
  country: string;
  state: string; // Will now emit Full State Name (e.g. Kerala) instead of ISO code
  city: string;
}

interface WorkshopRegionSelectsProps {
  country: string;
  state: string;
  city: string;
  onChange: (result: RegionResult) => void;
  errors?: {
    country?: string;
    state?: string;
    city?: string;
  };
}

export function WorkshopRegionSelects({
  country,
  state,
  city,
  onChange,
  errors
}: WorkshopRegionSelectsProps) {
  
  // Memoize countries to avoid redundant transformation
  const countryOptions = useMemo(() => 
    Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })),
  []);

  // Find state code for city lookup if the provided 'state' prop is a full name
  const currentStateCode = useMemo(() => {
    if (!country || !state) return "";
    const found = State.getStatesOfCountry(country).find(s => s.isoCode === state || s.name === state);
    return found ? found.isoCode : "";
  }, [country, state]);

  // States for the selected country
  const stateOptions = useMemo(() => 
    country ? State.getStatesOfCountry(country).map(s => ({ value: s.name, label: s.name })) : [],
  [country]);

  // Cities for the selected state
  const cityOptions = useMemo(() => 
    (country && currentStateCode) ? City.getCitiesOfState(country, currentStateCode).map(c => ({ value: c.name, label: c.name })) : [],
  [country, currentStateCode]);

  const handleCountryChange = (val: string | number) => {
    onChange({ country: String(val), state: "", city: "" });
  };

  const handleStateChange = (val: string | number) => {
    onChange({ country, state: String(val), city: "" });
  };

  const handleCityChange = (val: string | number) => {
    onChange({ country, state, city: String(val) });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      <WorkshopSearchableSelect
        label="Country"
        options={countryOptions}
        value={country}
        onChange={handleCountryChange}
        error={errors?.country}
        placeholder="Select Country"
      />
      <WorkshopSearchableSelect
        label="State / Province"
        options={stateOptions}
        value={state}
        onChange={handleStateChange}
        error={errors?.state}
        placeholder={country ? "Select State" : "Pick country first"}
        disabled={!country}
      />
      <WorkshopSearchableSelect
        label="City / Location"
        options={cityOptions}
        value={city}
        onChange={handleCityChange}
        error={errors?.city}
        placeholder={state ? "Select City" : "Pick state first"}
        disabled={!state}
      />
    </div>
  );
}
