import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summary = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: today,
      },
    },
    select: {
      id: true,
      date: true,
      summaryText: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ summary: summary ?? null });
}
