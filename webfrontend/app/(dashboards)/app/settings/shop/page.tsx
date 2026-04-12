"use client";

import React, { useEffect, useState } from "react";
import { useRBAC } from "@/lib/rbac";
import { shopService, Shop } from "@/services/shop.service";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { useToast } from "@/components/ui/WorkshopToast";
import { Building2, MapPin, Phone, User as UserIcon, Globe, Lock, Edit2, X, Clock, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";

import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { WorkshopRegionSelects } from "@/components/ui/WorkshopRegionSelects";
import countryToCurrency from 'country-to-currency';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { WorkshopImageUpload } from "@/components/ui/WorkshopImageUpload";
import { WorkshopInlineSelect } from "@/components/ui/WorkshopInlineSelect";

const SHOP_PERMISSION = "can:see:the:shop:details:and:can:edit";

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

export default function ShopSettingsPage() {
  const router = useRouter();
  const { can, user } = useRBAC();
  const { toast } = useToast();
  const canManageShop = can(SHOP_PERMISSION);

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
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

  const shopId = user?.shopId || user?.shop_id;

  useEffect(() => {
    if (!canManageShop) return;
    if (!shopId) { setLoading(false); return; }

    shopService.getById(shopId).then((res) => {
      if (res.success && res.data) {
        setShop(res.data);
        setForm({
          name: res.data.name || "",
          owner_name: res.data.owner_name || "",
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
      }
      setLoading(false);
    });
  }, [shopId, canManageShop]);

  if (!canManageShop) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center gap-3 p-16 rounded-2xl border border-dashed border-border bg-card/50">
          <Lock size={32} className="text-muted-foreground/30" />
          <p className="text-sm font-semibold text-muted-foreground">You don't have permission to view shop details.</p>
          <p className="text-xs text-muted-foreground/60">Contact your administrator to request access.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center p-16">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center gap-3 p-16 rounded-2xl border border-dashed border-border bg-card/50">
          <Building2 size={32} className="text-muted-foreground/30" />
          <p className="text-sm font-semibold text-muted-foreground">No shop found for your account.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setSaving(true);
    
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

    const res = await shopService.update(shopId as string, payload);
    setSaving(false);

    if (res.success && res.data) {
      setShop(res.data);
      toast({ type: "success", title: "Saved", description: "Shop details updated successfully." });
      setIsEditing(false);
      router.refresh();
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to save changes." });
    }
  };

  const handleCancel = () => {
    setForm({
      name: shop.name || "",
      owner_name: shop.owner_name || "",
      owner_phone: shop.owner_phone || shop.phone || "",
      country: shop.country || "IN",
      state: shop.state || "",
      city: shop.city || shop.location || "",
      address: shop.address || "",
      currency: shop.currency || "INR",
      shop_image: shop.shop_image || "",
      operating_hours: shop.operating_hours || defaultHours,
      services_offered: shop.services_offered || []
    });
    setShopImageFile(null);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-6 md:gap-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Shop Profile</h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">View and manage your shop's primary details.</p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 w-full sm:w-auto"
          >
            <Edit2 size={16} /> Edit Shop
          </button>
        </div>
        
        <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
          {/* Header Banner & Avatar */}
          <div className="bg-muted/10 px-6 pt-8 pb-6 md:pt-10 md:pb-8 flex flex-col items-center justify-center border-b border-border/50 relative">
            <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-background ring-1 ring-border/50 bg-muted overflow-hidden flex items-center justify-center shadow-lg mb-4 md:mb-5 z-10 transition-all">
              {form.shop_image ? (
                <img src={form.shop_image} alt="Shop" className="h-full w-full object-cover" />
              ) : (
                <Building2 size={36} className="text-muted-foreground/30 md:scale-110" />
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground text-center z-10">{form.name || "Unnamed Shop"}</h2>
            <div className="mt-2.5 md:mt-3 flex items-center gap-2 z-10">
              <span className="px-3 py-1 md:py-1.5 rounded-md bg-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Globe size={12} className="md:w-[14px] md:h-[14px]" /> {form.country || "IN"}
              </span>
            </div>
          </div>
          
          {/* Details Grid */}
          <div className="p-5 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <div className="flex flex-col gap-1 p-4 md:p-5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <UserIcon size={14} />
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Shop Owner</p>
              </div>
              <p className="text-sm md:text-base font-semibold text-foreground">{form.owner_name || "—"}</p>
            </div>
            
            <div className="flex flex-col gap-1 p-4 md:p-5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Phone size={14} />
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Contact Number</p>
              </div>
              <p className="text-sm md:text-base font-semibold text-foreground">{form.owner_phone || "—"}</p>
            </div>
            
            <div className="flex flex-col gap-1 p-4 md:p-5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <span className="font-bold text-sm leading-none ml-1 mr-1">¤</span>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Billing Currency</p>
              </div>
              <p className="text-sm md:text-base font-semibold text-foreground">{form.currency || "—"}</p>
            </div>
            
            <div className="flex flex-col gap-1 p-4 md:p-5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors sm:col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin size={14} />
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Shop Location</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm md:text-base font-semibold text-foreground">{form.city ? `${form.city}, ${form.state}` : "—"}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{form.address || "No detailed address provided."}</p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-border/50">
             {/* Operating Hours View */}
             <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-2 mb-1">
                   <Clock size={16} className="text-primary"/> 
                   <h3 className="font-bold text-foreground text-sm uppercase tracking-widest">Operating Hours</h3>
                 </div>
                 <div className="flex flex-col gap-2 bg-muted/20 p-4 rounded-xl border border-border/50">
                   {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                     const dayData = shop.operating_hours?.[day] || defaultHours[day as keyof typeof defaultHours];
                     return (
                       <div key={day} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                         <span className="capitalize text-muted-foreground text-sm font-medium">{day}</span>
                         <span className="text-sm font-semibold text-foreground bg-background px-2 py-0.5 rounded shadow-sm border border-border/50">
                           {dayData.closed ? "Closed" : `${dayData.open} - ${dayData.close}`}
                         </span>
                       </div>
                     )
                   })}
                 </div>
             </div>
             
             {/* Services Offered View */}
             <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-2 mb-1">
                   <Wrench size={16} className="text-primary"/> 
                   <h3 className="font-bold text-foreground text-sm uppercase tracking-widest">Services Offered</h3>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {shop.services_offered && shop.services_offered.length > 0 ? (
                      shop.services_offered.map((service, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-semibold shadow-sm">
                          {service}
                        </span>
                      ))
                   ) : (
                      <div className="p-4 rounded-xl bg-muted/20 border border-border/50 w-full text-center">
                        <span className="text-muted-foreground text-sm">No specific services listed.</span>
                      </div>
                   )}
                 </div>
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
          onClick={handleCancel}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} /> Cancel Editing
        </button>
      </div>
      
      <ModuleForm
        title="Edit Shop Setup"
        subtitle="Update information for your shop"
        onSubmit={handleSubmit}
        loading={saving}
        backUrl="/app/settings"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:col-span-2 w-full">
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
            <label className="text-xs font-normal text-muted-foreground ml-0.5 mb-1.5 block">Owner Phone Number</label>
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

          {/* New Operating Hours module */}
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

          {/* New Services Offered module */}
          <div className="md:col-span-2 pt-6 border-t border-border mt-2">
            <h3 className="font-bold text-sm tracking-widest uppercase mb-4 text-foreground">Services Offered</h3>
            <p className="text-xs text-muted-foreground mb-4">Select all services provided by your shop. This helps standardize job creation.</p>
            
            <div className="flex flex-col gap-4 max-w-2xl">
              {/* Selected Services Tags */}
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

              {/* Add Service Controls */}
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
