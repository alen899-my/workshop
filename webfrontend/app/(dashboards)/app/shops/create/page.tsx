"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { shopService } from "@/services/shop.service";
import { Building2, MapPin, User as UserIcon } from "lucide-react";

/** Add Shop Page */
export default function CreateShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    location: "",
    owner_name: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location || !form.owner_name) {
       toast({ type: "error", title: "Required", description: "All fields are mandatory." });
       return;
    }

    setLoading(true);
    const res = await shopService.create(form);
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
        <div className="md:col-span-2">
           <AuthFormField
             label="Shop Name"
             placeholder="e.g. Speed Auto Works"
             value={form.name}
             onChange={(e) => setForm({ ...form, name: e.target.value })}
             icon={<Building2 size={16} />}
           />
        </div>

        <AuthFormField
          label="Owner Name"
          placeholder="e.g. Rajan K."
          value={form.owner_name}
          onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
          icon={<UserIcon size={16} />}
        />
        
        <AuthFormField
          label="Location"
          placeholder="e.g. Kochi, Kerala"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          icon={<MapPin size={16} />}
        />
      </div>

      <div className="md:col-span-2 p-6 rounded-2xl bg-primary/5 border border-primary/10 mt-4 flex items-center gap-4">
         <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 size={20} />
         </div>
         <p className="text-xs text-muted-foreground leading-relaxed">
           This will register a new shop in the system. Make sure the owner information is accurate.
         </p>
      </div>
    </ModuleForm>
  );
}
