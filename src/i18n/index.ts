import polish from "./pl.json";
export type Locale = "en" | "pl";
export function localeFor(url: URL): Locale {
  return /^\/pl(?:\/|$)/.test(url.pathname) ? "pl" : "en";
}
export function localizedPath(path: string, locale: Locale): string {
  const base = path.replace(/^\/pl(?=\/|$)/, "") || "/";
  return locale === "pl" ? `/pl${base}` : base;
}
export function translate(locale: Locale, text: string): string {
  return locale === "pl" ? polish[text as keyof typeof polish] ?? text : text;
}
export function dateLabel(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale === "pl" ? "pl-PL" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
