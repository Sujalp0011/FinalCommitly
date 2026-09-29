"use client";

import { useCallback, useState } from "react";
import DailySummaryCard from "@/components/daily-summary-card";
import ProjectsMomentum from "@/components/projects-momentum";
import SyncButton from "@/components/sync-button";

export default function DashboardClient() {
  const [momentumRefreshKey, setMomentumRefreshKey] = useState(0);

  const refreshProjectMomentum = useCallback(() => {
    setMomentumRefreshKey((currentKey) => currentKey + 1);
  }, []);

  return (
    <>
      <SyncButton onSyncComplete={refreshProjectMomentum} />
      <DailySummaryCard />
      <ProjectsMomentum refreshKey={momentumRefreshKey} />
    </>
  );
}
