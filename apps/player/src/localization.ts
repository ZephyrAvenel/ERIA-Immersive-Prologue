import en from "./locales/en.json" with { type: "json" };
import fr from "./locales/fr.json" with { type: "json" };

export interface LocaleMessages {
  readonly language: string;
  readonly engineTitle: string;
  readonly packLabel: string;
  readonly skipToNarrative: string;
  readonly navigationLabel: string;
  readonly previous: string;
  readonly next: string;
  readonly progressLabel: string;
  readonly progressText: string;
  readonly errorTitle: string;
  readonly errorMessage: string;
  readonly unknownError: string;
}

export const locales: Readonly<Record<string, LocaleMessages>> = {
  en,
  fr,
};

export function interpolate(template: string, values: Readonly<Record<string, string | number>>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function resolveLocale(language: string): LocaleMessages {
  const languageCode = language.toLowerCase().split("-")[0] ?? "en";
  const fallback = locales.en;
  if (!fallback) throw new Error("INE_LOCALE_FALLBACK_MISSING");
  return locales[languageCode] ?? fallback;
}
