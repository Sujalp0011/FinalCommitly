import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  COMMIT_CATEGORIES,
  classifyCommitMessage,
  type CommitCategory,
} from "@/lib/commit-analysis";
import { prisma } from "@/lib/prisma";

const PERIOD_DAYS = 30;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const commits = await prisma.commit.findMany({
    where: {
      repo: { userId: session.user.id },
      committedAt: {
        gte: new Date(Date.now() - PERIOD_DAYS * MILLISECONDS_PER_DAY),
      },
    },
    select: {
      message: true,
    },
  });

  const counts = Object.fromEntries(
    COMMIT_CATEGORIES.map((category) => [category, 0])
  ) as Record<CommitCategory, number>;

  for (const commit of commits) {
    counts[classifyCommitMessage(commit.message)] += 1;
  }

  const totalCommits = commits.length;
  const categories = COMMIT_CATEGORIES.map((category) => ({
    category,
    count: counts[category],
    percentage:
      totalCommits === 0
        ? 0
        : Math.round((counts[category] / totalCommits) * 100),
  }));

  let dominantCategory: CommitCategory | null = null;
  for (const category of COMMIT_CATEGORIES) {
    if (
      counts[category] > 0 &&
      (dominantCategory === null || counts[category] > counts[dominantCategory])
    ) {
      dominantCategory = category;
    }
  }

  return NextResponse.json({
    periodDays: PERIOD_DAYS,
    totalCommits,
    categories,
    dominantCategory,
  });
}
