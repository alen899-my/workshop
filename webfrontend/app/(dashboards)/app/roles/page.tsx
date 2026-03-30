"use client";

import React, { useState, useEffect } from "react";
import { Role, roleService } from "@/services/role.service";
import RolesClient from "./RolesClient";
import Loading from "../loading";

/** Client-Side Authenticated Entry for Role Management */
export default function RolesPage() {
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await roleService.getAll();
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

  return <RolesClient initialData={data} />;
}
