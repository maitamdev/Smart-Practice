import type { StoredAttempt } from "../types/quiz";

// v2 tách hoàn toàn dữ liệu production khỏi dữ liệu demo trước đây.
const ATTEMPT_KEY = "smart-practice-attempt-v2";
const THEME_KEY = "smart-practice-175q-theme";

export function loadAttempt(): StoredAttempt | null {
  try {
    const value = localStorage.getItem(ATTEMPT_KEY);
    return value ? (JSON.parse(value) as StoredAttempt) : null;
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: StoredAttempt): void {
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
}

export function clearAttempt(): void {
  localStorage.removeItem(ATTEMPT_KEY);
}

export function loadTheme(): "light" | "dark" | null {
  const value = localStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function saveTheme(theme: "light" | "dark"): void {
  localStorage.setItem(THEME_KEY, theme);
}
