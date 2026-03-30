"use client";

import React, { useState, useEffect } from "react";
import { repairService, Repair } from "@/services/repair.service";
import RepairsClient from "./RepairsClient";
import Loading from "../loading";

/** Client-Side entry to support localStorage auth */
export default function RepairsPage() {
  const [initialData, setInitialData] = useState<Repair[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await repairService.getAll();
      setInitialData(res.success ? res.data : []);
    };
    fetchData();
  }, []);

  if (initialData === null) return <Loading />;

  return <RepairsClient initialData={initialData} />;
}
