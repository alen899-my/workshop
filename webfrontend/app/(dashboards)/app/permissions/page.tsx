"use client";

import React, { useState, useEffect } from "react";
import { Permission, permissionService } from "@/services/permission.service";
import PermissionsClient from "./PermissionsClient";
import Loading from "../loading";

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
     return <Loading />;
  }

  return <PermissionsClient initialData={data} />;
}
