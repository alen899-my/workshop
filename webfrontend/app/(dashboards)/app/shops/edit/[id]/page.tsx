"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { shopService } from "@/services/shop.service";
import { Building2, MapPin, User as UserIcon } from "lucide-react";

/** Edit Shop Page */
export default function EditShopPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    name: "",
    location: "",
    owner_name: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const res = await shopService.getById(id);
      if (res.success && res.data) {
        setForm({
          name: res.data.name,
          location: res.data.location,
          owner_name: res.data.owner_name
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
    const res = await shopService.update(id, form);
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "Shop Updated", description: "Shop information updated successfully." });
      router.push("/app/shops");
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to update shop." });
    }
  };

  if (fetching) return <div className="p-8 text-sm text-muted-foreground animate-pulse">Loading shop details...</div>;

  return (
    <ModuleForm
      title="Edit Shop"
      subtitle={`Update information for shop #${id}`}
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
    </ModuleForm>
  );
}
