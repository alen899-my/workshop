"use client";

import React, { useState, useEffect } from "react";
import { Permission, permissionService } from "@/services/permission.service";
import PermissionsClient from "./PermissionsClient";

/** Client-Side Authenticated Entry for Permission Management */
export default function PermissionsPage() {
  const [data, setData] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await permissionService.getAll();
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
     return <div className="p-8 font-mono text-[10px] opacity-40 uppercase tracking-widest">Synchronizing global permission registry...</div>;
  }

  return <PermissionsClient initialData={data} />;
}
