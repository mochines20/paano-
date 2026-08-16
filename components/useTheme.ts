"use client";

import { useState } from "react";

type Theme = "dark" | "light";

/**
 * useTheme — dark/light toggle na may localStorage persistence.
 * Default: dark (PAANO's primary design). Ang inline script sa layout
 * ang nag-aapply ng class bago pa mag-hydrate, kaya walang FOUC.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("paano:theme") as Theme | null;
    return stored === "light" ? "light" : "dark";
  });

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const root = document.documentElement;
    if (next === "light") {
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
    }
    localStorage.setItem("paano:theme", next);
  }

  return { theme, toggle };
}
