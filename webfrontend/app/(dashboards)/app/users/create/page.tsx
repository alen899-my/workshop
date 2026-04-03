"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { userService } from "@/services/user.service";
import { roleService, Role } from "@/services/role.service";
import { shopService, Shop } from "@/services/shop.service";
import { Shield, Key, Phone, User as UserIcon } from "lucide-react";
import { WorkshopSearchableSelect } from "@/components/ui/WorkshopSearchableSelect";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { cn } from "@/lib/utils";

// Roles a shop_owner is allowed to assign
const OWNER_ASSIGNABLE_SLUGS = ["worker", "shop_owner"];

/** Add User Page - Professional Personnel Registration */
export default function CreateUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [sessionUser, setSessionUser] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "worker",
    status: "active" as "active" | "inactive",
    shop_id: ""
  });
  const [passwordError, setPasswordError] = useState("");

  const isSuperAdmin = sessionUser?.role === "super-admin";

  useEffect(() => {
    let checkSuper = false;
    const saved = localStorage.getItem("workshop_user");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setSessionUser(user);
        checkSuper = user.role === "super-admin";
      } catch { }
    }

    const fetchData = async () => {
      const [rRes, sRes] = await Promise.all([
        roleService.getOptions(),
        checkSuper ? shopService.getAll() : Promise.resolve({ success: false, data: [] })
      ]);
      if (rRes.success && rRes.data) setAllRoles(rRes.data);
      if (sRes?.success && sRes.data) setShops(sRes.data);
    };
    fetchData();
  }, []);

  // Filter roles based on requester's role
  const availableRoles = useMemo(() => {
    if (isSuperAdmin) return allRoles;
    return allRoles.filter(r => OWNER_ASSIGNABLE_SLUGS.includes(r.slug));
  }, [allRoles, isSuperAdmin]);

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

    // Process payload
    const { confirmPassword, ...payload } = form;
    const finalPayload: any = { ...payload };

    // Explicit shop_id handling
    if (!finalPayload.shop_id || finalPayload.shop_id === "") {
      delete finalPayload.shop_id;
    } else {
      finalPayload.shop_id = Number(finalPayload.shop_id);
    }

    const res = await userService.create(finalPayload);
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
      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="md:col-span-2">
          <AuthFormField
            label="Full Name"
            placeholder="e.g. Rajan Kumar"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            icon={<UserIcon size={16} />}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">Contact Phone Number</label>
          <PhoneInput
            country="in"
            value={form.phone}
            onChange={(phone) => setForm(f => ({ ...f, phone: `+${phone}` }))}
            containerClass="!w-full"
            inputClass="!w-full !h-[42px] !bg-background !border !border-border !text-foreground !text-sm !rounded-md !px-4 !py-2.5 !pl-12 focus:!border-primary focus:!ring-2 focus:!ring-primary/10 transition-all duration-200"
            buttonClass="!bg-background !border !border-border !border-r-0 !rounded-l-md hover:!bg-muted"
            dropdownClass="!bg-card !border !border-border !text-foreground !shadow-xl !rounded-md"
            searchClass="!bg-muted !border !border-border !text-foreground"
          />
        </div>

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
                ? availableRoles.filter(r => isSuperAdmin || (r.slug !== 'super-admin' && r.slug !== 'admin')).map(r => ({ value: r.slug, label: r.name, subLabel: r.slug }))
                : [
                  { value: "worker", label: "Worker", subLabel: "Technician" },
                  { value: "shop_owner", label: "Shop Owner", subLabel: "Manager" }
                ]
            }
            value={form.role}
            onChange={(val) => setForm({ ...form, role: String(val) })}
          />
          {!isSuperAdmin && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Shop owners can only assign: Worker or Shop Owner
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground ml-0.5">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            className="w-full bg-card border border-border text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50 transition-all font-medium"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {isSuperAdmin && shops.length > 0 && (
          <div className="flex flex-col gap-2 md:col-span-2">
            <WorkshopSearchableSelect
              label="Workshop Assignment"
              placeholder="Select assigned workshop..."
              options={[
                { value: "", label: "Direct (Global)" },
                ...shops.map(shop => ({ value: String(shop.id), label: shop.name, subLabel: shop.location }))
              ]}
              value={form.shop_id}
              onChange={(val) => setForm({ ...form, shop_id: String(val) })}
            />
          </div>
        )}

        <div className="md:col-span-2 p-5 rounded-xl bg-primary/5 border border-primary/10 mt-2 flex items-center gap-4">
          <Shield size={18} className="shrink-0 text-primary/40" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isSuperAdmin
              ? "You have full access to assign any role across all workshops."
              : "New users will be automatically assigned to your workshop."}
          </p>
        </div>
      </div>
    </ModuleForm>
  );
}
