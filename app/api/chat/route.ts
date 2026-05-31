import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chatWithDeepSeek } from "@/lib/deepseek";
import { analyzeImageWithGLM } from "@/lib/glm";
import {
  buildSystemPrompt,
  randomBubbleTarget,
  shouldUseKaomojiThisTurn,
} from "@/lib/prompts";
import { ensureKaomojiInReplies } from "@/lib/kaomoji";
import { stripActionParentheses } from "@/lib/sanitize-reply";
import { parseAssistantBubbles } from "@/lib/sentence-split";
import { getOrCreateConversation, getOrCreateSettings } from "@/lib/user";

const HISTORY_LIMIT = 20;

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "缺少用户标识" }, { status: 400 });
    }

    const body = await req.json();
    const { content, imageBase64, imageMimeType } = body as {
      content?: string;
      imageBase64?: string;
      imageMimeType?: string;
    };

    const userText = (content ?? "").trim();
    if (!userText && !imageBase64) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    const settings = await getOrCreateSettings(userId);
    const conversation = await getOrCreateConversation(userId);
    const bubbleTarget = randomBubbleTarget();

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: userText || "[图片]",
        imageUrl: imageBase64
          ? `data:${imageMimeType ?? "image/jpeg"};base64,${imageBase64}`
          : null,
      },
    });

    const userTurnIndex = await prisma.message.count({
      where: { conversationId: conversation.id, role: "user" },
    });
    const useKaomoji = shouldUseKaomojiThisTurn(userTurnIndex);
    const systemPrompt = buildSystemPrompt(settings, bubbleTarget, {
      useKaomoji,
    });

    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    });

    const chronological = [...history].reverse();

    let assistantRaw: string;

    if (imageBase64) {
      const visionContext = `${systemPrompt}\n\n用户发来了一张图片。结合图片回应，**恰好 ${bubbleTarget} 行**，每行一条。`;
      assistantRaw = await analyzeImageWithGLM(
        imageBase64,
        imageMimeType ?? "image/jpeg",
        userText,
        visionContext,
      );
    } else {
      const messages: { role: "system" | "user" | "assistant"; content: string }[] =
        [{ role: "system", content: systemPrompt }];

      for (const m of chronological) {
        if (m.role === "user" || m.role === "assistant") {
          messages.push({
            role: m.role as "user" | "assistant",
            content: m.content,
          });
        }
      }

      assistantRaw = await chatWithDeepSeek(messages);
    }

    const cleaned = stripActionParentheses(assistantRaw);
    let sentences = parseAssistantBubbles(cleaned, bubbleTarget)
      .map(stripActionParentheses)
      .filter((s) => s.length > 0);

    if (useKaomoji && sentences.length > 0) {
      sentences = ensureKaomojiInReplies(sentences);
    }

    for (const sentence of sentences) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: sentence,
        },
      });
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    const messageCount = await prisma.message.count({
      where: { conversationId: conversation.id, role: "assistant" },
    });

    const typoInterval = 35 + (messageCount % 11);
    const triggerTypo =
      messageCount > 0 &&
      messageCount >= typoInterval &&
      messageCount % typoInterval === 0;

    return NextResponse.json({
      sentences,
      bubbleTarget,
      triggerTypo,
      companionName: settings.companionName,
      avatarUrl: settings.avatarUrl,
    });
  } catch (e) {
    console.error("[chat]", e);
    const message = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
