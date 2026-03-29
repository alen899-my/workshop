import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { permissionService } from '../services/management.service';

const RBACContext = createContext(undefined);

export function RBACProvider({ children }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        if (!user.role) {
          setPermissions([]);
          return;
        }

        const res = await permissionService.getRolePermissions(user.role);
        if (res.success && res.data) {
          setPermissions(res.data);
        }
      } catch (e) {
        console.error('Failed to init RBAC', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const isSuperAdmin = user?.role === 'super-admin';

  const can = (slug) => {
    if (isSuperAdmin) return true;
    return permissions.includes("*") || permissions.includes(slug);
  };

  return (
    <RBACContext.Provider value={{ user, permissions, loading, can, isSuperAdmin }}>
      {children}
    </RBACContext.Provider>
  );
}

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
};
