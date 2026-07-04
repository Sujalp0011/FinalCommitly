import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  fetchAllRepos,
  fetchRepoCommits,
  fetchCommitDetail,
  GitHubRateLimitError,
} from "@/lib/github";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized — no access token" },
        { status: 401 }
      );
    }

    const { accessToken, id: userId, githubId } = session.user;

    // 1. Fetch all repos from GitHub
    const githubRepos = await fetchAllRepos(accessToken);
    console.log(`[sync] Found ${githubRepos.length} repos for user ${userId}`);

    // Get the GitHub username for filtering commits by author
    const githubUsername = githubRepos[0]?.owner?.login;

    let totalReposSynced = 0;
    let totalCommitsSaved = 0;
    const errors: string[] = [];

    // 2. Process each repo
    for (const ghRepo of githubRepos) {
      try {
        // Upsert repo in our database
        const repo = await prisma.repo.upsert({
          where: {
            userId_fullName: {
              userId,
              fullName: ghRepo.full_name,
            },
          },
          update: {
            name: ghRepo.name,
            url: ghRepo.html_url,
            language: ghRepo.language,
          },
          create: {
            name: ghRepo.name,
            fullName: ghRepo.full_name,
            url: ghRepo.html_url,
            language: ghRepo.language,
            userId,
          },
        });

        // 3. Fetch last 30 days of commits
        let commits;
        try {
          commits = await fetchRepoCommits(
            ghRepo.full_name,
            accessToken,
            githubUsername
          );
        } catch (err) {
          if (err instanceof GitHubRateLimitError) throw err;
          console.warn(
            `[sync] Failed to fetch commits for ${ghRepo.full_name}:`,
            err
          );
          errors.push(`${ghRepo.full_name}: failed to fetch commits`);
          continue;
        }

        if (commits.length === 0) {
          // Still mark as synced even if no commits
          await prisma.repo.update({
            where: { id: repo.id },
            data: { lastSyncedAt: new Date() },
          });
          totalReposSynced++;
          continue;
        }

        // 4. Get existing commit SHAs to skip duplicates
        const existingShas = new Set(
          (
            await prisma.commit.findMany({
              where: { repoId: repo.id },
              select: { sha: true },
            })
          ).map((c) => c.sha)
        );

        const newCommits = commits.filter((c) => !existingShas.has(c.sha));
        console.log(
          `[sync] ${ghRepo.full_name}: ${commits.length} commits fetched, ${newCommits.length} new`
        );

        // 5. Fetch detail (additions/deletions) for each new commit and save
        let savedCount = 0;
        for (const commit of newCommits) {
          try {
            // Fetch commit stats (additions/deletions)
            let additions = 0;
            let deletions = 0;
            try {
              const detail = await fetchCommitDetail(
                ghRepo.full_name,
                commit.sha,
                accessToken
              );
              additions = detail.stats?.additions ?? 0;
              deletions = detail.stats?.deletions ?? 0;
            } catch (detailErr) {
              // If detail fetch fails (e.g. rate limit), save commit without stats
              if (detailErr instanceof GitHubRateLimitError) throw detailErr;
              console.warn(
                `[sync] Could not fetch stats for ${commit.sha.slice(0, 7)}:`,
                detailErr
              );
            }

            await prisma.commit.create({
              data: {
                sha: commit.sha,
                message: commit.commit.message,
                author: commit.commit.author?.name ?? commit.author?.login ?? null,
                committedAt: commit.commit.author?.date
                  ? new Date(commit.commit.author.date)
                  : null,
                url: commit.html_url,
                additions,
                deletions,
                repoId: repo.id,
              },
            });
            savedCount++;
          } catch (commitErr) {
            if (commitErr instanceof GitHubRateLimitError) throw commitErr;
            // Skip duplicate errors silently (race condition on parallel syncs)
            console.warn(
              `[sync] Failed to save commit ${commit.sha.slice(0, 7)}:`,
              commitErr
            );
          }
        }

        // 6. Update lastSyncedAt
        await prisma.repo.update({
          where: { id: repo.id },
          data: { lastSyncedAt: new Date() },
        });

        totalReposSynced++;
        totalCommitsSaved += savedCount;
        console.log(
          `[sync] ✓ ${ghRepo.full_name}: saved ${savedCount} new commits`
        );
      } catch (repoErr) {
        if (repoErr instanceof GitHubRateLimitError) {
          return NextResponse.json(
            {
              error: `GitHub rate limit hit. Resets at ${repoErr.resetAt.toLocaleTimeString()}`,
              partial: true,
              reposSynced: totalReposSynced,
              commitsSaved: totalCommitsSaved,
            },
            { status: 429 }
          );
        }
        console.error(`[sync] Error syncing ${ghRepo.full_name}:`, repoErr);
        errors.push(`${ghRepo.full_name}: ${String(repoErr)}`);
      }
    }

    console.log(
      `[sync] ✅ Sync complete: ${totalReposSynced} repos, ${totalCommitsSaved} commits saved`
    );

    return NextResponse.json({
      success: true,
      reposSynced: totalReposSynced,
      commitsSaved: totalCommitsSaved,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    if (err instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { error: err.message },
        { status: 429 }
      );
    }
    console.error("[sync] Unexpected error:", err);
    return NextResponse.json(
      { error: "Sync failed unexpectedly" },
      { status: 500 }
    );
  }
}
