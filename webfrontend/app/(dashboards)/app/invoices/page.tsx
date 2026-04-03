"use client";

import React, { useState, useEffect } from "react";
import { billService, Bill } from "@/services/bill.service";
import { useRouter } from "next/navigation";
import { useRBAC } from "@/lib/rbac";
import InvoicesClient from "./InvoicesClient";
import Loading from "../loading";

export default function InvoicesPage() {
  const router = useRouter();
  const { user, can, loading } = useRBAC();
  const [initialData, setInitialData] = useState<Bill[] | null>(null);

  useEffect(() => {
    if (!loading && !can("view:invoices")) {
      router.replace("/app/forbidden");
      return;
    }

    const fetchData = async () => {
      const res = await billService.getAll();
      setInitialData(res.success && res.data ? res.data : []);
    };
    
    if (!loading && can("view:invoices")) {
      fetchData();
    }
  }, [loading, can, router]);

  if (loading || initialData === null) return <Loading />;

  return <InvoicesClient initialData={initialData} currencyCode={user?.shopCurrency || 'INR'} />;
}
