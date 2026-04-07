"use client";

import React, { useEffect, useState } from "react";
import { useRBAC } from "@/lib/rbac";
import { userService } from "@/services/user.service";
import { useToast } from "@/components/ui/WorkshopToast";
import { User as UserIcon, Phone, Mail, Edit2, X, Shield, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { WorkshopImageUpload } from "@/components/ui/WorkshopImageUpload";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user } = useRBAC();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    profile_image: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  const userId = user?.id || user?.userId;

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    userService.getById(userId as string).then((res) => {
      if (res.success && res.data) {
        setProfile(res.data);
        setForm({
          name: res.data.name || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
          password: "",
          confirmPassword: "",
          profile_image: res.data.profile_image || ""
        });
      }
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center p-16">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center gap-3 p-16 rounded-2xl border border-dashed border-border bg-card/50">
          <UserIcon size={32} className="text-muted-foreground/30" />
          <p className="text-sm font-semibold text-muted-foreground">Unable to load profile data.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (form.password && form.password !== form.confirmPassword) {
      setPasswordError("Password mismatch");
      return;
    }
    setPasswordError("");
    setSaving(true);
    
    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("phone", form.phone);
    if (form.email) payload.append("email", form.email);
    
    if (profileImageFile) {
      payload.append("profile_image", profileImageFile);
    } else if (!form.profile_image) {
      payload.append("profile_image", "");
    }

    if (form.password) payload.append("password", form.password);

    const res = await userService.update(userId as string, payload);
    setSaving(false);

    if (res.success && res.data) {
      setProfile(res.data);
      // Reset sensitive fields
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      toast({ type: "success", title: "Saved", description: "Profile details updated successfully." });
      setIsEditing(false);
      router.refresh();
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to update profile." });
    }
  };

  const handleCancel = () => {
    setForm({
      name: profile.name || "",
      phone: profile.phone || "",
      email: profile.email || "",
      password: "",
      confirmPassword: "",
      profile_image: profile.profile_image || ""
    });
    setProfileImageFile(null);
    setPasswordError("");
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-6 md:gap-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Your Profile</h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">View and manage your personal account details.</p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 w-full sm:w-auto"
          >
            <Edit2 size={16} /> Edit Profile
          </button>
        </div>
        
        <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
          {/* Header Banner & Avatar */}
          <div className="bg-muted/10 px-6 pt-8 pb-6 md:pt-10 md:pb-8 flex flex-col items-center justify-center border-b border-border/50 relative">
            <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-background ring-1 ring-border/50 bg-muted overflow-hidden flex items-center justify-center shadow-lg mb-4 md:mb-5 z-10 transition-all">
              {form.profile_image ? (
                <img src={form.profile_image} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserIcon size={36} className="text-muted-foreground/30 md:scale-110" />
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground text-center z-10">{form.name || "Unknown User"}</h2>
            <div className="mt-2.5 md:mt-3 flex items-center gap-2 z-10">
              <span className="px-3 py-1 md:px-4 md:py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] md:text-xs font-black uppercase tracking-widest">
                {profile.status || "ACTIVE"}
              </span>
            </div>
          </div>
          
          {/* Details Grid */}
          <div className="p-5 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <div className="flex flex-col gap-1 p-4 md:p-5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Shield size={14} />
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">System Role</p>
              </div>
              <p className="text-sm md:text-base font-semibold text-foreground capitalize">{profile.role?.replace('_', ' ') || user?.role}</p>
            </div>
            
            <div className="flex flex-col gap-1 p-4 md:p-5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Phone size={14} />
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Contact Number</p>
              </div>
              <p className="text-sm md:text-base font-semibold text-foreground">{form.phone || "—"}</p>
            </div>
            
            <div className="flex flex-col gap-1 p-4 md:p-5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors sm:col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Mail size={14} />
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Email Address</p>
              </div>
              <p className="text-sm md:text-base font-semibold text-foreground">{form.email || "—"}</p>
            </div>
            
            <div className="flex flex-col gap-1 p-4 md:p-5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors sm:col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Building2 size={14} />
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Workshop Setup</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm md:text-base font-semibold text-foreground">
                  {profile.shop_id ? (user?.shopName || "Assigned to Workshop Hub") : "Global Oversight / Direct Access"}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {profile.shop_id ? "Your account is scoped strictly to this workshop." : "You have organization-wide access."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="max-w-[700px] mx-auto pt-6 px-6 -mb-6 flex justify-end z-10 relative">
        <button 
          onClick={handleCancel}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} /> Cancel Editing
        </button>
      </div>
      
      <ModuleForm
        title="Edit Profile"
        subtitle="Update your personal details and security settings."
        onSubmit={handleSubmit}
        loading={saving}
        backUrl="/app/settings"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:col-span-2 w-full">
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

          <div className="md:col-span-2">
             <AuthFormField
               label="Full Name"
               placeholder="e.g. John Doe"
               value={form.name}
               onChange={(e) => setForm({ ...form, name: e.target.value })}
               icon={<UserIcon size={16} />}
             />
          </div>

          <div className="md:col-span-1 flex flex-col gap-2">
            <label className="text-xs font-normal text-muted-foreground ml-0.5 mb-1.5 block">Contact Phone Number</label>
            <PhoneInput
              country="in"
              value={form.phone}
              onChange={(phone) => setForm(f => ({ ...f, phone: `+${phone}` }))}
              containerClass="!w-full"
              inputClass="!w-full !h-[42px] !bg-background !border !border-border !text-foreground !text-sm !rounded-md !px-4 !py-2.5 !pl-12 !transition-all !duration-200 focus:!border-primary focus:!ring-2 focus:!ring-primary/10"
              buttonClass="!bg-background !border !border-border !border-r-0 !rounded-l-md !hover:bg-muted/50"
              dropdownClass="!bg-card !border !border-border !text-foreground !shadow-xl !rounded-md"
              searchClass="!bg-muted !border !border-border !text-foreground"
            />
          </div>

          <div className="md:col-span-1">
            <AuthFormField
              label="Email Address"
              type="email"
              placeholder="e.g. user@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              icon={<Mail size={16} />}
            />
          </div>

          {/* Password Section */}
          <div className="md:col-span-2 mt-4">
            <div className="h-px bg-border/40 w-full mb-8" />
            <p className="text-sm font-bold text-foreground mb-4">
              Update Password (Optional)
            </p>
          </div>

          <div className="md:col-span-1">
            <AuthFormField
              label="New Password"
              type="password"
              placeholder="Leave blank to keep current"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="md:col-span-1">
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
        </div>
      </ModuleForm>
    </div>
  );
}
