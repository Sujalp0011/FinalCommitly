/**
 * GitHub API helper — handles authentication, rate limiting, and error handling.
 * All GitHub REST API calls go through this module.
 */

const GITHUB_API = "https://api.github.com";
const MAX_COMMITS_PER_REPO = 50;

export interface GitHubRepoData {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  private: boolean;
  updated_at: string;
  owner: {
    login: string;
  };
}

export interface GitHubCommitListItem {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    } | null;
  };
  html_url: string;
  author: {
    login: string;
  } | null;
}

export interface GitHubCommitDetail {
  sha: string;
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export class GitHubRateLimitError extends Error {
  resetAt: Date;
  constructor(resetAt: Date) {
    super(
      `GitHub API rate limit exceeded. Resets at ${resetAt.toLocaleTimeString()}`
    );
    this.name = "GitHubRateLimitError";
    this.resetAt = resetAt;
  }
}

export class GitHubAuthError extends Error {
  constructor(message?: string) {
    super(
      message ?? "GitHub token is invalid or expired. Please sign out and sign in again."
    );
    this.name = "GitHubAuthError";
  }
}

async function githubFetch<T>(
  path: string,
  accessToken: string
): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Commitly/2.0",
    },
    cache: "no-store",
  });

  // Handle expired/revoked tokens
  if (res.status === 401) {
    throw new GitHubAuthError();
  }

  // Handle rate limiting
  if (res.status === 403 || res.status === 429) {
    // Check if it's actually a rate limit vs. a token scope issue
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining !== null && parseInt(remaining) === 0) {
      const resetHeader = res.headers.get("x-ratelimit-reset");
      const resetAt = resetHeader
        ? new Date(parseInt(resetHeader) * 1000)
        : new Date(Date.now() + 60 * 60 * 1000);
      throw new GitHubRateLimitError(resetAt);
    }
    // 403 with remaining quota = token scope/permission issue
    const body = await res.text();
    if (body.includes("Bad credentials")) {
      throw new GitHubAuthError();
    }
    // Fallback: treat as rate limit
    const resetHeader = res.headers.get("x-ratelimit-reset");
    const resetAt = resetHeader
      ? new Date(parseInt(resetHeader) * 1000)
      : new Date(Date.now() + 60 * 60 * 1000);
    throw new GitHubRateLimitError(resetAt);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetch all repos owned by the authenticated user.
 */
export async function fetchAllRepos(
  accessToken: string
): Promise<GitHubRepoData[]> {
  // Fetch up to 100 repos, sorted by most recently updated
  return githubFetch<GitHubRepoData[]>(
    "/user/repos?per_page=100&sort=updated&type=owner",
    accessToken
  );
}

/**
 * Fetch commits from a repo for the last 30 days.
 * Limited to MAX_COMMITS_PER_REPO (50) to keep sync fast.
 */
export async function fetchRepoCommits(
  fullName: string,
  accessToken: string,
  githubUsername?: string
): Promise<GitHubCommitListItem[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  let path = `/repos/${fullName}/commits?since=${since.toISOString()}&per_page=${MAX_COMMITS_PER_REPO}`;
  if (githubUsername) {
    path += `&author=${githubUsername}`;
  }

  return githubFetch<GitHubCommitListItem[]>(path, accessToken);
}

/**
 * Fetch detailed stats (additions/deletions) for a single commit.
 * This is a separate API call per commit — use sparingly.
 */
export async function fetchCommitDetail(
  fullName: string,
  sha: string,
  accessToken: string
): Promise<GitHubCommitDetail> {
  return githubFetch<GitHubCommitDetail>(
    `/repos/${fullName}/commits/${sha}`,
    accessToken
  );
}
