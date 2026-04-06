"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { shopService } from "@/services/shop.service";
import { Building2, User as UserIcon, MapPin } from "lucide-react";
import { WorkshopRegionSelects } from "@/components/ui/WorkshopRegionSelects";
import countryToCurrency from 'country-to-currency';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

/** Add Shop Page */
export default function CreateShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    phone: "",
    country: "IN",
    state: "",
    city: "",
    address: "",
    currency: "INR"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.owner_name || !form.country || !form.state || !form.city) {
       toast({ type: "error", title: "Required", description: "All location fields are mandatory." });
       return;
    }

    setLoading(true);
    // Use city as location for backend compatibility if needed
    const res = await shopService.create({
      ...form,
      location: form.city
    });
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "Shop Added", description: `${form.name} created successfully.` });
      router.push("/app/shops");
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to create shop." });
    }
  };

  return (
    <ModuleForm
      title="Add Shop"
      subtitle="Register a new shop location and assign an owner."
      backUrl="/app/shops"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:col-span-2">
        <div className="md:col-span-1">
           <AuthFormField
             label="Shop Name"
             placeholder="e.g. Speed Auto Works"
             value={form.name}
             onChange={(e) => setForm({ ...form, name: e.target.value })}
             icon={<Building2 size={16} />}
           />
        </div>

        <div className="md:col-span-1">
          <AuthFormField
            label="Owner Name"
            placeholder="e.g. Rajan K."
            value={form.owner_name}
            onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
            icon={<UserIcon size={16} />}
          />
        </div>

        <div className="md:col-span-2">
          <WorkshopRegionSelects
            country={form.country}
            state={form.state}
            city={form.city}
            onChange={(res) => {
              const code = res.country;
              const curr = (countryToCurrency as any)[code] || "USD";
              setForm(f => ({ 
                 ...f, 
                 ...res,
                 currency: curr
              }));
            }}
          />
        </div>

        <div className="md:col-span-2">
          <AuthFormField
            label="Street Address / Detailed Location"
            placeholder="e.g. #42 Industrial Area, Phase 1"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            icon={<MapPin size={16} />}
          />
        </div>
        
        <div className="md:col-span-1">
          <label className="text-xs font-normal text-muted-foreground ml-0.5">Work Phone Number</label>
          <PhoneInput
            country={form.country.toLowerCase()}
            value={form.phone}
            onChange={(phone) => setForm(f => ({ ...f, phone: `+${phone}` }))}
            containerClass="!w-full"
            inputClass="!w-full !h-[42px] !bg-background !border !border-border !text-foreground !text-sm !rounded-md !px-4 !py-2.5 !pl-12 !transition-all !duration-200 focus:!border-primary focus:!ring-2 focus:!ring-primary/10"
            buttonClass="!bg-background !border !border-border !border-r-0 !rounded-l-md !hover:bg-muted/50"
            dropdownClass="!bg-card !border !border-border !text-foreground !shadow-xl !rounded-md"
            searchClass="!bg-muted !border !border-border !text-foreground"
          />
        </div>
      </div>
    </ModuleForm>
  );
}
