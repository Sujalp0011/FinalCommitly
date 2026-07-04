"use client";

import { useState, useEffect } from "react";
import { FolderGit2 } from "lucide-react";

interface RepoProgress {
  id: string;
  name: string;
  fullName: string;
  url: string;
  language: string | null;
  progress: number;
  lastCommitDate: string | null;
  totalCommits: number;
  lastSyncedAt: string | null;
}

function getProgressColor(score: number): string {
  if (score > 70) return "#4ade80";
  if (score >= 40) return "#fbbf24";
  return "#f87171";
}

function getProgressBg(score: number): string {
  if (score > 70) return "#052e16";
  if (score >= 40) return "#422006";
  return "#450a0a";
}

function plural(count: number, singular: string, pluralForm?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${pluralForm ?? singular + "s"}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ProjectsProgress() {
  const [repos, setRepos] = useState<RepoProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch("/api/repos/progress");
        if (res.ok) {
          const data = await res.json();
          setRepos(data.repos);
        }
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <FolderGit2 size={18} color="#888" />
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: "#aaa" }}>
            Projects
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                border: "1px solid #1a1a1a",
                borderRadius: "8px",
                padding: "16px",
                height: "70px",
                background: "#0a0a0a",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <FolderGit2 size={18} color="#888" />
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: "#aaa" }}>
            Projects
          </h2>
        </div>
        <div
          style={{
            border: "1px solid #222",
            borderRadius: "8px",
            padding: "24px",
            textAlign: "center",
            color: "#666",
          }}
        >
          <p style={{ margin: 0 }}>No repos synced yet. Hit <strong style={{ color: "#888" }}>Sync Now</strong> above to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <FolderGit2 size={18} color="#888" />
        <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: "#aaa" }}>
          Projects ({repos.length})
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {repos.map((repo) => {
          const hasCommits = repo.totalCommits > 0;
          const color = getProgressColor(repo.progress);
          const bgColor = getProgressBg(repo.progress);

          return (
            <div
              key={repo.id}
              style={{
                border: "1px solid #222",
                borderRadius: "8px",
                padding: "14px 16px",
              }}
            >
              {/* Header: name + language badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: hasCommits ? "10px" : "0",
                }}
              >
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontWeight: 600,
                    color: "#58a6ff",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                  }}
                >
                  {repo.fullName}
                </a>
                {repo.language && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      border: "1px solid #333",
                      borderRadius: "12px",
                      padding: "2px 10px",
                      color: "#777",
                    }}
                  >
                    {repo.language}
                  </span>
                )}
              </div>

              {/* If no commits: show message instead of progress bar */}
              {!hasCommits && (
                <p style={{ color: "#555", fontSize: "0.8rem", margin: "8px 0 0 0" }}>
                  No commits synced yet — hit Sync Now to load activity
                </p>
              )}

              {/* Progress bar — only shown when commits exist */}
              {hasCommits && (
                <>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "#1a1a1a",
                      borderRadius: "3px",
                      overflow: "hidden",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: `${repo.progress}%`,
                        height: "100%",
                        background: color,
                        borderRadius: "3px",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>

                  {/* Meta row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      fontSize: "0.75rem",
                      color: "#666",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color,
                        background: bgColor,
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {repo.progress}%
                    </span>
                    <span>{plural(repo.totalCommits, "commit")}</span>
                    {repo.lastCommitDate && (
                      <span>Active {timeAgo(repo.lastCommitDate)}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
