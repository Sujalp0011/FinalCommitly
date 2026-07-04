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

  const [repoCount, commitCount, lastSync] = await Promise.all([
    prisma.repo.count({ where: { userId } }),
    prisma.commit.count({
      where: { repo: { userId } },
    }),
    prisma.repo.findFirst({
      where: { userId, lastSyncedAt: { not: null } },
      orderBy: { lastSyncedAt: "desc" },
      select: { lastSyncedAt: true },
    }),
  ]);

  return NextResponse.json({
    repos: repoCount,
    commits: commitCount,
    lastSyncedAt: lastSync?.lastSyncedAt ?? null,
  });
}
