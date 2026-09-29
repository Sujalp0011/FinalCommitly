import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [storedRepoCount, trackedRepoCount, commitCount, lastSync] = await Promise.all([
    prisma.repo.count({ where: { userId } }),
    prisma.repo.count({ where: { userId, isTracked: true } }),
    prisma.commit.count({
      where: { repo: { userId, isTracked: true } },
    }),
    prisma.repo.findFirst({
      where: { userId, isTracked: true, lastSyncedAt: { not: null } },
      orderBy: { lastSyncedAt: "desc" },
      select: { lastSyncedAt: true },
    }),
  ]);

  return NextResponse.json({
    repos: storedRepoCount,
    trackedRepos: trackedRepoCount,
    commits: commitCount,
    lastSyncedAt: lastSync?.lastSyncedAt ?? null,
  });
}
