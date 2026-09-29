export const COMMIT_CATEGORIES = [
  "feature",
  "fix",
  "refactor",
  "test",
  "docs",
  "chore",
  "other",
] as const;

export type CommitCategory = (typeof COMMIT_CATEGORIES)[number];

export const COMMIT_CATEGORY_LABELS: Record<CommitCategory, string> = {
  feature: "Feature / Build",
  fix: "Fix",
  refactor: "Refactor",
  test: "Tests",
  docs: "Docs",
  chore: "Chore",
  other: "Other",
};

type ClassifiedCategory = Exclude<CommitCategory, "other">;

const CATEGORY_PATTERNS: Array<{
  category: ClassifiedCategory;
  pattern: RegExp;
}> = [
  // "build" remains a feature signal to preserve the momentum calculation's
  // existing behavior where it conflicts with common chore conventions.
  {
    category: "feature",
    pattern: /^(feat|feature|add|implement|create|build|init)(\([^\r\n)]*\))?!?(?::|\s|$)/i,
  },
  {
    category: "fix",
    pattern: /^(fix|bug|bugfix|hotfix|patch|revert)(\([^\r\n)]*\))?!?(?::|\s|$)/i,
  },
  {
    category: "refactor",
    pattern: /^(refactor|cleanup|restructure)(\([^\r\n)]*\))?!?(?::|\s|$)/i,
  },
  {
    category: "test",
    pattern: /^(test|tests)(\([^\r\n)]*\))?!?(?::|\s|$)/i,
  },
  {
    category: "docs",
    pattern: /^(docs|doc|readme)(\([^\r\n)]*\))?!?(?::|\s|$)/i,
  },
  {
    category: "chore",
    pattern: /^(chore|ci|config|deps|dependency)(\([^\r\n)]*\))?!?(?::|\s|$)/i,
  },
];

export function classifyCommitMessage(message: string): CommitCategory {
  const subject = message.trim().split(/\r?\n/, 1)[0];

  for (const { category, pattern } of CATEGORY_PATTERNS) {
    if (pattern.test(subject)) return category;
  }

  return "other";
}
