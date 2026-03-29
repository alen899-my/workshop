"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { permissionService } from "@/services/permission.service";
import { Shield } from "lucide-react";

/** Page to Refine an Existing Permission Record */
export default function EditPermissionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    module_name: "",
    permission_name: "",
    slug: "",
    description: "",
    status: "active" as "active" | "inactive"
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const res = await permissionService.getById(id);
      if (res.success && res.data) {
        setForm({
          module_name: res.data.module_name,
          permission_name: res.data.permission_name,
          slug: res.data.slug,
          description: res.data.description || "",
          status: res.data.status
        });
      } else {
        toast({ type: "error", title: "Fetch Failed", description: "Rule not found." });
        router.push("/app/permissions");
      }
      setFetching(false);
    };
    fetchData();
  }, [id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await permissionService.update(id, form);
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "Refined", description: "Access rule successfully updated." });
      router.push("/app/permissions");
    } else {
      toast({ type: "error", title: "Update Failed", description: res.error || "Could not save changes." });
    }
  };

  if (fetching) return <div className="p-8 font-mono text-[10px] opacity-40 uppercase tracking-widest">Re-fetching access rule...</div>;

  return (
    <ModuleForm
      title="Refine System Rule"
      subtitle={`Modifying access profile for internal permission #${id}.`}
      backUrl="/app/permissions"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="md:col-span-2 pb-4 border-b border-border/50">
        <AuthFormField
          label="Target Module / Resource"
          placeholder="e.g. INVENTORY"
          value={form.module_name}
          onChange={(e) => setForm({ ...form, module_name: e.target.value.toUpperCase() })}
          icon={<Shield size={16} />}
        />
      </div>

      <div className="md:col-span-2 p-6 rounded-2xl border border-border bg-muted/10 mt-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AuthFormField
              label="Permission Name"
              placeholder="e.g. READ_ONLY"
              value={form.permission_name}
              onChange={(e) => setForm({ ...form, permission_name: e.target.value })}
            />
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#150618] font-mono">Current Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full bg-white border-2 border-[#D1D5DB] text-sm font-medium rounded-sm px-4 py-3 font-mono focus:outline-none focus:border-[#3B82F6] transition-all"
              >
                <option value="active">Active Access</option>
                <option value="inactive">Restricted / Inactive</option>
              </select>
            </div>
          </div>

          <AuthFormField
            label="Security Slug"
            placeholder="e.g. global:read"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
            className="lowercase"
          />

          <AuthFormField
            label="Internal Context / Description"
            placeholder="Explain the security scope of this rule..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
      </div>
    </ModuleForm>
  );
}
