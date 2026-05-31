import { prisma } from "./prisma";

export async function getOrCreateSettings(userId: string) {
  let settings = await prisma.settings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { userId },
    });
  } else if (settings.companionName === "小暖") {
    settings = await prisma.settings.update({
      where: { userId },
      data: { companionName: "艾德里安" },
    });
  }
  return settings;
}

export async function getOrCreateConversation(userId: string) {
  let conversation = await prisma.conversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userId },
    });
  }
  return conversation;
}
