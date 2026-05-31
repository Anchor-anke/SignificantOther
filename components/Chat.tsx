"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatMessage, { type MessageItem } from "./ChatMessage";
import { CHAT_DISPLAY_LIMIT } from "@/lib/chat-limits";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import SettingsPanel, { type SettingsData } from "./SettingsPanel";
import { apiHeaders } from "@/lib/client-user";
import { toImageDataUrl } from "@/lib/compress-image";
import { pauseBetweenSentences } from "@/lib/sentence-split";
import { buildTypoSequence } from "@/lib/typo-effect";

const DEFAULT_SETTINGS: SettingsData = {
  companionName: "艾德里安",
  userNickname: "",
  personality: "soft",
  avatarUrl: "/avatars/default.svg",
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 可被打断的等待 */
async function interruptibleSleep(
  ms: number,
  shouldContinue: () => boolean,
): Promise<boolean> {
  const step = 80;
  let elapsed = 0;
  while (elapsed < ms) {
    if (!shouldContinue()) return false;
    const chunk = Math.min(step, ms - elapsed);
    await sleep(chunk);
    elapsed += chunk;
  }
  return shouldContinue();
}

export default function Chat() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assistantActive, setAssistantActive] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [messageTotal, setMessageTotal] = useState(0);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sessionRef = useRef(0);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const isActiveSession = useCallback(
    (sessionId: number) => sessionRef.current === sessionId,
    [],
  );

  const interruptAssistant = useCallback(() => {
    sessionRef.current += 1;
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = null;
    setShowTyping(false);
    setAssistantActive(false);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [msgRes, setRes] = await Promise.all([
          fetch(`/api/messages?limit=${CHAT_DISPLAY_LIMIT}`, {
            headers: apiHeaders(),
          }),
          fetch("/api/settings", { headers: apiHeaders() }),
        ]);
        if (setRes.ok) {
          const s = (await setRes.json()) as SettingsData;
          setSettings({ ...DEFAULT_SETTINGS, ...s });
        }
        if (msgRes.ok) {
          const data = (await msgRes.json()) as {
            messages: MessageItem[];
            total: number;
            hasOlder: boolean;
          };
          setMessageTotal(data.total);
          setHasOlderMessages(data.hasOlder);
          setMessages(
            data.messages.map((m) => ({
              ...m,
              role: m.role as "user" | "assistant",
            })),
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTyping, scrollToBottom]);

  const playAssistantSentences = async (
    sessionId: number,
    sentences: string[],
    triggerTypo: boolean,
  ) => {
    const shouldContinue = () => isActiveSession(sessionId);

    const typoIndex =
      triggerTypo && sentences.length > 0
        ? Math.floor(Math.random() * sentences.length)
        : -1;

    for (let i = 0; i < sentences.length; i++) {
      if (!shouldContinue()) break;
      const sentence = sentences[i];

      setShowTyping(true);
      const ok = await interruptibleSleep(
        800 + Math.random() * 700,
        shouldContinue,
      );
      setShowTyping(false);
      if (!ok) break;

      const msgId = `live-${sessionId}-${Date.now()}-${i}`;

      if (i === typoIndex) {
        const { phases } = buildTypoSequence(sentence);
        const typoText = phases[0]?.text ?? sentence;

        setMessages((prev) => [
          ...prev,
          { id: msgId, role: "assistant", content: typoText },
        ]);

        const okTypo = await interruptibleSleep(
          400 + Math.random() * 400,
          shouldContinue,
        );
        if (!okTypo) break;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, content: sentence } : m,
          ),
        );
      } else {
        setMessages((prev) => [
          ...prev,
          { id: msgId, role: "assistant", content: sentence },
        ]);
      }

      if (i < sentences.length - 1) {
        const okPause = await interruptibleSleep(
          pauseBetweenSentences(sentence),
          shouldContinue,
        );
        if (!okPause) break;
      }
    }
  };

  const handleSend = async (
    text: string,
    image?: { base64: string; mimeType: string; previewUrl: string },
  ) => {
    const trimmed = text.trim();
    if (!trimmed && !image) return;

    interruptAssistant();
    const sessionId = sessionRef.current;

    setAssistantActive(true);

    const userMsg: MessageItem = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed || "[图片]",
      imageUrl: image
        ? toImageDataUrl(image.base64, image.mimeType)
        : null,
    };
    setMessages((prev) => [...prev, userMsg]);

    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: apiHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          content: trimmed,
          imageBase64: image?.base64,
          imageMimeType: image?.mimeType,
        }),
      });

      if (!isActiveSession(sessionId)) return;

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "发送失败");
      }

      const { sentences, triggerTypo, companionName, avatarUrl } = data as {
        sentences: string[];
        triggerTypo: boolean;
        companionName: string;
        avatarUrl: string;
      };

      setSettings((s) => ({
        ...s,
        companionName: companionName ?? s.companionName,
        avatarUrl: avatarUrl ?? s.avatarUrl,
      }));

      await playAssistantSentences(sessionId, sentences, triggerTypo);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      if (!isActiveSession(sessionId)) return;

      const err = e instanceof Error ? e.message : "出错了";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `嗯…好像出了点小问题：${err}。稍后再试试好吗？(｡•́︿•̀｡)`,
        },
      ]);
    } finally {
      if (isActiveSession(sessionId)) {
        setShowTyping(false);
        setAssistantActive(false);
        fetchAbortRef.current = null;
      }
    }
  };

  return (
    <section className="mx-auto flex h-[100dvh] max-w-lg flex-col bg-[var(--chat-bg)]">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--header-border)] bg-[var(--header-bg)] px-4 py-3">
        <section className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.avatarUrl || "/avatars/default.svg"}
            alt={settings.companionName}
            className="h-10 w-10 rounded-full object-cover"
          />
          <section>
            <h1 className="text-[17px] font-medium text-[var(--text-primary)]">
              {settings.companionName}
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              {assistantActive || showTyping ? "对方正在输入…" : "在线"}
            </p>
          </section>
        </section>
        <section className="flex items-center gap-1">
          <Link
            href="/history"
            className="rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-black/5"
            title="聊天记录与搜索"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <path d="M21 21l-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-black/5"
            title="设置"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.94-2.06a1 1 0 0 0 .2-1.09l-.8-2.2a1 1 0 0 1 .26-1.1l1.76-1.5a1 1 0 0 0 .12-1.36l-1.42-1.42a1 1 0 0 0-1.36-.12l-1.5 1.76a1 1 0 0 1-1.1.26l-2.2-.8a1 1 0 0 0-1.09.2l-1.68 1.45a1 1 0 0 0-.38 1v2.12a1 1 0 0 0 .38 1l1.68 1.45a1 1 0 0 0 1.09.2l2.2-.8a1 1 0 0 1 1.1.26l1.5 1.76a1 1 0 0 0 1.36-.12l1.42-1.42a1 1 0 0 0-.12-1.36l-1.76-1.5a1 1 0 0 1-.26-1.1l.8-2.2a1 1 0 0 0-.2-1.09L19.12 12a1 1 0 0 0 0-1.54l1.45-1.68Z" />
            </svg>
          </button>
        </section>
      </header>

      <main className="flex-1 overflow-y-auto py-3">
        {hasOlderMessages && !loading && (
          <Link
            href="/history"
            className="mx-3 mb-3 block rounded-md border border-[var(--input-border)] bg-white px-3 py-2.5 text-center text-sm text-[var(--text-secondary)] shadow-sm hover:bg-black/[0.02]"
          >
            仅显示最近 {CHAT_DISPLAY_LIMIT} 条（共 {messageTotal} 条）
            <span className="ml-1 text-[var(--accent)]">查看全部与搜索 →</span>
          </Link>
        )}
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
            加载记忆中…
          </p>
        ) : messages.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-base text-[var(--text-primary)]">
              嗨，我是{settings.companionName}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              有什么想聊的，随时跟我说
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              avatarUrl={settings.avatarUrl}
              companionName={settings.companionName}
            />
          ))
        )}
        {showTyping && <TypingIndicator />}
        <div ref={bottomRef} className="h-0" aria-hidden />
      </main>

      <ChatInput
        onSend={(t, img) => void handleSend(t, img)}
        companionReplying={assistantActive || showTyping}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSaved={setSettings}
      />
    </section>
  );
}
