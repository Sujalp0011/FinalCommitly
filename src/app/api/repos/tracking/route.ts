import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repos = await prisma.repo.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      fullName: true,
      language: true,
      isTracked: true,
      lastSyncedAt: true,
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ repos });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("repoId" in body) ||
    !("isTracked" in body) ||
    typeof body.repoId !== "string" ||
    body.repoId.trim().length === 0 ||
    typeof body.isTracked !== "boolean"
  ) {
    return NextResponse.json(
      { error: "repoId must be a non-empty string and isTracked must be a boolean" },
      { status: 400 }
    );
  }

  const repoId = body.repoId.trim();
  const updateResult = await prisma.repo.updateMany({
    where: {
      id: repoId,
      userId: session.user.id,
    },
    data: {
      isTracked: body.isTracked,
    },
  });

  if (updateResult.count === 0) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  return NextResponse.json({
    repo: {
      id: repoId,
      isTracked: body.isTracked,
    },
  });
}
