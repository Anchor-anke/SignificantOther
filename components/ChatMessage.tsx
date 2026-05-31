"use client";

export type MessageItem = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string | null;
  createdAt?: string;
};

type Props = {
  message: MessageItem;
  avatarUrl: string;
  companionName: string;
};

export default function ChatMessage({ message, avatarUrl, companionName }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`mb-2 flex w-full gap-2 px-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <Avatar src={isUser ? undefined : avatarUrl} alt={companionName} isUser={isUser} />
      <section
        className={`max-w-[75%] rounded-lg px-3 py-2 text-[15px] leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-[var(--bubble-user)] text-[var(--text-primary)]"
            : "rounded-tl-sm bg-[var(--bubble-ai)] text-[var(--text-primary)] shadow-sm"
        }`}
      >
        {message.imageUrl && (
          <div className="mb-2 overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.imageUrl}
              alt="图片消息"
              className="max-h-56 max-w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </section>
    </div>
  );
}

function Avatar({
  src,
  alt,
  isUser,
}: {
  src?: string;
  alt: string;
  isUser: boolean;
}) {
  if (isUser) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#576b95] text-xs text-white">
        我
      </div>
    );
  }

  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[#d8d8d8]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || "/avatars/default.svg"}
        alt={alt}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
