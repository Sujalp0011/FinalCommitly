import { classifyCommitMessage } from "@/lib/commit-analysis";

interface MomentumCommit {
  message: string;
  committedAt: Date | null;
}

/**
 * Calculate repository momentum using 40% recency, 40% frequency, and a
 * 20% feature/fix ratio. Callers supply the existing 30-day commit window.
 */
export function calculateMomentum(commits: MomentumCommit[]): number {
  if (commits.length === 0) return 0;

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const lastCommitDate = commits
    .filter((commit) => commit.committedAt)
    .sort(
      (a, b) => b.committedAt!.getTime() - a.committedAt!.getTime()
    )[0]?.committedAt;

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

  const totalCommits = commits.length;
  let frequencyScore: number;
  if (totalCommits >= 30) frequencyScore = 100;
  else if (totalCommits >= 20) frequencyScore = 85;
  else if (totalCommits >= 10) frequencyScore = 65;
  else if (totalCommits >= 5) frequencyScore = 45;
  else if (totalCommits >= 2) frequencyScore = 25;
  else frequencyScore = 10;

  let featureCount = 0;
  let fixCount = 0;
  for (const commit of commits) {
    const category = classifyCommitMessage(commit.message);
    if (category === "feature") featureCount++;
    else if (category === "fix") fixCount++;
  }

  let featureRatioScore: number;
  const categorized = featureCount + fixCount;
  if (categorized === 0) {
    featureRatioScore = 50;
  } else {
    featureRatioScore = Math.round((featureCount / categorized) * 100);
  }

  const score = Math.round(
    recencyScore * 0.4 + frequencyScore * 0.4 + featureRatioScore * 0.2
  );

  return Math.max(0, Math.min(100, score));
}
