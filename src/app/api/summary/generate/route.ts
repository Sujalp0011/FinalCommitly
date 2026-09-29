import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatCompletion } from "@/lib/groq";

const SYSTEM_PROMPT = `You are a sharp, honest developer analyst. Given commit data, write a daily summary that: (1) names exactly what was built or changed, (2) identifies one pattern or observation the developer might not have noticed, (3) ends with one specific thing to focus on tomorrow based on today's activity. Be direct, specific, no filler phrases like 'Here is your summary' or 'This suggests'. Max 120 words. Start directly with what was done.`;

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Query commits from the last 24 hours across tracked user repos.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentCommits = await prisma.commit.findMany({
      where: {
        repo: { userId, isTracked: true },
        committedAt: { gte: since },
      },
      include: {
        repo: {
          select: { fullName: true },
        },
      },
      orderBy: { committedAt: "desc" },
    });

    if (recentCommits.length === 0) {
      return NextResponse.json({
        summary: null,
        message: "No tracked projects have commits in the last 24 hours",
      });
    }

    // Group commits by repo name
    const grouped: Record<string, string[]> = {};
    for (const commit of recentCommits) {
      const repoName = commit.repo.fullName;
      if (!grouped[repoName]) {
        grouped[repoName] = [];
      }
      grouped[repoName].push(commit.message);
    }

    // Format for the AI prompt
    const commitSummary = Object.entries(grouped)
      .map(
        ([repo, messages]) =>
          `**${repo}**:\n${messages.map((m) => `- ${m}`).join("\n")}`
      )
      .join("\n\n");

    console.log(
      `[summary] Generating summary for ${recentCommits.length} commits across ${Object.keys(grouped).length} repos`
    );

    // Call Groq API
    const summaryText = await chatCompletion([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here are my commits from the last 24 hours:\n\n${commitSummary}`,
      },
    ]);

    // Upsert today's summary (overwrite if exists)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const saved = await prisma.dailySummary.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        summaryText,
      },
      create: {
        userId,
        date: today,
        summaryText,
      },
    });

    console.log(`[summary] ✅ Summary saved (${summaryText.length} chars)`);

    return NextResponse.json({
      summary: {
        id: saved.id,
        date: saved.date,
        summaryText: saved.summaryText,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (err) {
    console.error("[summary] Error generating summary:", err);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
