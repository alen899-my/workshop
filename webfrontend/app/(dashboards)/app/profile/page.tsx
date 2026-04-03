"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { userService } from "@/services/user.service";
import { useRBAC } from "@/lib/rbac";
import { User as UserIcon, Key, Shield } from "lucide-react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';


/** Official Personal Profile Management Interface */
export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: sessionUser } = useRBAC();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const actualId = sessionUser?.userId || sessionUser?.id;
      if (!actualId) return;
      
      try {
        const res = await userService.getById(actualId);

        if (res.success && res.data) {
          setForm(f => ({
            ...f,
            name: res.data!.name || "",
            phone: res.data!.phone || ""
          }));
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [sessionUser?.id]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({ type: "error", title: "Missing Fields", description: "Name and phone are required." });
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);
    setPasswordError("");

    const payload: any = {
      name: form.name,
      phone: form.phone
    };
    if (form.password) payload.password = form.password;

    const actualId = sessionUser?.userId || sessionUser?.id;
    if (!actualId) {
       toast({ type: "error", title: "Error", description: "User ID not found in session." });
       return;
    }

    const res = await userService.update(actualId, payload);



    setLoading(false);

    if (res.success) {
      // Update local storage so header updates immediately
      const saved = localStorage.getItem("workshop_user");
      if (saved) {
        try {
          const u = JSON.parse(saved);
          u.ownerName = form.name; // This is used for initials in the header
          u.name = form.name;
          u.phone = form.phone;
          localStorage.setItem("workshop_user", JSON.stringify(u));
        } catch {}
      }
      
      toast({ type: "success", title: "Profile Updated", description: "Your details have been refreshed." });
      router.refresh(); // Refresh layout to pick up new name
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to update profile." });
    }
  };

  if (fetching) return <div className="p-8 text-sm text-muted-foreground animate-pulse">Loading profile...</div>;

  return (
    <ModuleForm
      title="My Profile"
      subtitle="Refine your personal account details and security settings."
      backUrl="/app"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Name */}
        <div className="md:col-span-2">
          <AuthFormField
            label="Full Name"
            placeholder="e.g. Alen John"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            icon={<UserIcon size={16} />}
          />
        </div>

        {/* Custom Phone Input */}
        <div className="md:col-span-1">
          <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1">Phone Number</label>
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

        {/* Role Badge (Read Only) */}
        <div className="md:col-span-1">
           <label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground ml-1 mb-2 block">Assigned Role</label>
           <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20">
              <Shield size={16} className="text-primary/60" />
              <span className="text-sm font-bold uppercase tracking-widest text-foreground">
                {sessionUser?.role?.replace('_', ' ') || 'User'}
              </span>
           </div>
        </div>

        {/* Password Reset Section */}
        <div className="md:col-span-2 mt-4 pt-4 border-t border-border/40">
           <h3 className="text-xs font-black uppercase tracking-[2px] text-primary mb-4 flex items-center gap-2">
              <Key size={14} /> Update Security
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AuthFormField
                label="New Password"
                type="password"
                placeholder="Leave blank to keep current"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <AuthFormField
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={form.confirmPassword}
                onChange={(e) => {
                   setForm({ ...form, confirmPassword: e.target.value });
                   if (passwordError) setPasswordError("");
                }}
                error={passwordError}
              />
           </div>
        </div>
      </div>
    </ModuleForm>
  );
}
