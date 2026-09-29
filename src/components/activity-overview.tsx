"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

interface ActivityDay {
  date: string;
  count: number;
}

interface ActivityData {
  periodDays: number;
  timeZone: string;
  totalCommits: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  days: ActivityDay[];
}

interface ActivityOverviewProps {
  refreshKey: number;
}

const ACTIVITY_COLORS = ["#161B22", "#17365F", "#1F5AA6", "#2F81F7", "#79C0FF"];

function getActivityLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function formatActivityDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function commitLabel(count: number): string {
  return `${count} ${count === 1 ? "commit" : "commits"}`;
}

export default function ActivityOverview({ refreshKey }: ActivityOverviewProps) {
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchActivity = async () => {
      setLoading(true);
      setError(null);

      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const query = new URLSearchParams({ timeZone });
        const response = await fetch(`/api/analytics/activity?${query}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Activity request failed with status ${response.status}`);
        }

        setActivity(await response.json());
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") return;
        console.error("Failed to fetch developer activity:", fetchError);
        setError("Developer activity could not be loaded. Try again after your next sync.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchActivity();
    return () => controller.abort();
  }, [refreshKey]);

  if (loading) {
    return (
      <section style={{ marginBottom: "28px" }} aria-label="Loading developer activity">
        <div style={{ height: "20px", width: "170px", background: "#161B22", borderRadius: "4px", marginBottom: "16px" }} />
        <div style={{ height: "176px", background: "#161B22", border: "1px solid #21262D", borderRadius: "10px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.8; } }`}</style>
      </section>
    );
  }

  if (error || !activity) {
    return (
      <section style={{ marginBottom: "28px" }} aria-labelledby="developer-activity-title">
        <h2 id="developer-activity-title" style={{ fontSize: "1rem", fontWeight: 600, color: "#aaa", margin: "0 0 12px" }}>
          Developer Activity
        </h2>
        <div role="alert" style={{ border: "1px solid #5c2020", borderRadius: "10px", padding: "18px", color: "#f87171", background: "#2d1111" }}>
          {error ?? "Developer activity could not be loaded."}
        </div>
      </section>
    );
  }

  const metrics = [
    { label: "Commits", value: activity.totalCommits },
    { label: "Active Days", value: activity.activeDays },
    { label: "Current Streak", value: activity.currentStreak },
    { label: "Longest Streak", value: activity.longestStreak },
  ];

  return (
    <section style={{ marginBottom: "28px" }} aria-labelledby="developer-activity-title">
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <CalendarDays size={18} color="#58A6FF" aria-hidden="true" />
        <h2 id="developer-activity-title" style={{ fontSize: "1rem", fontWeight: 600, color: "#aaa", margin: 0 }}>
          Developer Activity
        </h2>
      </div>

      <div style={{ border: "1px solid #30363D", borderRadius: "10px", background: "#0D1117", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", borderBottom: "1px solid #30363D" }}>
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              style={{
                padding: "16px",
                borderRight: index < metrics.length - 1 ? "1px solid #21262D" : "none",
              }}
            >
              <div style={{ fontSize: "1.4rem", lineHeight: 1.1, fontWeight: 700, color: "#E6EDF3" }}>
                {metric.value}
              </div>
              <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#8B949E" }}>
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "18px 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#C9D1D9" }}>
              Last 30 Days
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#6E7681" }}>
              {activity.activeDays} active {activity.activeDays === 1 ? "day" : "days"}
            </span>
          </div>

          <div
            role="list"
            aria-label={`Commit activity for the last ${activity.periodDays} days`}
            style={{ display: "grid", gridTemplateColumns: "repeat(10, minmax(16px, 1fr))", gap: "6px" }}
          >
            {activity.days.map((day) => {
              const label = `${formatActivityDate(day.date)}: ${commitLabel(day.count)}`;
              return (
                <span
                  key={day.date}
                  role="listitem"
                  title={label}
                  aria-label={label}
                  style={{
                    aspectRatio: "1",
                    minWidth: 0,
                    borderRadius: "3px",
                    background: ACTIVITY_COLORS[getActivityLevel(day.count)],
                    border: day.count === 0 ? "1px solid #30363D" : "1px solid transparent",
                  }}
                />
              );
            })}
          </div>

          {activity.totalCommits === 0 ? (
            <p style={{ margin: "14px 0 0", fontSize: "0.8rem", color: "#8B949E" }}>
              No commits found in the last 30 days. Sync your repositories to load recent activity.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
