import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CHAT_DISPLAY_LIMIT } from "@/lib/chat-limits";
import { mapMessage } from "@/lib/message-map";
import { getOrCreateConversation } from "@/lib/user";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "缺少用户标识" }, { status: 400 });
  }

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(
    CHAT_DISPLAY_LIMIT,
    Math.max(1, parseInt(limitParam ?? String(CHAT_DISPLAY_LIMIT), 10) || CHAT_DISPLAY_LIMIT),
  );

  const conversation = await getOrCreateConversation(userId);

  const [total, recent] = await Promise.all([
    prisma.message.count({ where: { conversationId: conversation.id } }),
    prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  const messages = [...recent].reverse().map(mapMessage);

  return NextResponse.json({
    conversationId: conversation.id,
    messages,
    total,
    limit,
    hasOlder: total > messages.length,
  });
}
