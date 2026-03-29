"use client";

import React, { useEffect, useState } from "react";
import { permissionService, Permission } from "@/services/permission.service";
import { cn } from "@/lib/utils";
import { Check, Shield, Search } from "lucide-react";

interface PermissionGridProps {
  selectedSlugs: string[];
  onChange: (slugs: string[]) => void;
  disabled?: boolean;
}

/** Professional Role-Permission Assignment Matrix (Table Format) */
export function PermissionGrid({ selectedSlugs, onChange, disabled }: PermissionGridProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load all available permissions for the matrix
  useEffect(() => {
    const fetchAll = async () => {
      const res = await permissionService.getAll();
      if (res.success && res.data) setPermissions(res.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const toggleSlug = (slug: string) => {
    if (disabled) return;
    if (selectedSlugs.includes(slug)) {
      onChange(selectedSlugs.filter(s => s !== slug));
    } else {
      onChange([...selectedSlugs, slug]);
    }
  };

  const isAllSelected = (moduleName: string, modulePerms: Permission[]) => {
    const slugs = modulePerms.map(p => p.slug);
    return slugs.every(s => selectedSlugs.includes(s));
  };

  const toggleModule = (modulePerms: Permission[]) => {
    if (disabled) return;
    const slugs = modulePerms.map(p => p.slug);
    const moduleName = modulePerms[0]?.module_name;
    
    if (isAllSelected(moduleName, modulePerms)) {
      onChange(selectedSlugs.filter(s => !slugs.includes(s)));
    } else {
      const uniqueNew = Array.from(new Set([...selectedSlugs, ...slugs]));
      onChange(uniqueNew);
    }
  };

  // Group by module
  const filtered = permissions.filter(p => 
    p.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.module_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = filtered.reduce((acc, p) => {
    const mod = p.module_name.toUpperCase();
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) return <div className="p-4 text-sm text-muted-foreground animate-pulse">Loading permissions...</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* Search Header */}
      <div className="relative mb-2">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
        <input 
          type="text" 
          placeholder="Search permissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3.5 text-left w-12 text-center">Select</th>
              <th className="px-6 py-3.5 text-left">Module</th>
              <th className="px-6 py-3.5 text-left">Permission Name</th>
              <th className="px-6 py-3.5 text-left hidden sm:table-cell">System Slug</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {Object.entries(grouped).map(([moduleName, perms]) => (
              <React.Fragment key={moduleName}>
                {/* Module Header Row */}
                <tr className="bg-muted/10 group">
                   <td className="px-6 py-2.5 text-center border-r border-border/10">
                      <div 
                         onClick={() => toggleModule(perms)}
                         className={cn(
                           "mx-auto h-4 w-4 cursor-pointer flex items-center justify-center rounded border transition-all",
                           isAllSelected(moduleName, perms) ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-card border-border hover:border-primary/40",
                           disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                         )}
                      >
                         {isAllSelected(moduleName, perms) && <Check size={10} strokeWidth={4} />}
                      </div>
                   </td>
                   <td colSpan={3} className="px-6 py-2.5">
                      <div className="flex items-center gap-2">
                         <Shield size={12} className="text-primary/60" />
                         <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/90">
                           {moduleName}
                         </span>
                         <span className="ml-1 text-[10px] text-muted-foreground/50 font-medium">
                           ({perms.length} selected)
                         </span>
                      </div>
                   </td>
                </tr>

                {/* Slug Rows */}
                {perms.map((p) => {
                  const isActive = selectedSlugs.includes(p.slug);
                  return (
                    <tr 
                      key={p.slug}
                      onClick={() => toggleSlug(p.slug)}
                      className={cn(
                        "group cursor-pointer transition-colors",
                        isActive ? "bg-primary/[0.02]" : "hover:bg-accent/5",
                        disabled && "opacity-50 pointer-events-none"
                      )}
                    >
                      <td className="px-6 py-3.5 text-center">
                         <div className={cn(
                           "mx-auto h-3.5 w-3.5 flex items-center justify-center rounded border transition-colors",
                           isActive ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border group-hover:border-primary/30"
                         )}>
                            {isActive && <Check size={9} strokeWidth={4} />}
                         </div>
                      </td>
                      <td className="px-6 py-3.5">
                         <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                            {moduleName}
                         </span>
                      </td>
                      <td className="px-6 py-3.5">
                         <div className="flex flex-col gap-0.5">
                            <span className={cn(
                               "text-sm font-medium",
                               isActive ? "text-primary" : "text-foreground/80"
                            )}>
                               {p.permission_name}
                            </span>
                         </div>
                      </td>
                      <td className="px-6 py-3.5 hidden sm:table-cell">
                         <span className={cn(
                           "text-[10px] px-2 py-0.5 rounded-lg border font-medium",
                           isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted/50 border-border/50 text-muted-foreground/60"
                         )}>
                           {p.slug}
                         </span>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        
        {Object.keys(grouped).length === 0 && (
          <div className="p-12 text-center">
             <p className="text-sm text-muted-foreground">
                No permissions found.
             </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-2">
         <p className="text-xs text-muted-foreground">
            Total Selected: <span className="font-bold text-primary">{selectedSlugs.length}</span>
         </p>
         <button 
            type="button"
            onClick={() => onChange(permissions.map(p => p.slug))}
            className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline transition-all"
         >
            Select All Permissions
         </button>
      </div>
    </div>
  );
}
