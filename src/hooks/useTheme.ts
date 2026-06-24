import { useEffect, useState } from "react";
import { loadTheme, saveTheme } from "../utils/storage";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = loadTheme();
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    saveTheme(theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
