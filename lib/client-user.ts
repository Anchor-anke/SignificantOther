const USER_KEY = "significant_other_user_id";

/** 兼容非 HTTPS / 旧浏览器：crypto.randomUUID 可能不存在 */
function createUserId(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }

  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function persistUserId(id: string) {
  localStorage.setItem(USER_KEY, id);
  sessionStorage.setItem(USER_KEY, id);
}

/**
 * 用户 ID 绑定本机浏览器。
 * 若 localStorage 被清空，会尝试从 sessionStorage 恢复，避免误当成新用户。
 */
export function getUserId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(USER_KEY);
  if (!id) {
    id = sessionStorage.getItem(USER_KEY);
    if (id) localStorage.setItem(USER_KEY, id);
  }

  if (!id) {
    id = createUserId();
    persistUserId(id);
  } else {
    sessionStorage.setItem(USER_KEY, id);
  }

  return id;
}

export function apiHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-user-id": getUserId(),
  };
}
