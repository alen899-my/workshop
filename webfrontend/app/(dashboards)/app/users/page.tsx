"use client";

import React, { useState, useEffect, use } from "react";
import { User, userService } from "@/services/user.service";
import UsersClient from "./UsersClient";
import Loading from "../loading";

/** Client-Side Authenticated Entry for Team Management */
export default function UsersPage({ searchParams }: { searchParams: Promise<{ shopId?: string }> }) {
  // Use the 'use' hook to unwrap the searchParams promise safely for the client
  const params = use(searchParams);
  const shopId = params.shopId ? parseInt(params.shopId) : undefined;

  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await userService.getAll(undefined, shopId);
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    };
    fetchData();
  }, [shopId]);

  if (loading) {
     return <Loading />;
  }

  return <UsersClient initialData={data} shopId={shopId} />;
}
