"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { userService } from "@/services/user.service";
import { roleService, Role } from "@/services/role.service";
import { Shield, Key, Phone, User as UserIcon } from "lucide-react";
import { WorkshopSearchableSelect } from "@/components/ui/WorkshopSearchableSelect";

// Roles a shop_owner is allowed to assign
const OWNER_ASSIGNABLE_SLUGS = ["worker", "shop_owner"];

/** Add User Page */
export default function CreateUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [sessionUser, setSessionUser] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "worker",
    status: "active" as "active" | "inactive"
  });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    // Get logged-in user from session
    const saved = localStorage.getItem("workshop_user");
    if (saved) {
      try { setSessionUser(JSON.parse(saved)); } catch {}
    }

    // Load roles from backend
    const fetchRoles = async () => {
      const res = await roleService.getAll();
      if (res.success && res.data) setAllRoles(res.data);
    };
    fetchRoles();
  }, []);

  // Filter roles based on requester's role
  const isSuperAdmin = sessionUser?.role === "super-admin";
  const availableRoles = isSuperAdmin
    ? allRoles  // superadmin sees ALL roles
    : allRoles.filter(r => OWNER_ASSIGNABLE_SLUGS.includes(r.slug)); // shop_owner restricted

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password) {
      toast({ type: "error", title: "Missing Fields", description: "Name, phone, and password are required." });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");

    setLoading(true);
    // Backend auto-assigns shop_id for shop_owner.
    // confirmPassword is only for UI validation — don't send it to backend.
    const { confirmPassword, ...payload } = form;
    const res = await userService.create({ ...payload });
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "User Added", description: `${form.name} created successfully.` });
      router.push("/app/users");
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to create user." });
    }
  };

  return (
    <ModuleForm
      title="Add User"
      subtitle="Create a new user account for your team."
      backUrl="/app/users"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:col-span-2">
        <div className="md:col-span-2">
          <AuthFormField
            label="Full Name"
            placeholder="e.g. Rajan Kumar"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            icon={<UserIcon size={16} />}
          />
        </div>

        <AuthFormField
          label="Phone Number"
          placeholder="+91 XXXXX XXXXX"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          icon={<Phone size={16} />}
        />

        <AuthFormField
          label="Password"
          type="password"
          placeholder="Set a secure password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          icon={<Key size={16} />}
        />

        <AuthFormField
          label="Confirm Password"
          type="password"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={(e) => {
            setForm({ ...form, confirmPassword: e.target.value });
            if (passwordError) setPasswordError("");
          }}
          icon={<Key size={16} />}
          error={passwordError}
        />

        <div className="flex flex-col gap-2">
           <WorkshopSearchableSelect
              label="Role"
              placeholder="Select a role..."
              options={
                availableRoles.length > 0
                  ? availableRoles.map(r => ({ value: r.slug, label: r.name, subLabel: r.slug }))
                  : [
                      { value: "worker", label: "Worker", subLabel: "Technician" },
                      { value: "shop_owner", label: "Shop Owner", subLabel: "Manager" }
                    ]
              }
              value={form.role}
              onChange={(val) => setForm({ ...form, role: String(val) })}
              className="group"
           />
          {!isSuperAdmin && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Shop owners can only assign: Worker or Shop Owner
            </p>
          )}
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            className="w-full bg-card border border-border text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50 transition-all"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="md:col-span-2 p-5 rounded-xl bg-primary/5 border border-primary/10 mt-2 flex items-center gap-4">
        <Shield size={18} className="shrink-0 text-primary/40" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isSuperAdmin
            ? "You have full access to assign any role across all workshops."
            : "New users will be automatically assigned to your workshop."}
        </p>
      </div>
    </ModuleForm>
  );
}
