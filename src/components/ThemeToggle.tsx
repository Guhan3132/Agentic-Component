"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

const KEY = "agentic-ui:theme";

/** Runs in <head> before the first paint: the saved choice, or the system setting when there is none. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

/** Whether the site is in dark mode right now, following the class on <html>. False on the server. */
export function useSiteDark() {
  return useSyncExternalStore(
    (notify) => {
      const o = new MutationObserver(notify);
      o.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => o.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

const saved = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

/** Light or dark for the whole site. Until you choose, it follows the system and keeps following it. */
export function ThemeToggle() {
  const dark = useSiteDark();

  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      if (!saved()) document.documentElement.classList.toggle("dark", media.matches);
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      // Choosing the same as the system goes back to following it.
      if (next === matchMedia("(prefers-color-scheme: dark)").matches) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:size-11"
    >
      {dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  );
}
