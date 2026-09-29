import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  COMMIT_CATEGORIES,
  classifyCommitMessage,
  type CommitCategory,
} from "@/lib/commit-analysis";
import { chatCompletion } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import {
  buildProjectInsightPrompt,
  PROJECT_INSIGHT_SYSTEM_PROMPT,
} from "@/lib/project-insight-prompt";
import { calculateMomentum } from "@/lib/project-momentum";

const PERIOD_DAYS = 30;
const MAX_PROMPT_COMMITS = 50;
const MAX_COMMIT_MESSAGE_LENGTH = 300;

interface InsightRouteContext {
  params: {
    repoId: string;
  };
}

function generationErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "GROQ_API_KEY is not set") {
    console.error("[project-insight] Generation unavailable: Groq API key is not configured.");
    return NextResponse.json(
      { error: "AI insight could not be generated" },
      { status: 503 }
    );
  }

  if (message === "Groq returned an empty response") {
    console.error("[project-insight] Generation failed: provider returned no content.");
  } else {
    console.error("[project-insight] Generation failed: provider request was unsuccessful.");
  }

  return NextResponse.json(
    { error: "AI insight could not be generated" },
    { status: 502 }
  );
}

export async function POST(
  _request: Request,
  { params }: InsightRouteContext
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      fullName: true,
      language: true,
      commits: {
        where: {
          committedAt: { gte: periodStart },
        },
        select: {
          message: true,
          committedAt: true,
          additions: true,
          deletions: true,
        },
        orderBy: {
          committedAt: { sort: "desc", nulls: "last" },
        },
      },
    },
  });

  if (!repo) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (repo.commits.length === 0) {
    return NextResponse.json({
      insight: null,
      message: "No recent commits available for analysis",
    });
  }

  const categoryCounts = Object.fromEntries(
    COMMIT_CATEGORIES.map((category) => [category, 0])
  ) as Record<CommitCategory, number>;

  let additions = 0;
  let deletions = 0;
  let commitsWithRecordedChanges = 0;

  for (const commit of repo.commits) {
    categoryCounts[classifyCommitMessage(commit.message)] += 1;
    additions += commit.additions;
    deletions += commit.deletions;
    if (commit.additions > 0 || commit.deletions > 0) {
      commitsWithRecordedChanges += 1;
    }
  }

  const commitMessageSample = repo.commits
    .slice(0, MAX_PROMPT_COMMITS)
    .map((commit) => ({
      message: commit.message.slice(0, MAX_COMMIT_MESSAGE_LENGTH),
      committedAt: commit.committedAt?.toISOString() ?? null,
    }));

  const userPrompt = buildProjectInsightPrompt({
    repositoryName: repo.fullName,
    language: repo.language,
    commitCount: repo.commits.length,
    momentumScore: calculateMomentum(repo.commits),
    categoryCounts,
    mostRecentCommitDate: repo.commits[0]?.committedAt?.toISOString() ?? null,
    recordedChanges: {
      commitsWithRecordedChanges,
      additions,
      deletions,
    },
    commitMessageSample,
  });

  try {
    const insight = await chatCompletion(
      [
        { role: "system", content: PROJECT_INSIGHT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 300, temperature: 0.3 }
    );

    return NextResponse.json({ insight });
  } catch (error) {
    return generationErrorResponse(error);
  }
}
