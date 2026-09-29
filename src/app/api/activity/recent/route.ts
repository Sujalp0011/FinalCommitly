import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { classifyCommitMessage } from "@/lib/commit-analysis";
import { prisma } from "@/lib/prisma";

const RECENT_COMMIT_LIMIT = 20;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const commits = await prisma.commit.findMany({
    where: {
      repo: {
        userId: session.user.id,
      },
    },
    select: {
      id: true,
      sha: true,
      message: true,
      committedAt: true,
      additions: true,
      deletions: true,
      url: true,
      repo: {
        select: {
          id: true,
          name: true,
          fullName: true,
          language: true,
        },
      },
    },
    orderBy: [
      { committedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take: RECENT_COMMIT_LIMIT,
  });

  return NextResponse.json({
    commits: commits.map((commit) => ({
      ...commit,
      committedAt: commit.committedAt?.toISOString() ?? null,
      category: classifyCommitMessage(commit.message),
    })),
  });
}
