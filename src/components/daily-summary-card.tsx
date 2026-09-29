"use client";

import { useState, useEffect } from "react";
import { FileText, RefreshCw, Loader2, Inbox } from "lucide-react";

interface Summary {
  id: string;
  date: string;
  summaryText: string;
  updatedAt: string;
}

export default function DailySummaryCard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [noCommits, setNoCommits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToday = async () => {
    try {
      const res = await fetch("/api/summary/today");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setNoCommits(false);

    try {
      const res = await fetch("/api/summary/generate", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to generate summary");
        return;
      }

      if (!data.summary) {
        setNoCommits(true);
        setSummary(null);
        return;
      }

      setSummary(data.summary);
    } catch (err) {
      setError("Network error — could not reach the server");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #2a2a3a",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "28px",
        background: "linear-gradient(135deg, #0f0f1a 0%, #141420 100%)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileText size={18} color="#818cf8" />
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
            Daily Summary
          </h2>
        </div>
        <button
          id="regenerate-summary-button"
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: "6px 14px",
            fontSize: "0.8rem",
            fontWeight: 500,
            cursor: generating ? "not-allowed" : "pointer",
            border: "1px solid #333",
            borderRadius: "6px",
            background: "transparent",
            color: generating ? "#555" : "#aaa",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {generating ? (
            <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <RefreshCw size={12} />
          )}
          {generating ? "Generating..." : "Regenerate"}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: "14px",
                background: "#1a1a2e",
                borderRadius: "4px",
                width: i === 3 ? "60%" : "100%",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      )}

      {/* Generating skeleton */}
      {!loading && generating && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: "14px",
                background: "#1a1a2e",
                borderRadius: "4px",
                width: i === 3 ? "60%" : "100%",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
          <p style={{ color: "#666", fontSize: "0.8rem", marginTop: "4px" }}>
            Analyzing your commits with AI...
          </p>
        </div>
      )}

      {/* Summary content */}
      {!loading && !generating && summary && (
        <div>
          <p style={{ lineHeight: 1.8, color: "#ddd", fontSize: "0.9rem", margin: 0 }}>
            {summary.summaryText}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#444", marginTop: "14px" }}>
            Generated {new Date(summary.updatedAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* No summary yet */}
      {!loading && !generating && !summary && !noCommits && !error && (
        <p style={{ color: "#666", fontSize: "0.875rem", margin: 0 }}>
          No summary yet for today. Click <strong style={{ color: "#888" }}>Regenerate</strong> to generate one from your recent commits.
        </p>
      )}

      {/* No commits message */}
      {!loading && !generating && noCommits && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#666" }}>
          <Inbox size={16} />
          <p style={{ fontSize: "0.875rem", margin: 0 }}>
            No tracked projects have commits in the last 24 hours.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p style={{ color: "#f87171", fontSize: "0.875rem", margin: "8px 0 0 0" }}>
          {error}
        </p>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
