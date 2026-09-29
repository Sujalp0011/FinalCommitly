import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, GitCommit } from "lucide-react";
import ProjectAiInsight from "@/components/project-ai-insight";
import { authOptions } from "@/lib/auth";
import {
  COMMIT_CATEGORIES,
  COMMIT_CATEGORY_LABELS,
  classifyCommitMessage,
  type CommitCategory,
} from "@/lib/commit-analysis";
import { prisma } from "@/lib/prisma";
import { calculateMomentum } from "@/lib/project-momentum";

const PERIOD_DAYS = 30;
const RECENT_COMMIT_LIMIT = 20;

interface ProjectPageProps {
  params: {
    repoId: string;
  };
}

const CATEGORY_COLORS: Record<CommitCategory, string> = {
  feature: "#58A6FF",
  fix: "#F87171",
  refactor: "#C084FC",
  test: "#4ADE80",
  docs: "#FBBF24",
  chore: "#8B949E",
  other: "#6E7681",
};

function formatUtcDateTime(date: Date | null): string {
  if (!date) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const periodStart = new Date(
    Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000
  );

  const repo = await prisma.repo.findFirst({
    where: {
      id: params.repoId,
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      fullName: true,
      url: true,
      language: true,
      lastSyncedAt: true,
      commits: {
        where: {
          committedAt: { gte: periodStart },
        },
        select: {
          message: true,
          committedAt: true,
        },
        orderBy: { committedAt: "desc" },
      },
    },
  });

  if (!repo) {
    notFound();
  }

  const recentCommits = await prisma.commit.findMany({
    where: {
      repoId: repo.id,
      repo: { userId: session.user.id },
    },
    select: {
      id: true,
      sha: true,
      message: true,
      committedAt: true,
      additions: true,
      deletions: true,
      url: true,
    },
    orderBy: { committedAt: "desc" },
    take: RECENT_COMMIT_LIMIT,
  });

  const momentumScore = calculateMomentum(repo.commits);
  const categoryCounts = Object.fromEntries(
    COMMIT_CATEGORIES.map((category) => [category, 0])
  ) as Record<CommitCategory, number>;

  for (const commit of repo.commits) {
    categoryCounts[classifyCommitMessage(commit.message)] += 1;
  }

  // Repository drill-down activity uses UTC calendar dates because this Server
  // Component does not receive a browser timezone.
  const activeDays = new Set(
    repo.commits
      .filter((commit) => commit.committedAt)
      .map((commit) => commit.committedAt!.toISOString().slice(0, 10))
  ).size;

  const metrics = [
    { label: "Momentum Score", value: String(momentumScore) },
    { label: "30-Day Commits", value: String(repo.commits.length) },
    { label: "Active Days (UTC)", value: String(activeDays) },
    {
      label: "Last Synced",
      value: repo.lastSyncedAt ? formatUtcDateTime(repo.lastSyncedAt) : "Never",
    },
  ];

  return (
    <main style={{ maxWidth: "920px", margin: "0 auto", padding: "36px 20px 64px" }}>
      <Link
        href="/dashboard"
        style={{ display: "inline-flex", alignItems: "center", gap: "7px", color: "#8B949E", fontSize: "0.85rem", textDecoration: "none", marginBottom: "28px" }}
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to dashboard
      </Link>

      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "28px" }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, color: "#E6EDF3", fontSize: "clamp(1.5rem, 4vw, 2rem)", lineHeight: 1.2, overflowWrap: "anywhere" }}>
            {repo.fullName}
          </h1>
          <p style={{ margin: "8px 0 0", color: "#6E7681", fontSize: "0.85rem" }}>
            Repository details from stored Commitly data
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {repo.language ? (
            <span style={{ padding: "5px 10px", border: "1px solid #30363D", borderRadius: "999px", color: "#8B949E", fontSize: "0.75rem" }}>
              {repo.language}
            </span>
          ) : null}
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${repo.fullName} on GitHub in a new tab`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#58A6FF", fontSize: "0.8rem", textDecoration: "none" }}
          >
            Open on GitHub
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </header>

      <section aria-label="Repository metrics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", border: "1px solid #30363D", borderRadius: "10px", overflow: "hidden", marginBottom: "28px" }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={{ padding: "18px", borderRight: "1px solid #21262D" }}>
            <div style={{ color: "#E6EDF3", fontSize: metric.label === "Last Synced" ? "0.9rem" : "1.5rem", lineHeight: 1.2, fontWeight: 700 }}>
              {metric.value}
            </div>
            <div style={{ color: "#8B949E", fontSize: "0.75rem", marginTop: "7px" }}>
              {metric.label}
            </div>
          </div>
        ))}
      </section>

      <ProjectAiInsight repoId={repo.id} />

      <section style={{ marginBottom: "30px" }} aria-labelledby="commit-breakdown-title">
        <h2 id="commit-breakdown-title" style={{ margin: "0 0 14px", color: "#C9D1D9", fontSize: "1rem", fontWeight: 600 }}>
          Commit Breakdown
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
          {COMMIT_CATEGORIES.map((category) => (
            <div key={category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "11px 13px", border: "1px solid #21262D", borderRadius: "7px" }}>
              <span style={{ color: "#8B949E", fontSize: "0.8rem" }}>
                {COMMIT_CATEGORY_LABELS[category]}
              </span>
              <span style={{ color: CATEGORY_COLORS[category], fontWeight: 700, fontSize: "0.85rem" }}>
                {categoryCounts[category]}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-commits-title">
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
          <GitCommit size={18} color="#8B949E" aria-hidden="true" />
          <h2 id="recent-commits-title" style={{ margin: 0, color: "#C9D1D9", fontSize: "1rem", fontWeight: 600 }}>
            Recent Commits
          </h2>
        </div>

        {recentCommits.length === 0 ? (
          <div style={{ padding: "28px", border: "1px solid #21262D", borderRadius: "10px", color: "#8B949E", textAlign: "center", fontSize: "0.85rem" }}>
            No commits have been synced for this repository yet.
          </div>
        ) : (
          <div style={{ border: "1px solid #30363D", borderRadius: "10px", overflow: "hidden" }}>
            {recentCommits.map((commit, index) => {
              const category = classifyCommitMessage(commit.message);
              const hasRecordedStats = commit.additions > 0 || commit.deletions > 0;

              return (
                <article key={commit.id} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "15px 16px", borderBottom: index < recentCommits.length - 1 ? "1px solid #21262D" : "none" }}>
                  <div style={{ width: "62px", flexShrink: 0 }}>
                    {commit.url ? (
                      <a
                        href={commit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open commit ${commit.sha.slice(0, 7)} on GitHub in a new tab`}
                        style={{ color: "#58A6FF", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.76rem", textDecoration: "none" }}
                      >
                        {commit.sha.slice(0, 7)}
                      </a>
                    ) : (
                      <span style={{ color: "#8B949E", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.76rem" }}>
                        {commit.sha.slice(0, 7)}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, color: "#E6EDF3", fontSize: "0.84rem", lineHeight: 1.45, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
                      {commit.message}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "7px", color: "#6E7681", fontSize: "0.72rem" }}>
                      <span>{formatUtcDateTime(commit.committedAt)}</span>
                      {hasRecordedStats ? (
                        <span aria-label={`${commit.additions} additions and ${commit.deletions} deletions recorded`}>
                          <span style={{ color: "#4ADE80" }}>+{commit.additions}</span>{" "}
                          <span style={{ color: "#F87171" }}>-{commit.deletions}</span>{" "}
                          recorded
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <span style={{ flexShrink: 0, padding: "3px 7px", border: `1px solid ${CATEGORY_COLORS[category]}55`, borderRadius: "999px", color: CATEGORY_COLORS[category], fontSize: "0.68rem" }}>
                    {COMMIT_CATEGORY_LABELS[category]}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
