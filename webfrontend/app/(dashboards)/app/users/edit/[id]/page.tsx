"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { userService } from "@/services/user.service";
import { roleService, Role } from "@/services/role.service";
import { shopService, Shop } from "@/services/shop.service";
import { Shield, Phone, User as UserIcon, Building2, Mail, Edit2, X, Globe } from "lucide-react";
import { WorkshopSearchableSelect } from "@/components/ui/WorkshopSearchableSelect";
import { WorkshopInlineSelect } from "@/components/ui/WorkshopInlineSelect";
import { cn } from "@/lib/utils";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { WorkshopImageUpload } from "@/components/ui/WorkshopImageUpload";

/** Professional Interface to Refine Personnel Profile */
export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(searchParams.get("mode") === "edit");
  const [roles, setRoles] = useState<Role[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [sessionUser, setSessionUser] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    status: "active" as "active" | "inactive",
    shop_id: "" as string | number,
    password: "",
    confirmPassword: "",
    profile_image: ""
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    // Get logged-in user role
    const saved = localStorage.getItem("workshop_user");
    let currentUser: any = null;
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
        setSessionUser(currentUser);
      } catch { }
    }

    const fetchData = async () => {
      if (!id) return;

      const promises: any[] = [
        userService.getById(id),
        roleService.getOptions()
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
          email: uRes.data.email || "",
          role: uRes.data.role,
          status: uRes.data.status,
          shop_id: uRes.data.shop_id ? String(uRes.data.shop_id) : "",
          password: "",
          confirmPassword: "",
          profile_image: uRes.data.profile_image || ""
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

    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("phone", form.phone);
    if (form.email) payload.append("email", form.email);
    payload.append("role", form.role);
    payload.append("status", form.status);
    
    if (form.shop_id === "") {
       // payload.append("shop_id", ""); // Handled as null in backend
    } else {
       payload.append("shop_id", String(form.shop_id));
    }

    if (profileImageFile) {
      payload.append("profile_image", profileImageFile);
    } else if (!form.profile_image) {
      payload.append("profile_image", "");
    }

    if (form.password) payload.append("password", form.password);

    const res = await userService.update(id, payload);
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "User Updated", description: "User information updated successfully." });
      setIsEditing(false);
      router.refresh();
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to update user." });
    }
  };

  if (fetching) return <div className="p-8 text-sm text-muted-foreground animate-pulse">Loading user details...</div>;

  const isSuperAdmin = sessionUser?.role === 'super-admin';

  // Filter roles based on requester's level
  const displayedRoles = isSuperAdmin ? roles : roles.filter(r => r.slug !== 'super-admin' && r.slug !== 'admin');

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">User Profile</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">Personnel details and system access level.</p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-semibold transition-colors"
          >
            <Edit2 size={16} /> Edit User
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
              <span className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider block",
                form.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
              )}>
                {form.status}
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Role</p>
              <p className="text-base font-medium text-foreground flex items-center gap-2">
                <Shield size={14} className="text-primary/60" /> {form.role?.replace('_', ' ')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Phone Number</p>
              <p className="text-base font-medium text-foreground flex items-center gap-2">
                <Phone size={14} className="text-muted-foreground" /> {form.phone || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Email Address</p>
              <p className="text-base font-medium text-foreground flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground" /> {form.email || "—"}
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Workshop Assignment</p>
              <p className="text-base font-medium text-foreground flex items-center gap-2">
                <Building2 size={14} className="text-muted-foreground" /> 
                {form.shop_id ? (shops.find(s => String(s.id) === String(form.shop_id))?.name || "Workshop Hub") : "Global / Direct"}
              </p>
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
          onClick={() => setIsEditing(false)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} /> Cancel Editing
        </button>
      </div>
      <ModuleForm
        title="Edit User"
        subtitle="Update information for this team member."
        backUrl="/app/users"
        onSubmit={handleSubmit}
        loading={loading}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:col-span-2">
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
            placeholder="e.g. Alen John"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            icon={<UserIcon size={16} />}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-normal text-muted-foreground ml-0.5">Contact Phone Number</label>
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
          label="Email Address"
          type="email"
          placeholder="e.g. user@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <div className="flex flex-col gap-2">
          <WorkshopSearchableSelect
            label="Role"
            placeholder="Select a role..."
            options={
              displayedRoles.length > 0
                ? displayedRoles.map(r => ({ value: r.slug, label: r.name, subLabel: r.slug }))
                : [
                  { value: "worker", label: "Worker", subLabel: "Technician" },
                  { value: "shop_owner", label: "Shop Owner", subLabel: "Manager" }
                ].filter(r => isSuperAdmin || (r.value !== 'super-admin' && r.value !== 'admin'))
            }
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
              options={[
                { value: "", label: "Direct (Global)" },
                ...shops.map(s => ({ value: String(s.id), label: s.name, subLabel: s.location }))
              ]}
              value={String(form.shop_id)}
              onChange={(val) => setForm({ ...form, shop_id: String(val) })}
              className="group"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground ml-0.5">
            Status
          </label>
          <WorkshopInlineSelect
            value={form.status}
            onChange={(val) => setForm({ ...form, status: val as any })}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            wrapperClassName="w-full min-w-0"
            className="w-full bg-card border-border text-sm px-4 py-2.5 font-medium normal-case tracking-normal"
          />
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
    </div>
  );
}
