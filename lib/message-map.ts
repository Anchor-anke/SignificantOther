import type { Message } from "@prisma/client";

export type MessageDto = {
  id: string;
  role: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
};

export function mapMessage(m: Message): MessageDto {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    imageUrl: m.imageUrl,
    createdAt: m.createdAt.toISOString(),
  };
}
