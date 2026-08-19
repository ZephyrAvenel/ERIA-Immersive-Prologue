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
  readonly readScene: string;
  readonly contemplatePhase: string;
  readonly readPhase: string;
  readonly progressLabel: string;
  readonly progressText: string;
  readonly resumeTitle: string;
  readonly resumeDescription: string;
  readonly resumeAction: string;
  readonly restartAction: string;
  readonly errorTitle: string;
  readonly errorMessage: string;
  readonly unknownError: string;
  readonly homeTitle: string;
  readonly homeHeroTitle: string;
  readonly homeHeroDescription: string;
  readonly homePrompt: string;
  readonly libraryTitle: string;
  readonly libraryHeroTitle: string;
  readonly libraryHeroSignature: string;
  readonly libraryHeroDescription: string;
  readonly libraryDescription: string;
  readonly exploreWork: string;
  readonly libraryAction: string;
  readonly workshopsTitle: string;
  readonly workshopsHeroTitle: string;
  readonly workshopsDescription: string;
  readonly workshopsStatusPlanned: string;
  readonly workshopsNoAccess: string;
  readonly homeAction: string;
  readonly continueExploration: string;
  readonly workshopPackLabel: string;
  readonly workshopNavigationLabel: string;
  readonly workshopProgressLabel: string;
  readonly workshopExit: string;
  readonly workshopUnsupportedBlock: string;
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
