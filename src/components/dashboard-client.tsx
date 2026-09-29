"use client";

import { useCallback, useState } from "react";
import ActivityOverview from "@/components/activity-overview";
import CommitPatternInsights from "@/components/commit-pattern-insights";
import DailySummaryCard from "@/components/daily-summary-card";
import ProjectsMomentum from "@/components/projects-momentum";
import SyncButton from "@/components/sync-button";

export default function DashboardClient() {
  const [dashboardDataRefreshKey, setDashboardDataRefreshKey] = useState(0);

  const refreshDashboardData = useCallback(() => {
    setDashboardDataRefreshKey((currentKey) => currentKey + 1);
  }, []);

  return (
    <>
      <SyncButton onSyncComplete={refreshDashboardData} />
      <ActivityOverview refreshKey={dashboardDataRefreshKey} />
      <CommitPatternInsights refreshKey={dashboardDataRefreshKey} />
      <DailySummaryCard />
      <ProjectsMomentum refreshKey={dashboardDataRefreshKey} />
    </>
  );
}
