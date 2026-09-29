import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMomentum } from "@/lib/project-momentum";

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

  results.sort((a, b) => b.momentumScore - a.momentumScore);

  return NextResponse.json({ repos: results });
}
