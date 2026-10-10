import { useEffect, useState } from "react";
import { storageKey } from "./channel";

type Theme = "light" | "dark";

const STORAGE_KEY = storageKey("theme");
const QUERY = "(prefers-color-scheme: dark)";

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

/** Follows the system colour scheme until the user picks one explicitly. */
export default function useTheme() {
  const [chosen, setChosen] = useState<Theme | null>(readStoredTheme);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const theme: Theme = chosen ?? (systemDark ? "dark" : "light");

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setChosen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore unavailable storage; the choice still applies for this session.
    }
  };

  return { isDark: theme === "dark", toggle };
}
