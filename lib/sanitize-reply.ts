/** 去掉句首括号内的动作/神态描写，如「(低头笑了笑)你好」 */
export function stripActionParentheses(text: string): string {
  let t = text.trim();
  let prev = "";
  while (t !== prev) {
    prev = t;
    t = t
      .replace(/^[（(][^）)]{1,28}[）)]\s*/u, "")
      .replace(/^\([^)]{1,28}\)\s*/, "")
      .trim();
  }
  return t;
}
