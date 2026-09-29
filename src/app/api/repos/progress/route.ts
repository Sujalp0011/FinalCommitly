import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Calculate a momentum score (0-100) for a repo based on:
 * - Recency (40%): how recently the last commit was made
 * - Frequency (40%): how many commits in the last 30 days
 * - Feature ratio (20%): ratio of feature commits (feat/add) vs fix commits
 */
function calculateMomentum(
  commits: { message: string; committedAt: Date | null }[]
): number {
  if (commits.length === 0) return 0;

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // ── Recency Score (0-100) ──
  // Based on how long ago the last commit was
  const lastCommitDate = commits
    .filter((c) => c.committedAt)
    .sort((a, b) => (b.committedAt!.getTime()) - (a.committedAt!.getTime()))[0]
    ?.committedAt;

  let recencyScore = 0;
  if (lastCommitDate) {
    const daysSinceLastCommit = (now - lastCommitDate.getTime()) / DAY;
    if (daysSinceLastCommit <= 1) recencyScore = 100;
    else if (daysSinceLastCommit <= 3) recencyScore = 85;
    else if (daysSinceLastCommit <= 7) recencyScore = 70;
    else if (daysSinceLastCommit <= 14) recencyScore = 45;
    else if (daysSinceLastCommit <= 21) recencyScore = 25;
    else recencyScore = 10;
  }

  // ── Frequency Score (0-100) ──
  // Absolute number of commits in our data (last 30 days)
  // Thresholds tuned for solo devs — 20+ commits/month = very active
  const totalCommits = commits.length;
  let frequencyScore: number;
  if (totalCommits >= 30) frequencyScore = 100;
  else if (totalCommits >= 20) frequencyScore = 85;
  else if (totalCommits >= 10) frequencyScore = 65;
  else if (totalCommits >= 5) frequencyScore = 45;
  else if (totalCommits >= 2) frequencyScore = 25;
  else frequencyScore = 10;

  // ── Feature Ratio Score (0-100) ──
  // Commits starting with feat/add/feature = building new things
  // Commits starting with fix/bug/hotfix = maintenance
  // Higher feature ratio contributes to stronger development momentum
  const featurePattern = /^(feat|add|feature|implement|create|build|init)/i;
  const fixPattern = /^(fix|bug|hotfix|patch|revert)/i;

  let featureCount = 0;
  let fixCount = 0;
  for (const commit of commits) {
    const msg = commit.message.trim();
    if (featurePattern.test(msg)) featureCount++;
    else if (fixPattern.test(msg)) fixCount++;
  }

  let featureRatioScore: number;
  const categorized = featureCount + fixCount;
  if (categorized === 0) {
    // If commits don't follow conventional patterns, give a neutral score
    featureRatioScore = 50;
  } else {
    featureRatioScore = Math.round((featureCount / categorized) * 100);
  }

  // ── Combined Score ──
  const score = Math.round(
    recencyScore * 0.4 + frequencyScore * 0.4 + featureRatioScore * 0.2
  );

  return Math.max(0, Math.min(100, score));
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Fetch all repos with their commits from the last 30 days
  const repos = await prisma.repo.findMany({
    where: { userId },
    include: {
      commits: {
        where: {
          committedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          message: true,
          committedAt: true,
        },
        orderBy: { committedAt: "desc" },
      },
      _count: {
        select: { commits: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const results = repos.map((repo) => {
    const momentumScore = calculateMomentum(repo.commits);

    // Find the most recent commit date
    const lastCommitDate =
      repo.commits.length > 0 && repo.commits[0].committedAt
        ? repo.commits[0].committedAt
        : null;

    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.fullName,
      url: repo.url,
      language: repo.language,
      momentumScore,
      lastCommitDate,
      totalCommits: repo._count.commits,
      lastSyncedAt: repo.lastSyncedAt,
    };
  });

  // Sort: repos with stronger recent momentum first
  results.sort((a, b) => b.momentumScore - a.momentumScore);

  return NextResponse.json({ repos: results });
}
