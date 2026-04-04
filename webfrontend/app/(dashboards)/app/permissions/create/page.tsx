"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { AuthFormField } from "@/components/ui/AuthFormField";
import { useToast } from "@/components/ui/WorkshopToast";
import { permissionService } from "@/services/permission.service";
import { Plus, Trash2, Shield } from "lucide-react";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import { WorkshopInlineSelect } from "@/components/ui/WorkshopInlineSelect";

interface PermissionItem {
  permission_name: string;
  slug: string;
  description: string;
  status: "active" | "inactive";
}

/** Page to Create Multiple Permission Rules for a Module */
export default function CreatePermissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [moduleName, setModuleName] = useState("");

  const [items, setItems] = useState<PermissionItem[]>([
    { permission_name: "", slug: "", description: "", status: "active" }
  ]);

  const addRow = () => {
    setItems([...items, { permission_name: "", slug: "", description: "", status: "active" }]);
  };

  const removeRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PermissionItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-generate slug if name is changed and slug was empty or matched previous auto-gen
    if (field === 'permission_name') {
       const suggestion = value.toLowerCase().trim().replace(/\s+/g, ':');
       newItems[index].slug = suggestion;
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleName.trim()) {
       toast({ type: "error", title: "Required", description: "Module name is missing." });
       return;
    }

    const invalid = items.some(item => !item.permission_name || !item.slug);
    if (invalid) {
       toast({ type: "error", title: "Validation Error", description: "All rows must have a name and slug." });
       return;
    }

    setLoading(true);
    const res = await permissionService.create({ module_name: moduleName.toUpperCase(), items });
    setLoading(false);

    if (res.success) {
      toast({ type: "success", title: "Permissions Added", description: `Permissions successfully added to ${moduleName}.` });
      router.push("/app/permissions");
    } else {
      toast({ type: "error", title: "Error", description: res.error || "Failed to add permissions." });
    }
  };

  return (
    <ModuleForm
      title="Add Permissions"
      subtitle="Create multiple access permissions for a module."
      backUrl="/app/permissions"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="md:col-span-2 pb-4 border-b border-border/50">
          <AuthFormField
            label="Module Name"
            placeholder="e.g. Inventory, Repairs, Users"
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value.toUpperCase())}
            icon={<Shield size={16}/>}
          />
      </div>

      <div className="md:col-span-2 flex flex-col gap-6 mt-2">
         <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground">
               Permissions List
            </h3>
            <button 
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 transition-all"
            >
               <Plus size={14} />
               Add Row
            </button>
         </div>

         {items.map((item, idx) => (
           <div key={idx} className="relative grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-xl border border-border bg-muted/20 animate-in slide-in-from-right-2 duration-300">
              {items.length > 1 && (
                <button 
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-destructive text-white shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                >
                  <Trash2 size={12} />
                </button>
              )}
              
              <div className="md:col-span-4">
                <AuthFormField
                  label="Permission Name"
                  placeholder="e.g. VIEW_ALL"
                  value={item.permission_name}
                  onChange={(e) => updateItem(idx, 'permission_name', e.target.value)}
                />
              </div>

              <div className="md:col-span-4">
                <AuthFormField
                  label="Security Slug"
                  placeholder="e.g. inventory:view"
                  value={item.slug}
                  onChange={(e) => updateItem(idx, 'slug', e.target.value.toLowerCase())}
                  className="lowercase"
                />
              </div>

              <div className="md:col-span-4 flex flex-col gap-2">
                 <label className="text-xs font-semibold text-muted-foreground">Status</label>
                 <WorkshopInlineSelect
                   value={item.status}
                   onChange={(val) => updateItem(idx, 'status', val)}
                   options={[
                     { value: "active", label: "Active" },
                     { value: "inactive", label: "Inactive" },
                   ]}
                   wrapperClassName="w-full min-w-0"
                   className="w-full bg-card border-border text-sm px-4 py-3 font-medium normal-case tracking-normal"
                 />
              </div>

              <div className="md:col-span-12">
                 <AuthFormField
                   label="Description"
                   placeholder="Enter a brief description"
                   value={item.description}
                   onChange={(e) => updateItem(idx, 'description', e.target.value)}
                 />
              </div>
           </div>
         ))}
      </div>
    </ModuleForm>
  );
}
