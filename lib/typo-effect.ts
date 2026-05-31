/** 生成打错字再撤回的效果片段 */
export function buildTypoSequence(correctText: string): {
  phases: { text: string; pauseAfterMs: number; instant?: boolean }[];
} {
  if (correctText.length < 2) {
    return { phases: [{ text: correctText, pauseAfterMs: 0 }] };
  }

  const typoLen = Math.min(3, Math.max(1, Math.floor(correctText.length * 0.15)));
  const wrongChars = "的了是在有不这我那";
  let wrong = "";
  for (let i = 0; i < typoLen; i++) {
    wrong += wrongChars[Math.floor(Math.random() * wrongChars.length)];
  }

  const keepLen = Math.min(4, Math.max(1, correctText.length - typoLen));
  const partial = correctText.slice(0, keepLen);
  const typoPart = partial + wrong;

  return {
    phases: [
      { text: typoPart, pauseAfterMs: 300 + Math.random() * 500 },
      { text: partial, pauseAfterMs: 200, instant: true },
      { text: correctText, pauseAfterMs: 0 },
    ],
  };
}
