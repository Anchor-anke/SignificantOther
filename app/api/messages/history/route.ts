import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HISTORY_PAGE_SIZE } from "@/lib/chat-limits";
import { mapMessage } from "@/lib/message-map";
import { getOrCreateConversation } from "@/lib/user";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "缺少用户标识" }, { status: 400 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const offset = Math.max(
    0,
    parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10) || 0,
  );
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? String(HISTORY_PAGE_SIZE), 10) || HISTORY_PAGE_SIZE),
  );

  const conversation = await getOrCreateConversation(userId);

  const where = {
    conversationId: conversation.id,
    ...(q ? { content: { contains: q } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
  ]);

  const messages = [...rows].reverse().map(mapMessage);
  const hasMore = offset + limit < total;

  return NextResponse.json({
    messages,
    total,
    offset,
    limit,
    hasMore,
    query: q,
  });
}
