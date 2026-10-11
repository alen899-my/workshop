import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

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
  const revision = useRef(0);

  const init = useCallback(async () => {
    const current = ++revision.current;
    setLoading(true);
    setPermissions([]);
    const stored = await loadStoredUser();
    if (current !== revision.current) return;
    setUser(stored);

    const u = stored || getCurrentUser();
    if (!u?.role) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    // Fetch user-specific effective permissions which include role-based
    // plus any user-level overrides (additional ∖ excluded)
    if (u.userId) {
      const res = await permissionService.getUserPermissions(u.userId);
      if (current !== revision.current) return;
      if (res.success && res.data) {
        setPermissions(res.data.effective_permissions);
        setLoading(false);
        return;
      }
    }

    // Fallback: fetch role-based permissions only
    const res = await permissionService.getRolePermissions(u.role);
    if (current !== revision.current) return;
    if (res.success && res.data) {
      setPermissions(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const pendingRevision = revision;
    void Promise.resolve().then(init);
    return () => { pendingRevision.current++; };
  }, [init]);

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
