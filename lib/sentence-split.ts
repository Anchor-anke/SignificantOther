/** 按中文标点智能分句，保留标点 */
export function splitSentences(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .trim();
  if (!normalized) return [];

  const parts: string[] = [];
  let buffer = "";

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    buffer += ch;

    const isBreak =
      /[。！？…]/.test(ch) ||
      (ch === "~" && buffer.length > 1) ||
      (ch === "!" && i > 0) ||
      (ch === "?" && i > 0);

    if (isBreak && buffer.trim()) {
      parts.push(buffer.trim());
      buffer = "";
    }
  }

  if (buffer.trim()) {
    parts.push(buffer.trim());
  }

  if (parts.length === 0) return [normalized];

  const merged: string[] = [];
  for (const p of parts) {
    if (
      merged.length > 0 &&
      p.length < 4 &&
      merged[merged.length - 1].length < 36
    ) {
      merged[merged.length - 1] += p;
    } else {
      merged.push(p);
    }
  }

  return merged;
}

/** 按逗号、分号拆成更短片段（用于补足气泡数） */
function splitByMinorPause(text: string): string[] {
  const t = text.trim();
  if (t.length < 10) return [t];

  const pieces = t
    .split(/(?<=[，,；;])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);

  if (pieces.length <= 1) return [t];
  return pieces;
}

/** 句子不足目标条数时，尝试按逗号拆长句补足 */
function expandToTarget(parts: string[], target: number): string[] {
  const result = [...parts];

  let guard = 0;
  while (result.length < target && guard < 12) {
    guard += 1;
    let splitDone = false;

    const idx = result.reduce(
      (best, s, i) => (s.length > (result[best]?.length ?? 0) ? i : best),
      0,
    );

    const subs = splitByMinorPause(result[idx]);
    if (subs.length > 1) {
      result.splice(idx, 1, ...subs);
      splitDone = true;
    }

    if (!splitDone) break;
  }

  return result.map((s) => trimBubble(s)).filter(Boolean);
}

/** 合并为指定条数上限 */
export function packForChatBubbles(
  sentences: string[],
  maxBubbles = 3,
): string[] {
  const cap = Math.min(5, Math.max(2, maxBubbles));
  if (sentences.length === 0) return [];
  if (sentences.length <= cap) {
    return sentences.map((s) => trimBubble(s));
  }

  const packed: string[] = [];
  const chunkSize = Math.ceil(sentences.length / cap);

  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize).join("");
    packed.push(trimBubble(chunk));
  }

  return packed.slice(0, cap);
}

/**
 * 解析模型回复为聊天气泡：
 * 1. 优先按换行（模型按「每行一条」输出）
 * 2. 不足目标条数则按逗号拆句补足；超出则合并
 */
export function parseAssistantBubbles(raw: string, target: number): string[] {
  const cap = Math.min(5, Math.max(2, target));
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const lines = trimmed
    .split(/\n+/)
    .map((l) => l.replace(/^[\s\-•*]+/, "").trim())
    .filter((l) => l.length > 0 && !/^[\[【]/.test(l));

  let parts: string[] =
    lines.length >= 2
      ? lines
      : splitSentences(trimmed.replace(/\n+/g, ""));

  parts = parts.map((s) => trimBubble(s)).filter((s) => s.length > 0);

  if (parts.length > cap) {
    parts = packForChatBubbles(parts, cap);
  } else if (parts.length < cap) {
    parts = expandToTarget(parts, cap);
  }

  if (parts.length === 0) {
    return [trimBubble(trimmed)];
  }

  return parts;
}

function trimBubble(text: string, maxLen = 48): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const lastPause = Math.max(
    cut.lastIndexOf("，"),
    cut.lastIndexOf("、"),
    cut.lastIndexOf("；"),
    cut.lastIndexOf(" "),
  );
  if (lastPause > 12) return cut.slice(0, lastPause + 1);
  return `${cut}…`;
}

export function pauseBetweenSentences(sentence: string): number {
  const len = sentence.length;
  if (len <= 12) return 1400 + Math.random() * 600;
  if (len <= 25) return 1800 + Math.random() * 700;
  return 2200 + Math.random() * 800;
}
