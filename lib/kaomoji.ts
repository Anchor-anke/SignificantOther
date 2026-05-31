const KAOMOJI_POOL = [
  "(◕‿◕✿)",
  "(*´▽`*)",
  "(｡•́︿•̀｡)",
  "╰(*°▽°*)╯",
  "(⁄ ⁄•⁄ω⁄•⁄ ⁄)",
  "(´･ω･`)",
  "(๑•̀ㅂ•́)و✧",
];

/** 文本里是否已有颜文字（含全角/半角括号表情） */
export function hasKaomoji(text: string): boolean {
  if (KAOMOJI_POOL.some((k) => text.includes(k))) return true;
  return /[（(][^）)]{0,20}[▽ω◕‿｡•́︿•̀°\*´][^）)]{0,12}[）)]/u.test(text);
}

/** 本轮应出现颜文字但模型没写时，在最后一句末尾补一个 */
export function ensureKaomojiInReplies(sentences: string[]): string[] {
  if (sentences.length === 0) return sentences;
  if (sentences.some((s) => hasKaomoji(s))) return sentences;

  const pick = KAOMOJI_POOL[Math.floor(Math.random() * KAOMOJI_POOL.length)];
  const last = sentences[sentences.length - 1].trim();
  const updated = `${last.replace(/[。！？…~～\s]+$/u, "")}${pick}`;

  return [...sentences.slice(0, -1), updated];
}
