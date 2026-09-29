"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

interface ProjectAiInsightProps {
  repoId: string;
}

interface InsightResponse {
  insight?: string | null;
  message?: string;
  error?: string;
}

export default function ProjectAiInsight({ repoId }: ProjectAiInsightProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function generateInsight() {
    setGenerating(true);
    setError(null);
    setEmptyMessage(null);

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(repoId)}/insight`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as InsightResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "AI insight could not be generated");
      }

      if (data.insight) {
        setInsight(data.insight);
      } else {
        setInsight(null);
        setEmptyMessage(data.message ?? "No recent commits available for analysis");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "AI insight could not be generated"
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section
      aria-labelledby="project-ai-insight-title"
      style={{
        marginBottom: "30px",
        padding: "18px",
        border: "1px solid #30363D",
        borderRadius: "10px",
        background: "#0D1117",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "18px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <Sparkles size={17} color="#58A6FF" aria-hidden="true" />
            <h2
              id="project-ai-insight-title"
              style={{ margin: 0, color: "#C9D1D9", fontSize: "1rem", fontWeight: 600 }}
            >
              AI Project Insight
            </h2>
          </div>
          <p style={{ margin: "7px 0 0 26px", color: "#6E7681", fontSize: "0.78rem" }}>
            Based on recent commit activity and metadata.
          </p>
        </div>

        <button
          type="button"
          onClick={generateInsight}
          disabled={generating}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            minHeight: "36px",
            padding: "7px 12px",
            border: "1px solid #388BFD",
            borderRadius: "7px",
            background: generating ? "#17365F" : "#1F6FEB",
            color: "#FFFFFF",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: generating ? "wait" : "pointer",
            opacity: generating ? 0.8 : 1,
          }}
        >
          {generating ? (
            <Loader2 size={14} aria-hidden="true" style={{ animation: "insight-spin 1s linear infinite" }} />
          ) : (
            <Sparkles size={14} aria-hidden="true" />
          )}
          {generating
            ? "Generating..."
            : insight
              ? "Regenerate insight"
              : "Generate AI Insight"}
        </button>
      </div>

      {insight ? (
        <p
          aria-live="polite"
          style={{
            margin: "18px 0 0",
            paddingTop: "16px",
            borderTop: "1px solid #21262D",
            color: "#C9D1D9",
            fontSize: "0.84rem",
            lineHeight: 1.65,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {insight}
        </p>
      ) : null}

      {emptyMessage ? (
        <p aria-live="polite" style={{ margin: "16px 0 0", color: "#8B949E", fontSize: "0.82rem" }}>
          {emptyMessage}
        </p>
      ) : null}

      {error ? (
        <p role="alert" style={{ margin: "16px 0 0", color: "#F87171", fontSize: "0.82rem" }}>
          {error}
        </p>
      ) : null}

      <style>{`@keyframes insight-spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
