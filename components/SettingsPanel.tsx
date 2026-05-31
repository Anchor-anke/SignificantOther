"use client";

import { useEffect, useState } from "react";
import { PERSONALITY_OPTIONS } from "@/lib/personality";
import { apiHeaders, getUserId } from "@/lib/client-user";

export type SettingsData = {
  companionName: string;
  userNickname: string;
  personality: string;
  avatarUrl: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  settings: SettingsData;
  onSaved: (s: SettingsData) => void;
};

export default function SettingsPanel({ open, onClose, settings, onSaved }: Props) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(settings);
  }, [open, settings]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: apiHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("保存失败");
      const data = (await res.json()) as SettingsData;
      onSaved(data);
      onClose();
    } catch {
      alert("保存设置失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setForm((f) => ({ ...f, avatarUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[var(--panel-bg)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--header-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">伴侣设置</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-black/5"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <Field label="伴侣名称">
            <input
              value={form.companionName}
              onChange={(e) => setForm({ ...form, companionName: e.target.value })}
              className="input-field"
              placeholder="艾德里安"
            />
          </Field>

          <Field label="对你的称呼">
            <input
              value={form.userNickname}
              onChange={(e) => setForm({ ...form, userNickname: e.target.value })}
              className="input-field"
              placeholder="例如：小明、宝贝"
            />
          </Field>

          <Field label="伴侣性格">
            <div className="grid gap-2">
              {PERSONALITY_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className={`cursor-pointer rounded-lg border px-4 py-3 transition ${
                    form.personality === opt.key
                      ? "border-[var(--accent)] bg-[#e8f8ef]"
                      : "border-[var(--input-border)] bg-white hover:border-[#ccc]"
                  }`}
                >
                  <input
                    type="radio"
                    name="personality"
                    className="sr-only"
                    checked={form.personality === opt.key}
                    onChange={() => setForm({ ...form, personality: opt.key })}
                  />
                  <span className="font-medium text-[var(--text-primary)]">{opt.label}</span>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{opt.description}</p>
                </label>
              ))}
            </div>
          </Field>

          <Field label="伴侣头像">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.avatarUrl || "/avatars/default.svg"}
                alt="头像预览"
                className="h-16 w-16 rounded-md object-cover ring-1 ring-[var(--input-border)]"
              />
              <div className="flex flex-col gap-2 text-sm">
                <label className="cursor-pointer rounded-md bg-[#e8f8ef] px-3 py-2 text-center text-[var(--accent)] hover:bg-[#d4f0de]">
                  上传图片
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAvatar(f);
                    }}
                  />
                </label>
                <input
                  value={form.avatarUrl.startsWith("data:") ? "" : form.avatarUrl}
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                  className="input-field text-xs"
                  placeholder="或输入图片 URL"
                />
              </div>
            </div>
          </Field>
        </div>

        <section className="rounded-lg border border-[var(--input-border)] bg-white px-3 py-3 text-xs leading-relaxed text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)]">聊天记录说明</p>
          <p className="mt-1">
            记录保存在本机 <code className="text-[11px]">prisma/dev.db</code>
            ，并与当前浏览器的用户标识绑定。
          </p>
          <p className="mt-1">
            清除浏览器网站数据、换浏览器/无痕模式、重装项目或删除数据库文件，都会看不到以前的聊天。
          </p>
          <p className="mt-2 text-[11px] opacity-80">
            当前标识：{getUserId().slice(0, 8)}…
          </p>
        </section>

        <footer className="border-t border-[var(--header-border)] p-4">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="w-full rounded-md bg-[var(--accent)] py-3 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存设置"}
          </button>
        </footer>
      </aside>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">{label}</span>
      {children}
    </label>
  );
}
