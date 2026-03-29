"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { userService } from "@/services/user.service";
import { roleService, Role } from "@/services/role.service";
import { shopService, Shop } from "@/services/shop.service";
import { Shield, Phone, User as UserIcon, Building2 } from "lucide-react";
import { WorkshopSearchableSelect } from "@/components/ui/WorkshopSearchableSelect";

/** Professional Interface to Refine Personnel Profile */
export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [sessionUser, setSessionUser] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "",
    status: "active" as "active" | "inactive",
    shop_id: "" as string | number,
    password: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    // Get logged-in user role
    const saved = localStorage.getItem("workshop_user");
    let currentUser: any = null;
    if (saved) {
      try { 
        currentUser = JSON.parse(saved);
        setSessionUser(currentUser); 
      } catch {}
    }

    const fetchData = async () => {
      if (!id) return;
      
      const promises: any[] = [
        userService.getById(id),
        roleService.getAll()
      ];

      if (currentUser?.role === 'super-admin') {
        promises.push(shopService.getAll());
      }

      const [uRes, rRes, sRes] = await Promise.all(promises);

      if (rRes.success && rRes.data) setRoles(rRes.data);
      if (sRes?.success && sRes.data) setShops(sRes.data);
      
      if (uRes.success && uRes.data) {
        setForm({
          name: uRes.data.name || "",
          phone: uRes.data.phone,
          role: uRes.data.role,
          status: uRes.data.status,
          shop_id: uRes.data.shop_id || "",
          password: "",
          confirmPassword: ""
        });
      } else {
        toast({ type: "error", title: "Error", description: "User not found." });
        router.push("/app/users");
      }
      setFetching(false);
    };
    fetchData();
  }, [id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      setPasswordError("Confirm password mismatch");
      return;
    }
    setPasswordError("");
    setLoading(true);

    const { confirmPassword, ...payload } = form;
    if (!payload.password) delete (payload as any).password;
    if (payload.shop_id) payload.shop_id = Number(payload.shop_id);

    const res = await userService.update(id, payload as any);
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "User Updated", description: "User information updated successfully." });
      router.push("/app/users");
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to update user." });
    }
  };

  if (fetching) return <div className="p-8 text-sm text-muted-foreground animate-pulse">Loading user details...</div>;

  const isSuperAdmin = sessionUser?.role === 'super-admin';

  return (
    <ModuleForm
      title="Edit User"
      subtitle="Update information for this team member."
      backUrl="/app/users"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:col-span-2">
        <div className="md:col-span-2">
           <AuthFormField
             label="Full Name"
             placeholder="e.g. Alen John"
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
        
        <div className="flex flex-col gap-2">
           <WorkshopSearchableSelect
              label="Role"
              placeholder="Select a role..."
              options={roles.map(r => ({ value: r.slug, label: r.name, subLabel: r.slug }))}
              value={form.role}
              onChange={(val) => setForm({ ...form, role: String(val) })}
              className="group"
           />
        </div>

        {isSuperAdmin && (
          <div className="flex flex-col gap-2">
            <WorkshopSearchableSelect
               label="Workshop Hub Assignment"
               placeholder="Select shop..."
               options={shops.map(s => ({ value: s.id, label: s.name, subLabel: s.location }))}
               value={form.shop_id}
               onChange={(val) => setForm({ ...form, shop_id: val })}
               className="group"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
           <label className="text-xs font-semibold text-muted-foreground ml-0.5">
              Status
           </label>
           <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              className="w-full bg-card border border-border text-sm rounded-md px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all font-medium"
           >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
           </select>
        </div>

        <div className="md:col-span-2 mt-4">
           <div className="h-px bg-border/40 w-full mb-8" />
           <p className="text-sm font-bold text-foreground mb-4">
              Security Reset (Optional)
           </p>
        </div>

        <AuthFormField
          label="New Password"
          type="password"
          placeholder="Leave blank to keep current"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <AuthFormField
          label="Confirm Password"
          type="password"
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChange={(e) => {
            setForm({ ...form, confirmPassword: e.target.value });
            if (passwordError) setPasswordError("");
          }}
          error={passwordError}
        />
      </div>
    </ModuleForm>
  );
}
