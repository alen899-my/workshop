"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { shopService } from "@/services/shop.service";
import { Building2, User as UserIcon, MapPin, X, Edit2, Phone, Globe, Map } from "lucide-react";
import { WorkshopRegionSelects } from "@/components/ui/WorkshopRegionSelects";
import countryToCurrency from 'country-to-currency';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { WorkshopImageUpload } from "@/components/ui/WorkshopImageUpload";
import { WorkshopInlineSelect } from "@/components/ui/WorkshopInlineSelect";

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

/** Edit Shop Page */
export default function EditShopPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(searchParams.get("mode") === "edit");
  const [customService, setCustomService] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    owner_phone: "",
    country: "IN",
    state: "",
    city: "",
    address: "",
    currency: "INR",
    shop_image: "",
    operating_hours: defaultHours,
    services_offered: [] as string[]
  });
  const [shopImageFile, setShopImageFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const res = await shopService.getById(id);
      if (res.success && res.data) {
        setForm({
          name: res.data.name,
          owner_name: res.data.owner_name,
          owner_phone: res.data.owner_phone || res.data.phone || "",
          country: res.data.country || "IN",
          state: res.data.state || "",
          city: res.data.city || res.data.location || "",
          address: res.data.address || "",
          currency: res.data.currency || "INR",
          shop_image: res.data.shop_image || "",
          operating_hours: res.data.operating_hours || defaultHours,
          services_offered: res.data.services_offered || []
        });
      } else {
        toast({ type: "error", title: "Error", description: "Shop not found." });
        router.push("/app/shops");
      }
      setFetching(false);
    };
    fetchData();
  }, [id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("owner_name", form.owner_name);
    payload.append("owner_phone", form.owner_phone);
    payload.append("country", form.country);
    payload.append("state", form.state);
    payload.append("city", form.city);
    payload.append("address", form.address);
    payload.append("currency", form.currency);
    payload.append("operating_hours", JSON.stringify(form.operating_hours));
    payload.append("services_offered", JSON.stringify(form.services_offered));

    if (shopImageFile) {
      payload.append("shop_image", shopImageFile);
    } else if (!form.shop_image) {
      payload.append("shop_image", "");
    }

    const res = await shopService.update(id as string, payload);
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "Shop Updated", description: "Shop information updated successfully." });
      setIsEditing(false);
      router.refresh();
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to update shop." });
    }
  };

  if (fetching) return <div className="p-8 text-sm text-muted-foreground animate-pulse">Loading shop details...</div>;

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Shop Profile</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">View and manage your shop's primary details.</p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-semibold transition-colors"
          >
            <Edit2 size={16} /> Edit Shop
          </button>
        </div>
        
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row gap-8 items-start">
          {/* Avatar Area */}
          <div className="flex-shrink-0">
            <div className="h-28 w-28 rounded-xl border border-border bg-muted overflow-hidden flex items-center justify-center">
              {form.shop_image ? (
                <img src={form.shop_image} alt="Shop" className="h-full w-full object-cover" />
              ) : (
                <Building2 size={36} className="text-muted-foreground/50" />
              )}
            </div>
            <div className="mt-3 text-center">
              <span className="px-2.5 py-1 rounded-md bg-accent/50 text-accent-foreground text-xs font-semibold block flex items-center justify-center gap-1.5">
                <Globe size={12} /> {form.country || "IN"}
              </span>
            </div>
          </div>
          
          {/* Details */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Shop Name</p>
              <p className="text-base font-medium text-foreground">{form.name || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Owner</p>
              <p className="text-base font-medium text-foreground flex items-center gap-2">
                <UserIcon size={14} className="text-muted-foreground" /> {form.owner_name || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Contact Number</p>
              <p className="text-base font-medium text-foreground flex items-center gap-2">
                <Phone size={14} className="text-muted-foreground" /> {form.owner_phone || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Currency</p>
              <p className="text-base font-medium text-foreground flex items-center gap-2">
                <span className="text-muted-foreground font-semibold text-sm">¤</span> {form.currency || "—"}
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Location</p>
              <p className="text-base font-medium text-foreground flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-muted-foreground" /> {form.city ? `${form.city}, ${form.state}` : "—"}
              </p>
              <p className="text-sm text-muted-foreground pl-5">{form.address || ""}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="max-w-[700px] mx-auto pt-6 px-6 -mb-6 flex justify-end z-10 relative">
        <button 
          onClick={() => setIsEditing(false)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} /> Cancel Editing
        </button>
      </div>
      <ModuleForm
        title="Edit Shop Setup"
      subtitle={`Update information for shop`}
      backUrl="/app/shops"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:col-span-2">
        <div className="md:col-span-2">
          <WorkshopImageUpload
            label="Shop Image"
            value={form.shop_image}
            onChange={(val, file) => {
              setForm({ ...form, shop_image: val });
              if (file !== undefined) setShopImageFile(file);
            }}
            onError={(err) => toast({ type: "error", title: "Image Error", description: err })}
          />
        </div>

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
          <label className="text-xs font-normal text-muted-foreground ml-0.5">Owner Phone Number</label>
          <PhoneInput
            country={form.country.toLowerCase() || 'in'}
            value={form.owner_phone}
            onChange={(phone) => setForm(f => ({ ...f, owner_phone: `+${phone}` }))}
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
    </div>
  );
}
