"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ChatMessage, { type MessageItem } from "./ChatMessage";
import { apiHeaders } from "@/lib/client-user";
import { formatMessageTime, escapeRegExp } from "@/lib/format";
import type { SettingsData } from "./SettingsPanel";

const DEFAULT_SETTINGS: SettingsData = {
  companionName: "艾德里安",
  userNickname: "",
  personality: "soft",
  avatarUrl: "/avatars/default.svg",
};

function highlightContent(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-[#fff3a3] px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function ChatHistoryView() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPage = useCallback(
    async (q: string, nextOffset: number, append: boolean) => {
      const params = new URLSearchParams({
        offset: String(nextOffset),
        limit: "50",
      });
      if (q) params.set("q", q);

      const res = await fetch(`/api/messages/history?${params}`, {
        headers: apiHeaders(),
      });
      if (!res.ok) throw new Error("加载失败");

      const data = (await res.json()) as {
        messages: MessageItem[];
        total: number;
        hasMore: boolean;
        offset: number;
      };

      setTotal(data.total);
      setHasMore(data.hasMore);
      setOffset(data.offset + data.messages.length);

      setMessages((prev) => {
        const next = data.messages.map((m) => ({
          ...m,
          role: m.role as "user" | "assistant",
        }));
        if (!append) return next;
        const ids = new Set(prev.map((m) => m.id));
        const merged = [...next.filter((m) => !ids.has(m.id)), ...prev];
        return merged.sort(
          (a, b) =>
            new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime(),
        );
      });
    },
    [],
  );

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setOffset(0);
      try {
        const setRes = await fetch("/api/settings", { headers: apiHeaders() });
        if (setRes.ok) {
          const s = (await setRes.json()) as SettingsData;
          setSettings({ ...DEFAULT_SETTINGS, ...s });
        }
        await fetchPage(debouncedQ, 0, false);
      } catch {
        setMessages([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedQ, fetchPage]);

  const loadOlder = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(debouncedQ, offset, true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="mx-auto flex h-[100dvh] max-w-lg flex-col bg-[var(--chat-bg)]">
      <header className="shrink-0 border-b border-[var(--header-border)] bg-[var(--header-bg)] px-3 py-3">
        <section className="mb-3 flex items-center gap-2">
          <Link
            href="/"
            className="rounded-md px-2 py-1 text-sm text-[var(--accent)] hover:bg-black/5"
          >
            ← 返回聊天
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-medium text-[var(--text-primary)]">
            聊天记录
          </h1>
          <span className="w-16" />
        </section>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索聊天内容…"
          className="input-field w-full"
        />
        <p className="mt-2 text-center text-xs text-[var(--text-secondary)]">
          {debouncedQ
            ? `找到 ${total} 条相关记录`
            : `共 ${total} 条记录 · 从最新往更早翻阅`}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto py-3">
        {hasMore && !loading && (
          <section className="px-3 pb-3">
            <button
              type="button"
              onClick={() => void loadOlder()}
              disabled={loadingMore}
              className="w-full rounded-md border border-[var(--input-border)] bg-white py-2 text-sm text-[var(--text-secondary)] hover:bg-black/[0.02] disabled:opacity-50"
            >
              {loadingMore ? "加载中…" : "加载更早的消息"}
            </button>
          </section>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-[var(--text-secondary)]">
            加载中…
          </p>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--text-secondary)]">
            {debouncedQ ? "没有匹配的记录" : "还没有聊天记录"}
          </p>
        ) : debouncedQ ? (
          <section className="space-y-1">
            {messages.map((m) => (
              <section
                key={m.id}
                className="border-b border-[var(--header-border)]/60 px-3 py-3"
              >
                <p className="mb-1 text-xs text-[var(--text-secondary)]">
                  {m.role === "user" ? "我" : settings.companionName}
                  {m.createdAt ? ` · ${formatMessageTime(m.createdAt)}` : ""}
                </p>
                <p className="text-[15px] leading-relaxed text-[var(--text-primary)]">
                  {highlightContent(m.content, debouncedQ)}
                </p>
              </section>
            ))}
          </section>
        ) : (
          messages.map((m) => (
            <section key={m.id}>
              {m.createdAt && (
                <p className="my-2 text-center text-xs text-[var(--text-secondary)]">
                  {formatMessageTime(m.createdAt)}
                </p>
              )}
              <ChatMessage
                message={m}
                avatarUrl={settings.avatarUrl}
                companionName={settings.companionName}
              />
            </section>
          ))
        )}
      </main>
    </section>
  );
}
