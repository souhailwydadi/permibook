/**
 * Guarded localStorage access — a missing or blocked value (private
 * browsing, storage disabled) must never leave the app blank.
 * Every read is wrapped in try/catch and falls back to `fallback`.
 */
export function safeGet(key: string, fallback: string | null = null): string | null {
  try {
    if (typeof window === "undefined") return fallback;
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function safeSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — ignore, the app works without it.
  }
}

export function safeRemove(key: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}
