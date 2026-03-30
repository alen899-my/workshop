"use client";

import React, { useState, useEffect } from "react";
import { VehiclesClient } from "./VehiclesClient";
import { vehicleService } from "@/services/vehicle.service";
import { customerService } from "@/services/customer.service";
import Loading from "../loading";

/** Client-Side entry to support localStorage auth */
export default function VehiclesPage() {
  const [data, setData] = useState<{ vehicles: any[]; customers: any[] } | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const [vRes, cRes] = await Promise.all([
        vehicleService.getAll(),
        customerService.getAll()
      ]);
      setData({
        vehicles: vRes.success ? vRes.data : [],
        customers: cRes.success ? cRes.data : []
      });
    };
    fetch();
  }, []);

  if (!data) return <Loading />;

  return (
    <VehiclesClient 
      initialVehicles={data.vehicles} 
      initialCustomers={data.customers} 
    />
  );
}
