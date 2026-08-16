/**
 * ThemeController — One source of truth for the day/night world state.
 * The CSS `dark` class, `data-theme` attribute, and the collage scene both follow this store.
 */

const KEY = "boil-theme";
const listeners = new Set();
let current = "day"; // "day" | "night"

function apply(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isNight = theme === "night";
  root.classList.toggle("dark", isNight);
  root.dataset["labTheme"] = theme;
  root.setAttribute("data-theme", isNight ? "dark" : "parchment");
}

export function initTheme() {
  if (typeof window === "undefined") return "day";
  const saved = window.localStorage.getItem(KEY);
  const oldTheme = window.localStorage.getItem("rough-theme");
  
  if (saved === "night" || saved === "day") {
    current = saved;
  } else if (oldTheme === "dark") {
    current = "night";
  } else {
    current = "day";
  }

  apply(current);
  return current;
}

export function getTheme() {
  return current;
}

export function setTheme(theme) {
  if (theme === current) return;
  current = theme;
  apply(theme);
  try {
    window.localStorage.setItem(KEY, theme);
    window.localStorage.setItem("rough-theme", theme === "night" ? "dark" : "parchment");
  } catch {
    /* storage blocked */
  }
  listeners.forEach((fn) => fn(theme));
}

export function toggleTheme() {
  setTheme(current === "day" ? "night" : "day");
}

export function subscribeTheme(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
