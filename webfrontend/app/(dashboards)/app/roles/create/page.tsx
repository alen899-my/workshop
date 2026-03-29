"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { roleService } from "@/services/role.service";
import { PermissionGrid } from "@/components/common/PermissionGrid";
import { ShieldHalf } from "lucide-react";

/** Add Role Page */
export default function CreateRolePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    status: "active" as "active" | "inactive",
    permissions: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     if (!form.name || !form.slug) {
        toast({ type: "error", title: "Required", description: "Name and Slug are required." });
        return;
     }

    setLoading(true);
    const res = await roleService.create(form);
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "Role Added", description: `Role '${form.name}' created successfully.` });
      router.push("/app/roles");
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to create role." });
    }
  };

  return (
    <ModuleForm
      title="Add Role"
      subtitle="Create a new system role and assign its permission levels."
      backUrl="/app/roles"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="md:col-span-1">
        <AuthFormField
          label="Role Name"
          placeholder="e.g. Workshop Worker"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          icon={<ShieldHalf size={16} />}
        />
      </div>
      <div className="md:col-span-1">
        <AuthFormField
          label="Slug"
          placeholder="e.g. worker"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
        />
      </div>

      <div className="md:col-span-2">
        <AuthFormField
          label="Description"
          placeholder="Enter a brief description of this role"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="md:col-span-2 pt-6 border-t border-border/50">
         <h3 className="text-xs font-bold text-foreground mb-6">
            Permissions
         </h3>
         <PermissionGrid
           selectedSlugs={form.permissions}
           onChange={(perms) => setForm({ ...form, permissions: perms })}
         />
      </div>
    </ModuleForm>
  );
}
