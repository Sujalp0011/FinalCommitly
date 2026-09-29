import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PERIOD_DAYS = 30;
const QUERY_LOOKBACK_DAYS = 32;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

interface ActivityDay {
  date: string;
  count: number;
}

function resolveTimeZone(candidate: string | null): string {
  if (!candidate) return "UTC";

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: candidate,
    }).resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function createDateKeyFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    calendar: "gregory",
    numberingSystem: "latn",
  });
}

function toDateKey(date: Date, formatter: Intl.DateTimeFormat): string {
  const dateParts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};

  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") dateParts[part.type] = part.value;
  }

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shiftedDate = new Date(Date.UTC(year, month - 1, day + days));
  return shiftedDate.toISOString().slice(0, 10);
}

function buildPeriodDateKeys(todayKey: string): string[] {
  return Array.from({ length: PERIOD_DAYS }, (_, index) =>
    shiftDateKey(todayKey, index - (PERIOD_DAYS - 1))
  );
}

function buildActivityDays(
  committedDates: Array<Date | null>,
  periodDateKeys: string[],
  formatter: Intl.DateTimeFormat
): ActivityDay[] {
  const countsByDate = new Map(periodDateKeys.map((date) => [date, 0]));

  for (const committedAt of committedDates) {
    if (!committedAt) continue;
    const dateKey = toDateKey(committedAt, formatter);
    const currentCount = countsByDate.get(dateKey);
    if (currentCount !== undefined) {
      countsByDate.set(dateKey, currentCount + 1);
    }
  }

  return periodDateKeys.map((date) => ({
    date,
    count: countsByDate.get(date) ?? 0,
  }));
}

function calculateCurrentStreak(days: ActivityDay[]): number {
  let index = days.length - 1;

  // Today is allowed to be empty because it may not be finished yet.
  if (days[index]?.count === 0) index -= 1;

  let streak = 0;
  while (index >= 0 && days[index].count > 0) {
    streak += 1;
    index -= 1;
  }

  return streak;
}

function calculateLongestStreak(days: ActivityDay[]): number {
  let longestStreak = 0;
  let runningStreak = 0;

  for (const day of days) {
    if (day.count > 0) {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  return longestStreak;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timeZone = resolveTimeZone(request.nextUrl.searchParams.get("timeZone"));
  const dateKeyFormatter = createDateKeyFormatter(timeZone);
  const now = new Date();

  // Date keys use the requested timezone. UTC is used only as a stable vehicle
  // for adding calendar days after the timezone-specific "today" is known.
  const todayKey = toDateKey(now, dateKeyFormatter);
  const periodDateKeys = buildPeriodDateKeys(todayKey);

  // The wider lookup covers timestamps that cross UTC boundaries when converted
  // to the user's timezone. Only keys in the exact 30-day period are retained.
  const queryStart = new Date(
    now.getTime() - QUERY_LOOKBACK_DAYS * MILLISECONDS_PER_DAY
  );

  const commits = await prisma.commit.findMany({
    where: {
      repo: { userId: session.user.id },
      committedAt: {
        gte: queryStart,
        lte: now,
      },
    },
    select: {
      committedAt: true,
    },
  });

  const days = buildActivityDays(
    commits.map((commit) => commit.committedAt),
    periodDateKeys,
    dateKeyFormatter
  );
  const totalCommits = days.reduce((total, day) => total + day.count, 0);

  return NextResponse.json({
    periodDays: PERIOD_DAYS,
    timeZone,
    totalCommits,
    activeDays: days.filter((day) => day.count > 0).length,
    currentStreak: calculateCurrentStreak(days),
    longestStreak: calculateLongestStreak(days),
    days,
  });
}
