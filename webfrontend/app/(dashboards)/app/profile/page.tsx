"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { userService } from "@/services/user.service";
import { useRBAC } from "@/lib/rbac";
import { User as UserIcon, Key, Shield, Phone, Mail, Edit2, X } from "lucide-react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { WorkshopImageUpload } from "@/components/ui/WorkshopImageUpload";


/** Official Personal Profile Management Interface */
export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: sessionUser } = useRBAC();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    profile_image: ""
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
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
            phone: res.data!.phone || "",
            email: res.data!.email || "",
            profile_image: res.data!.profile_image || ""
          }));
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [sessionUser?.id, sessionUser?.userId]);


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

    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("phone", form.phone);
    if (form.email) payload.append("email", form.email);
    
    // Append file if newly selected, otherwise append empty string if cleared
    if (profileImageFile) {
      payload.append("profile_image", profileImageFile);
    } else if (!form.profile_image) {
      payload.append("profile_image", "");
    }

    if (form.password) payload.append("password", form.password);

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
          u.profile_image = form.profile_image;
          localStorage.setItem("workshop_user", JSON.stringify(u));
        } catch {}
      }
      
      toast({ type: "success", title: "Profile Updated", description: "Your details have been refreshed." });
      setIsEditing(false);
      router.refresh(); // Refresh layout to pick up new name
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to update profile." });
    }
  };

  if (fetching) return <div className="p-8 text-sm text-muted-foreground animate-pulse">Loading profile...</div>;

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">View your personal account details.</p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-semibold transition-colors"
          >
            <Edit2 size={16} /> Edit Profile
          </button>
        </div>
        
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="h-28 w-28 rounded-xl border border-border bg-muted overflow-hidden flex items-center justify-center">
              {form.profile_image ? (
                <img src={form.profile_image} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserIcon size={36} className="text-muted-foreground/50" />
              )}
            </div>
            <div className="mt-3 text-center">
              <span className="px-2.5 py-1 rounded-md bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider block">
                {sessionUser?.role?.replace('_', ' ') || 'User'}
              </span>
            </div>
          </div>
          
          {/* Details */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Full Name</p>
              <p className="text-base font-medium text-foreground">{form.name || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Phone Number</p>
              <p className="text-base font-medium text-foreground flex items-center gap-2">
                <Phone size={14} className="text-muted-foreground" /> {form.phone || "—"}
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Email Address</p>
              <p className="text-base font-medium text-foreground flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground" /> {form.email || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Return to View Mode */}
      <div className="max-w-[700px] mx-auto pt-6 px-6 -mb-6 flex justify-end z-10 relative">
        <button 
          onClick={() => setIsEditing(false)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} /> Cancel Editing
        </button>
      </div>
      <ModuleForm
        title="Edit Profile"
        subtitle="Refine your personal account details and security settings."
      backUrl="/app"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Profile Image */}
        <div className="md:col-span-2">
          <WorkshopImageUpload
            label="Profile Picture"
            value={form.profile_image}
            onChange={(val, file) => {
              setForm({ ...form, profile_image: val });
              if (file !== undefined) setProfileImageFile(file);
            }}
            onError={(err) => toast({ type: "error", title: "Image Error", description: err })}
          />
        </div>
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

        {/* Email */}
        <div className="md:col-span-2">
          <AuthFormField
            label="Email Address"
            type="email"
            placeholder="e.g. alen@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {/* Custom Phone Input */}
        <div className="md:col-span-1">
          <label className="text-xs font-normal text-muted-foreground ml-0.5">Phone Number</label>
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
    </div>
  );
}
