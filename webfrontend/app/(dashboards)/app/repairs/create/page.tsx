"use client";

import React, { useState, useEffect } from "react";
import { userService } from "@/services/user.service";
import CreateRepairClient from "./CreateRepairClient";
import Loading from "../../loading";

export default function CreateRepairPage() {
  const [workers, setWorkers] = useState<any[] | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const res = await userService.getAll();
      setWorkers(res.success ? res.data : []);
    };
    fetch();
  }, []);

  if (workers === null) return <Loading />;

  return <CreateRepairClient workers={workers} />;
}
