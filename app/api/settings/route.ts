import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSettings } from "@/lib/user";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "缺少用户标识" }, { status: 400 });
  }

  const settings = await getOrCreateSettings(userId);
  return NextResponse.json({
    companionName: settings.companionName,
    userNickname: settings.userNickname,
    personality: settings.personality,
    avatarUrl: settings.avatarUrl,
  });
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "缺少用户标识" }, { status: 400 });
  }

  const body = await req.json();
  const { companionName, userNickname, personality, avatarUrl } = body;

  await getOrCreateSettings(userId);

  const settings = await prisma.settings.update({
    where: { userId },
    data: {
      ...(companionName !== undefined && { companionName: String(companionName) }),
      ...(userNickname !== undefined && { userNickname: String(userNickname) }),
      ...(personality !== undefined && { personality: String(personality) }),
      ...(avatarUrl !== undefined && { avatarUrl: String(avatarUrl) }),
    },
  });

  return NextResponse.json({
    companionName: settings.companionName,
    userNickname: settings.userNickname,
    personality: settings.personality,
    avatarUrl: settings.avatarUrl,
  });
}
