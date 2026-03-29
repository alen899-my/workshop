"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { roleService } from "@/services/role.service";
import { PermissionGrid } from "@/components/common/PermissionGrid";
import { ShieldHalf } from "lucide-react";

/** Professional Interface to Refine Security Identity */
export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    status: "active" as "active" | "inactive",
    permissions: [] as string[]
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const res = await roleService.getById(id);
      if (res.success && res.data) {
        setForm({
          name: res.data.name,
          slug: res.data.slug,
          description: res.data.description || "",
          status: res.data.status,
          permissions: res.data.permissions || []
        });
      } else {
        toast({ type: "error", title: "Fetch Failed", description: "Identity not found." });
        router.push("/app/roles");
      }
      setFetching(false);
    };
    fetchData();
  }, [id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await roleService.update(id, form);
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "Profile Refined", description: `Security boundaries for ${form.name} updated.` });
      router.push("/app/roles");
    } else {
      toast({ type: "error", title: "Refine Failed", description: res.error || "Update error." });
    }
  };

  if (fetching) return <div className="p-8 font-mono text-[10px] opacity-40 uppercase tracking-widest">Re-syncing identity...</div>;

  return (
    <ModuleForm
      title="Refine Role Identity"
      subtitle={`Security Profile #${id} — modifying hierarchical access scope.`}
      backUrl="/app/roles"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="md:col-span-1">
        <AuthFormField
          label="Profile Name"
          placeholder="e.g. WORKSHOP_WORKER"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
          icon={<ShieldHalf size={16} />}
        />
      </div>
      <div className="md:col-span-1">
        <AuthFormField
          label="Access slug"
          placeholder="e.g. worker"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
          className="lowercase"
        />
      </div>

      <div className="md:col-span-2">
        <AuthFormField
          label="Internal Context"
          placeholder="Define the scope of this security profile..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="md:col-span-2 pt-6 border-t border-border/50">
         <h3 className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">
            Modify Permission Coverage Grid
         </h3>
         <PermissionGrid
           selectedSlugs={form.permissions}
           onChange={(perms) => setForm({ ...form, permissions: perms })}
         />
      </div>
    </ModuleForm>
  );
}
