"use client";

import React, { useState, useEffect, use } from "react";
import { User, userService } from "@/services/user.service";
import UsersClient from "./UsersClient";

/** Client-Side Authenticated Entry for Team Management */
export default function UsersPage({ searchParams }: { searchParams: Promise<{ shopId?: string }> }) {
  // Use the 'use' hook to unwrap the searchParams promise safely for the client
  const params = use(searchParams);
  const shopId = params.shopId ? parseInt(params.shopId) : undefined;

  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await userService.getAll(shopId);
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    };
    fetchData();
  }, [shopId]);

  if (loading) {
     return <div className="p-8 font-mono text-[10px] opacity-40 uppercase tracking-widest">Synchronizing team identities...</div>;
  }

  return <UsersClient initialData={data} shopId={shopId} />;
}
