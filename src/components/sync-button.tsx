"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface SyncStatus {
  repos: number;
  commits: number;
  lastSyncedAt: string | null;
}

interface SyncResult {
  success?: boolean;
  error?: string;
  reposSynced?: number;
  commitsSaved?: number;
  partial?: boolean;
}

function plural(count: number, singular: string, pluralForm?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${pluralForm ?? singular + "s"}`;
}

interface SyncButtonProps {
  onSyncComplete: () => void;
}

export default function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/sync/status");
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const res = await fetch("/api/sync/repos", { method: "POST" });
      const data: SyncResult = await res.json();

      if (res.status === 429) {
        setResult({ error: data.error, partial: true, reposSynced: data.reposSynced, commitsSaved: data.commitsSaved });
        if (data.partial) {
          onSyncComplete();
        }
      } else if (!res.ok) {
        setResult({ error: data.error ?? "Sync failed" });
      } else {
        setResult(data);
        onSyncComplete();
      }

      await fetchStatus();
    } catch (err) {
      setResult({ error: "Network error — could not reach the server" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
        <button
          id="sync-now-button"
          onClick={handleSync}
          disabled={syncing}
          style={{
            padding: "10px 24px",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: syncing ? "not-allowed" : "pointer",
            border: "1px solid #333",
            borderRadius: "8px",
            background: syncing ? "#222" : "#fff",
            color: syncing ? "#888" : "#000",
            opacity: syncing ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {syncing ? (
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <RefreshCw size={14} />
          )}
          {syncing ? "Syncing..." : "Sync Now"}
        </button>

        {status && (
          <span style={{ fontSize: "0.8rem", color: "#888" }}>
            {plural(status.repos, "repo")} · {plural(status.commits, "commit")} synced
            {status.lastSyncedAt && (
              <> · Last sync: {new Date(status.lastSyncedAt).toLocaleString()}</>
            )}
          </span>
        )}
      </div>

      {result && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "0.875rem",
            background: result.error ? "#2d1111" : "#112d11",
            border: result.error ? "1px solid #5c2020" : "1px solid #205c20",
            color: result.error ? "#f87171" : "#4ade80",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          {result.error ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={14} />
                <span>{result.error}</span>
              </div>
              {result.partial && (
                <span style={{ display: "block", marginTop: "4px", color: "#fbbf24" }}>
                  Partial sync: {plural(result.reposSynced ?? 0, "repo")}, {plural(result.commitsSaved ?? 0, "commit")} saved before the error.
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={14} />
              <span>Synced {plural(result.reposSynced ?? 0, "repo")} — {plural(result.commitsSaved ?? 0, "new commit")} saved</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
