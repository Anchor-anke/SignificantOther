"use client";

import { useRef, useState } from "react";
import { compressImageIfNeeded, isAllowedImageType } from "@/lib/compress-image";

type Props = {
  onSend: (text: string, image?: { base64: string; mimeType: string; previewUrl: string }) => void;
  /** 对方正在回复时，提示可直接发消息打断 */
  companionReplying?: boolean;
};

export default function ChatInput({ onSend, companionReplying = false }: Props) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    base64: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = async (file: File) => {
    if (!isAllowedImageType(file.type)) {
      alert("仅支持 JPEG、PNG、GIF、WebP 格式");
      return;
    }
    try {
      const result = await compressImageIfNeeded(file);
      setPendingImage(result);
      setPreview(result.previewUrl);
    } catch {
      alert("图片处理失败，请换一张试试");
    }
  };

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPendingImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed && !pendingImage) return;
    onSend(trimmed, pendingImage ?? undefined);
    setText("");
    clearImage();
  };

  const canSend = Boolean(text.trim() || pendingImage);

  return (
    <section className="border-t border-[var(--header-border)] bg-[var(--header-bg)] px-3 py-2">
      {preview && (
        <section className="relative mb-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="预览" className="h-20 rounded-md object-cover" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#666] text-xs text-white"
          >
            ×
          </button>
        </section>
      )}
      <section className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg text-[var(--text-secondary)] hover:bg-black/5"
          title="发送图片"
        >
          📷
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImage(f);
          }}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={companionReplying ? "发消息即可打断并继续聊…" : "发消息…"}
          className="max-h-28 min-h-[36px] flex-1 resize-none rounded-md border border-[var(--input-border)] bg-white px-3 py-2 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          className="shrink-0 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-40"
        >
          发送
        </button>
      </section>
    </section>
  );
}
