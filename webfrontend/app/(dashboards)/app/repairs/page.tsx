"use client";

import React, { useState, useEffect, use } from "react";
import { Repair, repairService } from "@/services/repair.service";
import RepairsClient from "./RepairsClient";

/** Client-Side Authenticated Entry for Repairs Management */
export default function RepairsPage({ searchParams }: { searchParams: Promise<{}> }) {
  const [data, setData] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await repairService.getAll();
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
     return <div className="p-8 font-mono text-[10px] opacity-40 uppercase tracking-widest">Loading repairs...</div>;
  }

  return <RepairsClient initialData={data} />;
}
