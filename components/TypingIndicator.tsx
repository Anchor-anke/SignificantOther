export default function TypingIndicator({ label }: { label?: string }) {
  return (
    <section className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)]">
      <span>{label ?? "对方正在输入…"}</span>
      <span className="flex gap-1">
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-[#b2b2b2]" />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-[#b2b2b2]" />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-[#b2b2b2]" />
      </span>
    </section>
  );
}
