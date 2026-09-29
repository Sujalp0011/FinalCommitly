"use client";

import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import {
  COMMIT_CATEGORY_LABELS,
  type CommitCategory,
} from "@/lib/commit-analysis";

interface CategoryResult {
  category: CommitCategory;
  count: number;
  percentage: number;
}

interface PatternData {
  periodDays: number;
  totalCommits: number;
  categories: CategoryResult[];
  dominantCategory: CommitCategory | null;
}

interface CommitPatternInsightsProps {
  refreshKey: number;
}

const OBSERVATIONS: Record<CommitCategory, string> = {
  feature: "Most of your recent commits are feature-focused.",
  fix: "Bug-fix commits make up the largest share of your recent activity.",
  refactor: "Refactoring is the most common pattern in your recent commits.",
  test: "Test-related work is the most common pattern in your recent commits.",
  docs: "Documentation is the most common pattern in your recent commits.",
  chore: "Maintenance work is the most common pattern in your recent commits.",
  other: "Most recent commits do not use a recognized category prefix.",
};

export default function CommitPatternInsights({
  refreshKey,
}: CommitPatternInsightsProps) {
  const [patterns, setPatterns] = useState<PatternData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPatterns = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/analytics/patterns", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Pattern request failed with status ${response.status}`);
        }

        setPatterns(await response.json());
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") return;
        console.error("Failed to fetch commit pattern insights:", fetchError);
        setError("Commit patterns could not be loaded. Try again after your next sync.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchPatterns();
    return () => controller.abort();
  }, [refreshKey]);

  if (loading) {
    return (
      <section style={{ marginBottom: "28px" }} aria-label="Loading commit pattern insights">
        <div style={{ height: "20px", width: "190px", background: "#161B22", borderRadius: "4px", marginBottom: "16px" }} />
        <div style={{ height: "250px", background: "#161B22", border: "1px solid #21262D", borderRadius: "10px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.8; } }`}</style>
      </section>
    );
  }

  if (error || !patterns) {
    return (
      <section style={{ marginBottom: "28px" }} aria-labelledby="commit-pattern-title">
        <h2 id="commit-pattern-title" style={{ fontSize: "1rem", fontWeight: 600, color: "#aaa", margin: "0 0 12px" }}>
          Commit Pattern Insights
        </h2>
        <div role="alert" style={{ border: "1px solid #5c2020", borderRadius: "10px", padding: "18px", color: "#f87171", background: "#2d1111" }}>
          {error ?? "Commit patterns could not be loaded."}
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: "28px" }} aria-labelledby="commit-pattern-title">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <MessageSquareText size={18} color="#58A6FF" aria-hidden="true" />
          <h2 id="commit-pattern-title" style={{ fontSize: "1rem", fontWeight: 600, color: "#aaa", margin: 0 }}>
            Commit Pattern Insights
          </h2>
        </div>
        <span style={{ fontSize: "0.75rem", color: "#6E7681", whiteSpace: "nowrap" }}>
          Last {patterns.periodDays} Days
        </span>
      </div>

      <div style={{ border: "1px solid #30363D", borderRadius: "10px", background: "#0D1117", padding: "16px" }}>
        {patterns.totalCommits === 0 ? (
          <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6, color: "#8B949E" }}>
            No commits found in the last 30 days. Sync your repositories to analyze recent commit patterns.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {patterns.categories.map((result) => (
                <div key={result.category} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "110px", flexShrink: 0, fontSize: "0.8rem", color: "#C9D1D9" }}>
                    {COMMIT_CATEGORY_LABELS[result.category]}
                  </span>
                  <div
                    role="progressbar"
                    aria-label={`${COMMIT_CATEGORY_LABELS[result.category]}: ${result.count} commits, ${result.percentage}%`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={result.percentage}
                    style={{ flex: 1, minWidth: "40px", height: "7px", overflow: "hidden", borderRadius: "4px", background: "#161B22" }}
                  >
                    <div
                      style={{
                        width: `${result.percentage}%`,
                        height: "100%",
                        borderRadius: "4px",
                        background: result.category === patterns.dominantCategory ? "#58A6FF" : "#1F5AA6",
                      }}
                    />
                  </div>
                  <span style={{ width: "28px", textAlign: "right", fontSize: "0.78rem", color: "#8B949E" }}>
                    {result.count}
                  </span>
                  <span style={{ width: "38px", textAlign: "right", fontSize: "0.78rem", color: "#6E7681" }}>
                    {result.percentage}%
                  </span>
                </div>
              ))}
            </div>

            {patterns.dominantCategory ? (
              <p style={{ margin: "16px 0 0", paddingTop: "14px", borderTop: "1px solid #21262D", fontSize: "0.82rem", lineHeight: 1.5, color: "#8B949E" }}>
                {OBSERVATIONS[patterns.dominantCategory]}
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
