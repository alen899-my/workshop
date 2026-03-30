"use client";

import React, { useState, useEffect } from "react";
import { CustomersClient } from "./CustomersClient";
import { customerService } from "@/services/customer.service";
import Loading from "../loading";

/** Client-Side entry to support localStorage auth */
export default function CustomersPage() {
  const [initialData, setInitialData] = useState<any[] | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const res = await customerService.getAll();
      setInitialData(res.success ? res.data : []);
    };
    fetch();
  }, []);

  if (initialData === null) return <Loading />;

  return <CustomersClient initialData={initialData} />;
}
