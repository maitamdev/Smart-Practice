import { useEffect } from "react";

export function useTheme() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
    localStorage.removeItem("smart-practice-175q-theme");
  }, []);

  return {
    theme: "light" as const,
    toggleTheme: () => undefined,
  };
}
