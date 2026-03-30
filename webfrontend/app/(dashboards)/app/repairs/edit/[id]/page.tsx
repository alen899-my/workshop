"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { repairService } from "@/services/repair.service";
import { userService } from "@/services/user.service";
import EditRepairClient from "./EditRepairClient";
import Loading from "../../../loading";

export default function EditRepairPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<{ repair: any; workers: any[] } | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const [uRes, rRes] = await Promise.all([
        userService.getAll(),
        repairService.getById(id)
      ]);
      if (rRes.success) {
        setData({ repair: rRes.data, workers: uRes.success ? uRes.data : [] });
      } else {
        // Fallback
        setData({ repair: null, workers: [] });
      }
    };
    fetch();
  }, [id]);

  if (!data) return <Loading />;
  if (!data.repair) return <div>Repair Not Found</div>;

  return (
    <EditRepairClient 
      id={id!} 
      initialRepair={data.repair} 
      workers={data.workers} 
    />
  );
}
