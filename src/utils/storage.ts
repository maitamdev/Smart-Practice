import type { StoredAttempt } from "../types/quiz";

// v2 tách hoàn toàn dữ liệu production khỏi dữ liệu demo trước đây.
const ATTEMPT_PREFIX = "smart-practice-attempt-v3:";
const LEGACY_ATTEMPT_KEY = "smart-practice-attempt-v2";
const THEME_KEY = "smart-practice-175q-theme";

const attemptKey = (quizId: string) =>
  `${ATTEMPT_PREFIX}${encodeURIComponent(quizId)}`;

export function loadAttempt(quizId: string): StoredAttempt | null {
  try {
    localStorage.removeItem(LEGACY_ATTEMPT_KEY);
    const key = attemptKey(quizId);
    const value = localStorage.getItem(key);
    if (!value || value.length > 5_000_000) {
      if (value) localStorage.removeItem(key);
      return null;
    }
    return value ? (JSON.parse(value) as StoredAttempt) : null;
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: StoredAttempt): void {
  localStorage.setItem(attemptKey(attempt.quizId), JSON.stringify(attempt));
}

export function clearAttempt(quizId: string): void {
  localStorage.removeItem(attemptKey(quizId));
}

export function loadTheme(): "light" | "dark" | null {
  const value = localStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function saveTheme(theme: "light" | "dark"): void {
  localStorage.setItem(THEME_KEY, theme);
}
