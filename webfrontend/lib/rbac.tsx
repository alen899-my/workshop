"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { permissionService } from "@/services/permission.service";

interface User {
  id?: number | string;
  name?: string;
  phone?: string;
  role?: string;
  shopId?: number | string;
  shop_id?: number | string;
  shopName?: string;
  ownerName?: string;
  shopRole?: string;
  shopCurrency?: string;
}

interface RBACContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  can: (slug: string) => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

/**
 * RBAC Provider: Manages authorized permission slugs for the logged-in user Role
 */
export function RBACProvider({ user, children }: { user: User | null; children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerms = async () => {
      if (!user?.role) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await permissionService.getRolePermissions(user.role);
      if (res.success && res.data) {
        setPermissions(res.data);
      }
      setLoading(false);
    };

    fetchPerms();
  }, [user?.role]);

  const can = (slug: string): boolean => {
    // 1. Database Mapping check
    return permissions.includes("*") || permissions.includes(slug);
  };

  return (
    <RBACContext.Provider value={{ user, permissions, loading, can }}>
      {children}
    </RBACContext.Provider>
  );
}

/** Hook to check access within components */
export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
};
