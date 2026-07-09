import React, { createContext, useContext, useEffect, useState } from 'react';

import { getCurrentUser, loadStoredUser } from '@/services/auth.service';
import { permissionService } from '@/services/permission.service';

interface User {
  userId?: number;
  shopId?: number;
  shopName?: string;
  ownerName?: string;
  role?: string;
}

interface RBACContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  can: (slug: string) => boolean;
  refresh: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(getCurrentUser());

  const init = async () => {
    setLoading(true);
    // Load persisted user from SecureStore
    const stored = await loadStoredUser();
    if (stored) {
      setUser(stored);
    }

    const u = stored || getCurrentUser();
    if (!u?.role) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    // Fetch permissions for this role
    const res = await permissionService.getRolePermissions(u.role);
    if (res.success && res.data) {
      setPermissions(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    init();
  }, []);

  const can = (slug: string): boolean => {
    return permissions.includes('*') || permissions.includes(slug);
  };

  return (
    <RBACContext.Provider value={{ user, permissions, loading, can, refresh: init }}>
      {children}
    </RBACContext.Provider>
  );
}

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};
