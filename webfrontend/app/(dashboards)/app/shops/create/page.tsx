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
import { WorkshopInlineSelect } from "@/components/ui/WorkshopInlineSelect";
import { X } from "lucide-react";

/** Constants */
const defaultHours = {
  monday: { open: "09:00", close: "18:00", closed: false },
  tuesday: { open: "09:00", close: "18:00", closed: false },
  wednesday: { open: "09:00", close: "18:00", closed: false },
  thursday: { open: "09:00", close: "18:00", closed: false },
  friday: { open: "09:00", close: "18:00", closed: false },
  saturday: { open: "09:00", close: "18:00", closed: false },
  sunday: { open: "09:00", close: "18:00", closed: true },
};

const predefinedServices = [
  "General Servicing", "Oil Change", "Brake Repair", 
  "Engine Diagnostics", "Tire Replacement & Balancing", 
  "Wheel Alignment", "AC Service & Repair", 
  "Battery & Electrical", "Denting & Painting", "Car Wash & Detailing", "Transmission Repair"
];

/** Add Shop Page */
export default function CreateShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customService, setCustomService] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    phone: "",
    country: "IN",
    state: "",
    city: "",
    address: "",
    currency: "INR",
    operating_hours: defaultHours,
    services_offered: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.owner_name || !form.country || !form.state || !form.city) {
       toast({ type: "error", title: "Required", description: "All location fields are mandatory." });
       return;
    }

    setLoading(true);
    // Use city as location for backend compatibility if needed
    const ObjectToSubmit = {
      ...form,
      location: form.city,
      operating_hours: JSON.stringify(form.operating_hours),
      services_offered: JSON.stringify(form.services_offered)
    };
    
    const payload = new FormData();
    Object.keys(ObjectToSubmit).forEach((key) => {
      payload.append(key, (ObjectToSubmit as any)[key]);
    });
    
    // The backend handles forms correctly, so we send it via FormData payload
    const res = await shopService.create(payload as any);
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

        {/* Operating Hours */}
        <div className="md:col-span-2 pt-6 border-t border-border mt-2">
          <h3 className="font-bold text-sm tracking-widest uppercase mb-4 text-foreground">Operating Hours</h3>
          <div className="flex flex-col gap-3 max-w-lg">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
              const dayData = (form.operating_hours as Record<string, {open: string, close: string, closed: boolean}>)?.[day] || defaultHours[day as keyof typeof defaultHours];
              return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-28 font-semibold capitalize text-sm text-muted-foreground tracking-wide">{day}</div>
                  <div className="flex items-center gap-4 flex-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input type="checkbox" checked={dayData.closed} onChange={(e) => {
                         setForm(f => ({...f, operating_hours: {...(f.operating_hours as any), [day]: {...dayData, closed: e.target.checked}}}))
                      }} className="rounded text-primary focus:ring-primary h-4 w-4 border-border bg-background" />
                      <span className={dayData.closed ? "text-destructive font-semibold" : "text-muted-foreground"}>Closed</span>
                    </label>
                    {!dayData.closed && (
                      <div className="flex items-center gap-2 ml-auto sm:ml-0">
                        <input type="time" value={dayData.open} onChange={(e) => {
                           setForm(f => ({...f, operating_hours: {...(f.operating_hours as any), [day]: {...dayData, open: e.target.value}}}))
                        }} className="h-9 px-3 text-sm rounded-md bg-background border border-border text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                        <span className="text-muted-foreground text-xs font-medium">to</span>
                        <input type="time" value={dayData.close} onChange={(e) => {
                           setForm(f => ({...f, operating_hours: {...(f.operating_hours as any), [day]: {...dayData, close: e.target.value}}}))
                        }} className="h-9 px-3 text-sm rounded-md bg-background border border-border text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Services Offered */}
        <div className="md:col-span-2 pt-6 border-t border-border mt-2">
          <h3 className="font-bold text-sm tracking-widest uppercase mb-4 text-foreground">Services Offered</h3>
          <p className="text-xs text-muted-foreground mb-4">Select all services provided by your shop. This helps standardize job creation.</p>
          
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="flex flex-wrap gap-2.5 text-sm min-h-[50px] p-4 bg-muted/20 border border-border/50 rounded-xl">
               {form.services_offered?.length > 0 ? form.services_offered.map(service => (
                  <span key={service} className="pl-3 pr-1 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold shadow-sm flex items-center gap-1.5">
                    {service}
                    <button 
                      type="button" 
                      onClick={() => setForm(f => ({...f, services_offered: f.services_offered.filter(s => s !== service)}))}
                      className="p-1 hover:bg-black/20 rounded transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
               )) : (
                  <span className="text-muted-foreground text-sm flex items-center font-medium">No services added yet.</span>
               )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
               <WorkshopInlineSelect
                 value=""
                 onChange={(val) => {
                   if (val === "" || val === "placeholder") return;
                   if (val === "Other") {
                     setShowOtherInput(true);
                   } else {
                     setShowOtherInput(false);
                     if (val && !form.services_offered?.includes(val)) {
                       setForm(f => ({...f, services_offered: [...f.services_offered, val]}));
                     }
                   }
                 }}
                 options={[
                   { value: "placeholder", label: "Select a service..." },
                   ...predefinedServices
                      .filter(s => !form.services_offered?.includes(s))
                      .map(s => ({ value: s, label: s })),
                   { value: "Other", label: "Other (Custom Service)..." }
                 ]}
                 className="h-10 px-3 text-sm rounded-md bg-background border border-border hover:bg-muted text-foreground transition-all !normal-case !tracking-normal !font-medium"
                 wrapperClassName="flex-1 min-w-[220px]"
               />

               {showOtherInput && (
                 <div className="flex gap-2 flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                   <input 
                     type="text" 
                     placeholder="Type a custom service name..."
                     value={customService}
                     onChange={(e) => setCustomService(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customService.trim() && !form.services_offered?.includes(customService.trim())) {
                             setForm(f => ({...f, services_offered: [...f.services_offered, customService.trim()]}));
                             setCustomService("");
                          }
                        }
                     }}
                     className="h-10 px-3 text-sm rounded-md bg-background border border-border text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all flex-1"
                   />
                   <button 
                     type="button"
                     onClick={() => {
                        if (customService.trim() && !form.services_offered?.includes(customService.trim())) {
                           setForm(f => ({...f, services_offered: [...f.services_offered, customService.trim()]}));
                           setCustomService("");
                        }
                     }}
                     className="px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-semibold rounded-md border border-border transition-colors"
                   >
                     Add
                   </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </ModuleForm>
  );
}
