"use client";

import { useEffect, useState } from "react";
import { ListChecks } from "lucide-react";

interface TrackedRepo {
  id: string;
  name: string;
  fullName: string;
  language: string | null;
  isTracked: boolean;
  lastSyncedAt: string | null;
}

interface RepoTrackingManagerProps {
  refreshKey: number;
  onTrackingChange: () => void;
}

export default function RepoTrackingManager({
  refreshKey,
  onTrackingChange,
}: RepoTrackingManagerProps) {
  const [repos, setRepos] = useState<TrackedRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRepoId, setUpdatingRepoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRepos() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/repos/tracking", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Tracking request failed with status ${response.status}`);
        }

        const data = (await response.json()) as { repos: TrackedRepo[] };
        setRepos(data.repos);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") return;
        console.error("Failed to load tracked projects:", fetchError);
        setError("Tracked projects could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchRepos();
    return () => controller.abort();
  }, [refreshKey]);

  async function updateTracking(repoId: string, isTracked: boolean) {
    setUpdatingRepoId(repoId);
    setError(null);

    try {
      const response = await fetch("/api/repos/tracking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId, isTracked }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Tracking preference could not be updated");
      }

      setRepos((currentRepos) =>
        currentRepos.map((repo) =>
          repo.id === repoId ? { ...repo, isTracked } : repo
        )
      );
      onTrackingChange();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Tracking preference could not be updated"
      );
    } finally {
      setUpdatingRepoId(null);
    }
  }

  const trackedCount = repos.reduce(
    (count, repo) => count + (repo.isTracked ? 1 : 0),
    0
  );

  return (
    <section
      aria-labelledby="tracked-projects-title"
      style={{
        marginBottom: "28px",
        border: "1px solid #30363D",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#0D1117",
      }}
    >
      <div style={{ padding: "15px 16px", borderBottom: "1px solid #21262D" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <ListChecks size={18} color="#58A6FF" aria-hidden="true" />
          <h2
            id="tracked-projects-title"
            style={{ margin: 0, color: "#C9D1D9", fontSize: "1rem", fontWeight: 600 }}
          >
            Manage Tracked Projects
          </h2>
        </div>
        <p style={{ margin: "6px 0 0 27px", color: "#6E7681", fontSize: "0.78rem", lineHeight: 1.45 }}>
          Include selected repositories in active monitoring and dashboard analytics.
        </p>
      </div>

      {loading ? (
        <p aria-live="polite" style={{ margin: 0, padding: "18px 16px", color: "#8B949E", fontSize: "0.82rem" }}>
          Loading stored repositories...
        </p>
      ) : repos.length === 0 ? (
        <p style={{ margin: 0, padding: "18px 16px", color: "#8B949E", fontSize: "0.82rem", lineHeight: 1.5 }}>
          Sync your GitHub repositories first to choose which projects to track.
        </p>
      ) : (
        <div>
          {repos.map((repo, index) => {
            const updating = updatingRepoId === repo.id;

            return (
              <label
                key={repo.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 16px",
                  borderBottom: index < repos.length - 1 ? "1px solid #21262D" : "none",
                  cursor: updating ? "wait" : "pointer",
                  opacity: updating ? 0.65 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={repo.isTracked}
                  disabled={updatingRepoId !== null}
                  onChange={(event) => updateTracking(repo.id, event.target.checked)}
                  aria-label={`Track ${repo.fullName}`}
                  style={{ width: "16px", height: "16px", margin: 0, accentColor: "#1F6FEB", cursor: updatingRepoId !== null ? "wait" : "pointer" }}
                />
                <span style={{ flex: 1, minWidth: 0, color: "#C9D1D9", fontSize: "0.82rem", overflowWrap: "anywhere" }}>
                  {repo.fullName}
                </span>
                {repo.language ? (
                  <span style={{ flexShrink: 0, color: "#6E7681", fontSize: "0.72rem" }}>
                    {repo.language}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      )}

      {!loading && repos.length > 0 ? (
        <div style={{ padding: "10px 16px", borderTop: "1px solid #21262D", color: "#8B949E", fontSize: "0.75rem" }}>
          {trackedCount} of {repos.length} projects tracked
        </div>
      ) : null}

      {error ? (
        <p role="alert" style={{ margin: 0, padding: "10px 16px", borderTop: "1px solid #5C2020", color: "#F87171", fontSize: "0.78rem" }}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
