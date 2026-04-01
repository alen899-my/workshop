"use client";

import React, { useEffect, useState } from "react";
import { taxService, TaxSetting } from "@/services/tax.service";
import TaxSettingsClient from "./TaxSettingsClient";
import Loading from "../../loading";

export default function TaxSettingsPage() {
  const [data, setData] = useState<TaxSetting[] | null>(null);

  useEffect(() => {
    taxService.getAll().then(res => setData(res.success ? res.data : []));
  }, []);

  if (data === null) return <Loading />;
  return <TaxSettingsClient initialData={data} />;
}
