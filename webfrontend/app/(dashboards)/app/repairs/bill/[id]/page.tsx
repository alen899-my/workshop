"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { repairService } from "@/services/repair.service";
import { billService } from "@/services/bill.service";
import { useRBAC } from "@/lib/rbac";
import BillClient from "./BillClient";
import Loading from "../../../loading";

export default function RepairBillPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useRBAC();
  const [data, setData] = useState<{ repair: any; bill: any } | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const [rRes, bRes] = await Promise.all([
        repairService.getById(id),
        billService.getByRepairId(id)
      ]);
      if (rRes.success) {
        setData({ repair: rRes.data, bill: bRes.success ? bRes.data : null });
      } else {
        setData({ repair: null, bill: null });
      }
    };
    fetch();
  }, [id]);

  if (!data) return <Loading />;
  if (!data.repair) return <div>Repair Not Found</div>;

  return (
    <BillClient 
      id={id!} 
      initialRepair={data.repair} 
      initialBill={data.bill}
      currencyCode={user?.shopCurrency || 'INR'}
    />
  );
}
