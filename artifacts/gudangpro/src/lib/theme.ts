export const THEME_KEY = "gp_theme";

export function getTheme(): "dark" | "light" {
  try {
    return (localStorage.getItem(THEME_KEY) as "dark" | "light") ?? "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}
