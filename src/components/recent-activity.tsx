"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ExternalLink } from "lucide-react";
import {
  COMMIT_CATEGORIES,
  COMMIT_CATEGORY_LABELS,
  type CommitCategory,
} from "@/lib/commit-analysis";

interface RecentCommit {
  id: string;
  sha: string;
  message: string;
  committedAt: string | null;
  additions: number;
  deletions: number;
  url: string | null;
  category: CommitCategory;
  repo: {
    id: string;
    name: string;
    fullName: string;
    language: string | null;
  };
}

interface RecentActivityProps {
  refreshKey: number;
}

type CategoryFilter = "all" | CommitCategory;

const INITIAL_VISIBLE_COUNT = 8;

const CATEGORY_COLORS: Record<CommitCategory, string> = {
  feature: "#58A6FF",
  fix: "#F87171",
  refactor: "#C084FC",
  test: "#4ADE80",
  docs: "#FBBF24",
  chore: "#8B949E",
  other: "#6E7681",
};

const FILTERS: Array<{ value: CategoryFilter; label: string }> = [
  { value: "all", label: "All" },
  ...COMMIT_CATEGORIES.map((category) => ({
    value: category,
    label: COMMIT_CATEGORY_LABELS[category],
  })),
];

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatLocalDateTime(value: string | null): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (localDateKey(date) === localDateKey(now)) return `Today, ${time}`;
  if (localDateKey(date) === localDateKey(yesterday)) {
    return `Yesterday, ${time}`;
  }

  return `${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}, ${time}`;
}

export default function RecentActivity({ refreshKey }: RecentActivityProps) {
  const [commits, setCommits] = useState<RecentCommit[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRecentActivity = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/activity/recent", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Recent activity request failed with status ${response.status}`
          );
        }

        const data: { commits: RecentCommit[] } = await response.json();
        setCommits(data.commits);
        setShowAll(false);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch recent activity:", fetchError);
        setError("Recent activity could not be loaded. Try again after your next sync.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchRecentActivity();
    return () => controller.abort();
  }, [refreshKey]);

  const filteredCommits =
    activeCategory === "all"
      ? commits
      : commits.filter((commit) => commit.category === activeCategory);
  const visibleCommits = showAll
    ? filteredCommits
    : filteredCommits.slice(0, INITIAL_VISIBLE_COUNT);

  if (loading) {
    return (
      <section style={{ marginBottom: "28px" }} aria-label="Loading recent activity">
        <div style={{ height: "20px", width: "140px", background: "#161B22", borderRadius: "4px", marginBottom: "16px" }} />
        <div style={{ height: "330px", background: "#161B22", border: "1px solid #21262D", borderRadius: "10px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.8; } }`}</style>
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ marginBottom: "28px" }} aria-labelledby="recent-activity-title">
        <h2 id="recent-activity-title" style={{ fontSize: "1rem", fontWeight: 600, color: "#aaa", margin: "0 0 12px" }}>
          Recent Activity
        </h2>
        <div role="alert" style={{ border: "1px solid #5c2020", borderRadius: "10px", padding: "18px", color: "#f87171", background: "#2d1111" }}>
          {error}
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: "28px" }} aria-labelledby="recent-activity-title">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px", marginBottom: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <Activity size={18} color="#58A6FF" aria-hidden="true" />
            <h2 id="recent-activity-title" style={{ fontSize: "1rem", fontWeight: 600, color: "#aaa", margin: 0 }}>
              Recent Activity
            </h2>
          </div>
          <p style={{ margin: "5px 0 0 27px", color: "#6E7681", fontSize: "0.78rem" }}>
            Latest commits across your synced projects.
          </p>
        </div>
        <span style={{ color: "#6E7681", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
          {commits.length} {commits.length === 1 ? "commit" : "commits"}
        </span>
      </div>

      {commits.length === 0 ? (
        <div style={{ padding: "24px", border: "1px solid #21262D", borderRadius: "10px", color: "#8B949E", textAlign: "center", fontSize: "0.85rem" }}>
          No stored commits yet. Sync your repositories to build a recent activity feed.
        </div>
      ) : (
        <>
          <div aria-label="Filter recent activity by category" style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
            {FILTERS.map((filter) => {
              const selected = activeCategory === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setActiveCategory(filter.value);
                    setShowAll(false);
                  }}
                  style={{
                    padding: "5px 9px",
                    border: selected ? "1px solid #58A6FF" : "1px solid #30363D",
                    borderRadius: "6px",
                    background: selected ? "#17365F" : "transparent",
                    color: selected ? "#C9D1D9" : "#8B949E",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {filteredCommits.length === 0 ? (
            <div style={{ padding: "22px", border: "1px solid #21262D", borderRadius: "10px", color: "#8B949E", textAlign: "center", fontSize: "0.82rem" }}>
              No recent commits match this category.
            </div>
          ) : (
            <div style={{ border: "1px solid #30363D", borderRadius: "10px", overflow: "hidden" }}>
              {visibleCommits.map((commit, index) => {
                const hasRecordedStats =
                  commit.additions > 0 || commit.deletions > 0;

                return (
                  <article key={commit.id} style={{ padding: "12px 14px", borderBottom: index < visibleCommits.length - 1 ? "1px solid #21262D" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flexWrap: "wrap" }}>
                        <Link href={`/projects/${commit.repo.id}`} style={{ color: "#58A6FF", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", overflowWrap: "anywhere" }}>
                          {commit.repo.fullName}
                        </Link>
                        {commit.repo.language ? (
                          <span style={{ color: "#6E7681", fontSize: "0.68rem" }}>
                            {commit.repo.language}
                          </span>
                        ) : null}
                      </div>
                      <span style={{ flexShrink: 0, padding: "2px 7px", border: `1px solid ${CATEGORY_COLORS[commit.category]}55`, borderRadius: "999px", color: CATEGORY_COLORS[commit.category], fontSize: "0.66rem" }}>
                        {COMMIT_CATEGORY_LABELS[commit.category]}
                      </span>
                    </div>

                    <p style={{ margin: 0, color: "#C9D1D9", fontSize: "0.82rem", lineHeight: 1.4, overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>
                      {commit.message}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "7px", color: "#6E7681", fontSize: "0.7rem" }}>
                      {commit.url ? (
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open commit ${commit.sha.slice(0, 7)} on GitHub in a new tab`}
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#8B949E", fontFamily: "'JetBrains Mono', monospace", textDecoration: "none" }}
                        >
                          {commit.sha.slice(0, 7)}
                          <ExternalLink size={10} aria-hidden="true" />
                        </a>
                      ) : (
                        <span style={{ color: "#8B949E", fontFamily: "'JetBrains Mono', monospace" }}>
                          {commit.sha.slice(0, 7)}
                        </span>
                      )}
                      <span>{formatLocalDateTime(commit.committedAt)}</span>
                      {hasRecordedStats ? (
                        <span aria-label={`${commit.additions} additions and ${commit.deletions} deletions recorded`}>
                          <span style={{ color: "#4ADE80" }}>+{commit.additions}</span>{" "}
                          <span style={{ color: "#F87171" }}>-{commit.deletions}</span>
                        </span>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {filteredCommits.length > INITIAL_VISIBLE_COUNT ? (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              style={{ display: "block", margin: "10px auto 0", padding: "6px 12px", border: "1px solid #30363D", borderRadius: "6px", background: "transparent", color: "#8B949E", fontSize: "0.75rem", cursor: "pointer" }}
            >
              {showAll
                ? "Show less"
                : `Show ${filteredCommits.length - INITIAL_VISIBLE_COUNT} more`}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
