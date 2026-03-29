"use client";

import React, { useState, useEffect } from "react";
import { Shop, shopService } from "@/services/shop.service";
import ShopsClient from "./ShopsClient";

/** Client-Side Authenticated Entry for Global Shop Registry */
export default function ShopsPage() {
  const [data, setData] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await shopService.getAll();
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 font-mono text-[10px] opacity-40 uppercase tracking-widest">Synchronizing global shop registry...</div>;
  }

  return <ShopsClient initialData={data} />;
}
