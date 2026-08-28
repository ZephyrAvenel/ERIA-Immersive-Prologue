import {
  DEFAULT_SCENE_TRANSITION,
  NarrativeEngine,
  detectPackFormat,
  getTransitionDirection,
  loadLivingCard,
  loadLivingCardPack,
  loadNarrativePack,
  loadPolarity,
  loadPolarityPack,
  loadWorkshopPack,
  type LivingCardPack,
  type NarrativeIntro,
  type NormalizedSceneTransition,
  type PolarityPack,
  type TransitionDirection,
  WorkshopEngine,
} from "@ine/core";
import {
  renderPlayer,
  renderPlayerWithTransition,
  renderLivingCard,
  renderPolarity,
  renderPolarityClosure,
  renderWorkshop,
} from "@ine/renderer";
import { createButton } from "@ine/ui";
import {
  validateLivingCard,
  validateNarrativePack,
  validatePolarity,
  validateWorkshopPack,
} from "@ine/validators";
import { interpolate, resolveLocale, type LocaleMessages } from "./localization";
import {
  createBrowserReadingProgressStore,
  createReadingProgress,
  resolveProgressSceneIndex,
} from "./progress";
import {
  createBrowserWorkshopProgressStore,
  createWorkshopProgress,
} from "./workshop-progress";
import {
  findRegistryEntryBySlug,
  loadCatalog,
  loadPackRegistry,
} from "./catalog";
import {
  augmentedWorkshops,
  editorialFamilies,
  findPublishedAugmentedWorkshopBySlug,
  type EditorialFamilyId,
  type LocalizedEditorialFamily,
  type PublishedAugmentedWorkshop,
} from "./editorial";
import { publishedReviewIssues } from "./review";
import { createBrowserPublicThresholdSession } from "./threshold-session";
import "./styles.css";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("INE_PLAYER_MOUNT_MISSING");
}

const mount = app;
type NavigationTarget = "previous" | "next";
type ResumeChoice = "resume" | "restart";
type NarrativeLayoutPhase = "image" | "text";
type WorkshopResponseValue = string | boolean;

interface PlayerConfiguration {
  readonly packUrl: string;
}

declare const __INE_BASE__: string;

const applicationBaseUrl = new URL(__INE_BASE__, globalThis.location.origin);
const registryUrl = new URL("packs/index.json", applicationBaseUrl);
const libraryUrl = new URL("bibliotheque/", applicationBaseUrl);
const reviewUrl = new URL("revue/", applicationBaseUrl);
const workshopsUrl = new URL("ateliers/", applicationBaseUrl);

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function updateShell(messages: LocaleMessages, packTitle?: string, includeEngineTitle = true): void {
  document.documentElement.lang = messages.language;
  document.title = packTitle
    ? includeEngineTitle
      ? `${packTitle} | ${messages.engineTitle}`
      : packTitle
    : messages.engineTitle;

  let skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
  if (!skipLink) {
    skipLink = document.createElement("a");
    skipLink.className = "skip-link";
    skipLink.href = "#scene";
    document.body.prepend(skipLink);
  }
  skipLink.textContent = messages.skipToNarrative;
}

function updateLibraryNavigation(messages: LocaleMessages, visible: boolean): void {
  document.querySelector(".site-navigation")?.remove();
  if (!visible) return;

  const navigation = document.createElement("nav");
  navigation.className = "site-navigation";
  navigation.setAttribute("aria-label", messages.libraryAction);
  const link = document.createElement("a");
  link.href = libraryUrl.href;
  link.setAttribute("aria-label", messages.libraryAction);
  link.title = messages.libraryAction;

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("site-navigation__icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  const book = document.createElementNS("http://www.w3.org/2000/svg", "path");
  book.setAttribute(
    "d",
    "M3.5 5.5c2.8-.8 5.6-.2 8.5 1.8v11c-2.9-2-5.7-2.6-8.5-1.8v-11Zm17 0c-2.8-.8-5.6-.2-8.5 1.8v11c2.9-2 5.7-2.6 8.5-1.8v-11Z",
  );
  icon.append(book);

  const label = document.createElement("span");
  label.className = "site-navigation__label";
  label.textContent = messages.libraryAction;
  link.append(icon, label);
  navigation.append(link);
  document.body.append(navigation);
}

function createLibraryLink(label: string, className: string): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = className;
  link.href = libraryUrl.href;
  link.textContent = label;
  return link;
}

function resolveApplicationRoute(route: string): string {
  return new URL(route.replace(/^\//, ""), applicationBaseUrl).href;
}

function resolveReviewCoverImage(coverImage: string): string {
  return /^https:\/\//.test(coverImage) ? coverImage : resolveApplicationRoute(coverImage);
}

function renderResumePrompt(
  messages: LocaleMessages,
  sceneIndex: number,
  sceneCount: number,
): Promise<ResumeChoice> {
  mount.removeAttribute("aria-busy");
  mount.replaceChildren();

  const panel = document.createElement("section");
  panel.className = "resume-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "resume-title");
  panel.setAttribute("aria-describedby", "resume-description");

  const title = document.createElement("h1");
  title.id = "resume-title";
  title.textContent = messages.resumeTitle;

  const description = document.createElement("p");
  description.id = "resume-description";
  description.textContent = interpolate(messages.resumeDescription, {
    current: sceneIndex + 1,
    total: sceneCount,
  });

  const actions = document.createElement("div");
  actions.className = "resume-panel__actions";

  return new Promise((resolve) => {
    let resolved = false;
    const settle = (choice: ResumeChoice): void => {
      if (resolved) return;
      resolved = true;
      resolve(choice);
    };

    const resume = createButton(messages.resumeAction, () => {
      settle("resume");
    });
    resume.dataset.resumeAction = "resume";

    const restart = createButton(messages.restartAction, () => {
      settle("restart");
    });
    restart.dataset.resumeAction = "restart";

    actions.append(resume, restart);
    panel.append(title, description, actions);
    mount.append(panel);
    resume.focus();
  });
}

async function waitForOptionalAnimation(element: HTMLElement, durationMs: number): Promise<void> {
  if (prefersReducedMotion() || typeof element.animate !== "function") return;

  const animation = element.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: durationMs,
    easing: "ease-in-out",
    fill: "both",
  });
  const fallback = new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, durationMs + 50);
  });
  await Promise.race([animation.finished.then(() => undefined), fallback]).catch(() => undefined);
}

async function renderPrologue(
  intro: NarrativeIntro,
  packTitle: string,
  cover?: { readonly image: string; readonly imageAlt: string },
): Promise<void> {
  mount.removeAttribute("aria-busy");
  mount.replaceChildren();

  const section = document.createElement("section");
  section.className = "prologue";
  section.setAttribute("aria-labelledby", "prologue-title");

  const content = document.createElement("div");
  content.className = "prologue__content";

  if (cover) {
    const image = document.createElement("img");
    image.className = "prologue__cover";
    image.src = cover.image;
    image.alt = cover.imageAlt;
    section.append(image);
  }

  intro.lines.forEach((line, index) => {
    const paragraph = document.createElement("p");
    paragraph.className = "prologue__line";
    paragraph.textContent = line;
    paragraph.style.setProperty("--line-delay", `${2_200 + index * 600}ms`);
    content.append(paragraph);
  });

  const title = document.createElement("h1");
  title.id = "prologue-title";
  title.className = "prologue__title";
  title.textContent = intro.title ?? packTitle;

  const enter = createButton(intro.actionLabel, () => {
    section.dispatchEvent(new CustomEvent("ine:intro-enter"));
  });

  content.append(title, enter);
  section.append(content);
  mount.append(section);
  enter.focus();

  await new Promise<void>((resolve) => {
    section.addEventListener("ine:intro-enter", () => resolve(), { once: true });
  });
  mount.setAttribute("aria-busy", "true");
  section.classList.add("prologue--leaving");
  await waitForOptionalAnimation(section, 650);
}

function requestedWorkSlug(): string | null {
  const basePath = applicationBaseUrl.pathname.endsWith("/")
    ? applicationBaseUrl.pathname
    : `${applicationBaseUrl.pathname}/`;
  if (!globalThis.location.pathname.startsWith(basePath)) return null;
  const relativePath = globalThis.location.pathname.slice(basePath.length);
  const match = /^oeuvres\/([^/]+)\/?$/.exec(relativePath);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function requestedWorkshopSlug(): string | null {
  const basePath = applicationBaseUrl.pathname.endsWith("/")
    ? applicationBaseUrl.pathname
    : `${applicationBaseUrl.pathname}/`;
  if (!globalThis.location.pathname.startsWith(basePath)) return null;
  const relativePath = globalThis.location.pathname.slice(basePath.length);
  const match = /^ateliers\/([^/]+)\/?$/.exec(relativePath);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function isLibraryRoute(): boolean {
  const path = globalThis.location.pathname;
  return path === libraryUrl.pathname || path === libraryUrl.pathname.replace(/\/$/, "");
}

function isWorkshopsRoute(): boolean {
  const path = globalThis.location.pathname;
  return path === workshopsUrl.pathname || path === workshopsUrl.pathname.replace(/\/$/, "");
}

function isReviewRoute(): boolean {
  const path = globalThis.location.pathname;
  return path === reviewUrl.pathname || path === reviewUrl.pathname.replace(/\/$/, "");
}

function isHomeRoute(): boolean {
  const path = globalThis.location.pathname;
  return path === applicationBaseUrl.pathname || path === applicationBaseUrl.pathname.replace(/\/$/, "");
}

async function loadPlayerConfiguration(): Promise<PlayerConfiguration> {
  const requestedPack = new URL(globalThis.location.href).searchParams.get("pack");
  if (requestedPack) return { packUrl: requestedPack };

  const workSlug = requestedWorkSlug();
  if (workSlug) {
    const registry = await loadPackRegistry(registryUrl);
    const entry = findRegistryEntryBySlug(registry, workSlug);
    if (!entry) throw new Error("INE_PACK_ROUTE_NOT_FOUND");
    return { packUrl: new URL(entry.manifest, registryUrl).href };
  }

  const workshopSlug = requestedWorkshopSlug();
  if (workshopSlug) {
    const workshop = findPublishedAugmentedWorkshopBySlug(workshopSlug);
    if (!workshop) throw new Error("INE_WORKSHOP_ROUTE_NOT_FOUND");
    return { packUrl: resolveApplicationRoute(workshop.manifest) };
  }

  const response = await fetch(new URL("player.config.json", document.baseURI));
  if (!response.ok) {
    throw new Error("INE_PLAYER_CONFIGURATION_REQUEST_FAILED");
  }

  const value: unknown = await response.json();
  if (
    typeof value !== "object" ||
    value === null ||
    !("packUrl" in value) ||
    typeof value.packUrl !== "string" ||
    value.packUrl.length === 0
  ) {
    throw new Error("INE_PLAYER_CONFIGURATION_INVALID");
  }

  return { packUrl: value.packUrl };
}

function findEditorialFamily(
  families: readonly LocalizedEditorialFamily[],
  id: EditorialFamilyId,
): LocalizedEditorialFamily {
  const family = families.find((candidate) => candidate.id === id);
  if (!family) throw new Error("INE_EDITORIAL_FAMILY_MISSING");
  return family;
}

async function loadHomeNarrativeIntro(): Promise<{
  readonly intro: NarrativeIntro;
  readonly packLanguage: string;
  readonly packTitle: string;
} | null> {
  const registry = await loadPackRegistry(registryUrl);
  const entry = registry.packs.find(({ id }) => id === registry.home);
  if (!entry) throw new Error("INE_PACK_REGISTRY_HOME_MISSING");
  const pack = await loadNarrativePack(new URL(entry.manifest, registryUrl), validateNarrativePack);
  if (!pack.presentation?.intro) return null;
  return { intro: pack.presentation.intro, packLanguage: pack.language, packTitle: pack.title };
}

async function renderHome(focusFirstAction = false): Promise<void> {
  const messages = resolveLocale(navigator.language);
  const families = editorialFamilies(messages.language);
  updateShell(messages, messages.homeTitle, false);
  updateLibraryNavigation(messages, false);
  const skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
  if (skipLink) {
    skipLink.href = "#orientations";
    skipLink.textContent = messages.skipToNarrative;
  }
  mount.removeAttribute("aria-busy");
  mount.replaceChildren();

  const home = document.createElement("section");
  home.id = "orientations";
  home.className = "home";
  home.setAttribute("aria-labelledby", "home-title");

  const header = document.createElement("header");
  header.className = "home__header";
  const title = document.createElement("h1");
  title.id = "home-title";
  title.textContent = messages.homeHeroTitle;
  const description = document.createElement("p");
  description.className = "home__description";
  description.textContent = messages.homeHeroDescription;
  const prompt = document.createElement("p");
  prompt.className = "home__prompt";
  prompt.textContent = messages.homePrompt;
  header.append(title, description, prompt);

  const doors = document.createElement("div");
  doors.className = "home__doors";
  for (const family of families) {
    const article = document.createElement("article");
    article.className = "orientation-door";
    article.dataset.family = family.id;
    const orientation = document.createElement("p");
    orientation.className = "orientation-door__orientation";
    orientation.textContent = family.orientation;
    const familyTitle = document.createElement("h2");
    familyTitle.textContent = family.title;
    const familyDescription = document.createElement("p");
    familyDescription.textContent = family.description;
    const link = document.createElement("a");
    link.className = "orientation-door__action";
    link.href = resolveApplicationRoute(family.route);
    link.textContent = messages.homeAction;
    link.setAttribute("aria-label", `${messages.homeAction} — ${family.orientation}, ${family.title}`);
    article.append(orientation, familyTitle, familyDescription, link);
    doors.append(article);
  }

  home.append(header, doors);
  mount.append(home);

  if (focusFirstAction) {
    home.querySelector<HTMLAnchorElement>(".orientation-door__action")?.focus();
  }
}

async function renderPublicThreshold(): Promise<void> {
  const thresholdSession = createBrowserPublicThresholdSession();
  if (thresholdSession.hasCrossed()) {
    await renderHome();
    return;
  }

  const threshold = await loadHomeNarrativeIntro();
  if (!threshold) {
    await renderHome();
    return;
  }

  const messages = resolveLocale(threshold.packLanguage);
  updateShell(messages, threshold.intro.title ?? threshold.packTitle, false);
  await renderPrologue(threshold.intro, threshold.packTitle);
  thresholdSession.markCrossed();
  await renderHome(true);
}

async function renderWorkshops(): Promise<void> {
  const messages = resolveLocale(navigator.language);
  const families = editorialFamilies(messages.language);
  const family = findEditorialFamily(families, "augmented-workshops");
  const workshops = augmentedWorkshops(messages.language);
  updateShell(messages, messages.workshopsTitle);
  updateLibraryNavigation(messages, true);
  const skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
  if (skipLink) {
    skipLink.href = "#workshops";
    skipLink.textContent = messages.skipToNarrative;
  }
  mount.removeAttribute("aria-busy");
  mount.replaceChildren();

  const section = document.createElement("section");
  section.id = "workshops";
  section.className = "workshops";
  section.setAttribute("aria-labelledby", "workshops-title");

  const header = document.createElement("header");
  header.className = "workshops__header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "workshops__eyebrow";
  eyebrow.textContent = `${family.orientation} · ${family.title}`;
  const title = document.createElement("h1");
  title.id = "workshops-title";
  title.textContent = messages.workshopsHeroTitle;
  const description = document.createElement("p");
  description.textContent = messages.workshopsDescription;
  header.append(eyebrow, title, description);

  const grid = document.createElement("div");
  grid.className = "workshops__grid";
  for (const workshop of workshops) {
    const article = document.createElement("article");
    article.className = "workshop-card";
    article.dataset.workshopId = workshop.id;
    article.dataset.status = workshop.status;
    const cardContent =
      workshop.status === "published" && workshop.slug ? document.createElement("a") : article;
    if (cardContent instanceof HTMLAnchorElement) {
      cardContent.className = "workshop-card__link";
      cardContent.href = resolveApplicationRoute(`ateliers/${workshop.slug}/`);
      article.append(cardContent);
    }
    if (workshop.status === "published" && workshop.coverImage) {
      const figure = document.createElement("figure");
      figure.className = "workshop-card__cover";
      const image = document.createElement("img");
      image.src = resolveApplicationRoute(workshop.coverImage);
      image.alt = workshop.coverImageAlt ?? "";
      image.loading = "lazy";
      image.decoding = "async";
      figure.append(image);
      cardContent.append(figure);
    }
    const status = document.createElement("p");
    status.className = "workshop-card__status";
    status.textContent =
      workshop.status === "published" ? messages.workshopsStatusPublished : messages.workshopsStatusPlanned;
    const orientation = document.createElement("p");
    orientation.className = "workshop-card__orientation";
    orientation.textContent = workshop.orientation;
    const workshopTitle = document.createElement("h2");
    workshopTitle.textContent = workshop.title;
    const workshopDescription = document.createElement("p");
    workshopDescription.textContent = workshop.description;
    const access = document.createElement("p");
    access.className = "workshop-card__access";
    access.textContent =
      workshop.status === "published" ? messages.workshopsPublishedAccessPending : messages.workshopsNoAccess;
    cardContent.append(status, orientation, workshopTitle, workshopDescription, access);
    grid.append(article);
  }

  section.append(header, grid);
  mount.append(section);
}

async function renderReview(): Promise<void> {
  const messages = resolveLocale(navigator.language);
  const family = findEditorialFamily(editorialFamilies(messages.language), "living-review");
  const issues = publishedReviewIssues();
  updateShell(messages, messages.reviewTitle);
  updateLibraryNavigation(messages, true);
  const skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
  if (skipLink) {
    skipLink.href = "#review";
    skipLink.textContent = messages.skipToNarrative;
  }
  mount.removeAttribute("aria-busy");
  mount.replaceChildren();

  const section = document.createElement("section");
  section.id = "review";
  section.className = "review";
  section.setAttribute("aria-labelledby", "review-title");

  const header = document.createElement("header");
  header.className = "review__header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "review__eyebrow";
  eyebrow.textContent = `${family.orientation} · ${family.title}`;
  const title = document.createElement("h1");
  title.id = "review-title";
  title.textContent = messages.reviewHeroTitle;
  const description = document.createElement("p");
  description.textContent = messages.reviewDescription;
  header.append(eyebrow, title, description);

  const grid = document.createElement("div");
  grid.className = "review__grid";
  for (const issue of issues) {
    const article = document.createElement("article");
    article.className = "review-card";
    article.dataset.reviewIssueId = issue.id;
    article.dataset.reviewIssueNumber = String(issue.number);

    const link = document.createElement("a");
    link.className = "review-card__link";
    link.href = issue.url;

    if (issue.coverImage) {
      const figure = document.createElement("figure");
      figure.className = "review-card__cover";
      const image = document.createElement("img");
      image.src = resolveReviewCoverImage(issue.coverImage);
      image.alt = issue.coverImageAlt;
      image.loading = "lazy";
      image.decoding = "async";
      figure.append(image);
      link.append(figure);
    } else {
      const coverFallback = document.createElement("div");
      coverFallback.className = "review-card__cover review-card__cover--typographic";
      coverFallback.setAttribute("role", "img");
      coverFallback.setAttribute("aria-label", issue.coverImageAlt);
      const coverLabel = document.createElement("span");
      coverLabel.textContent = `N°${String(issue.number).padStart(2, "0")}`;
      coverFallback.append(coverLabel);
      link.append(coverFallback);
    }

    const issueNumber = document.createElement("p");
    issueNumber.className = "review-card__number";
    issueNumber.textContent = `N°${String(issue.number).padStart(2, "0")}`;
    const issueTitle = document.createElement("h2");
    issueTitle.textContent = issue.title;
    const subtitle = document.createElement("p");
    subtitle.className = "review-card__subtitle";
    subtitle.textContent = issue.subtitle ?? messages.reviewIssueFallbackSubtitle;
    const access = document.createElement("p");
    access.className = "review-card__access";
    access.textContent = messages.reviewIssueAccess;
    link.setAttribute("aria-label", `${messages.reviewIssueAccess} — N°${String(issue.number).padStart(2, "0")}, ${issue.title}`);
    link.append(issueNumber, issueTitle, subtitle, access);
    article.append(link);
    grid.append(article);
  }

  section.append(header, grid);
  mount.append(section);
}

async function renderLibrary(): Promise<void> {
  const messages = resolveLocale(navigator.language);
  const narrativeFamily = findEditorialFamily(editorialFamilies(messages.language), "narrative-packs");
  const registry = await loadPackRegistry(registryUrl);
  const packs = await loadCatalog(registryUrl);
  const thresholdSession = createBrowserPublicThresholdSession();
  updateShell(messages, messages.libraryTitle);
  updateLibraryNavigation(messages, false);
  const skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
  if (skipLink) {
    skipLink.href = "#works";
    skipLink.textContent = messages.skipToNarrative;
  }
  mount.removeAttribute("aria-busy");
  mount.replaceChildren();

  const library = document.createElement("section");
  library.id = "works";
  library.className = "library";
  library.setAttribute("aria-labelledby", "library-title");

  const header = document.createElement("header");
  header.className = "library__header";
  const heroEyebrow = document.createElement("p");
  heroEyebrow.className = "library__eyebrow";
  heroEyebrow.textContent = `${narrativeFamily.orientation} · ${narrativeFamily.title}`;
  const title = document.createElement("h1");
  title.id = "library-title";
  title.textContent = messages.libraryHeroTitle;
  const signature = document.createElement("p");
  signature.className = "library__signature";
  signature.textContent = messages.libraryHeroSignature;
  const orientation = document.createElement("p");
  orientation.className = "library__orientation";
  orientation.textContent = messages.libraryHeroDescription;
  const description = document.createElement("p");
  description.className = "library__prompt";
  description.textContent = messages.libraryDescription;
  header.append(heroEyebrow, title, signature, orientation, description);

  const grid = document.createElement("div");
  grid.className = "library__grid";
  for (const pack of packs) {
    const article = document.createElement("article");
    article.className = "work-card";
    article.dataset.workSlug = pack.slug;
    const image = document.createElement("img");
    image.className = "work-card__image";
    image.src = pack.coverImage;
    image.alt = pack.coverImageAlt;
    image.loading = "lazy";
    const content = document.createElement("div");
    content.className = "work-card__content";
    const workTitle = document.createElement("h2");
    workTitle.textContent = pack.title;
    const subtitle = document.createElement("p");
    subtitle.className = "work-card__subtitle";
    subtitle.textContent = pack.subtitle;
    const summary = document.createElement("p");
    summary.textContent = pack.description;
    const link = document.createElement("a");
    link.className = "work-card__action";
    link.href = new URL(`oeuvres/${pack.slug}/`, applicationBaseUrl).href;
    link.textContent = messages.exploreWork;
    link.setAttribute("aria-label", `${messages.exploreWork} - ${pack.title}`);
    if (pack.id === registry.home && thresholdSession.hasCrossed()) {
      link.addEventListener("click", () => {
        thresholdSession.markHomeIntroSkippedOnce();
      });
    }
    content.append(workTitle, subtitle, summary, link);
    article.append(image, content);
    grid.append(article);
  }

  library.append(header, grid);
  mount.append(library);
}

async function shouldSkipHomeIntroForCurrentRoute(packId: string): Promise<boolean> {
  const requestedPack = new URL(globalThis.location.href).searchParams.get("pack");
  if (requestedPack) return false;

  const workSlug = requestedWorkSlug();
  if (!workSlug) return false;

  const registry = await loadPackRegistry(registryUrl);
  if (registry.home !== packId) return false;

  const entry = findRegistryEntryBySlug(registry, workSlug);
  if (!entry || entry.id !== packId) return false;

  const thresholdSession = createBrowserPublicThresholdSession();
  if (!thresholdSession.hasCrossed()) return false;

  return thresholdSession.consumeHomeIntroSkip();
}

async function startNarrativePack(packUrl: URL): Promise<void> {
  const pack = await loadNarrativePack(packUrl, validateNarrativePack);
  const engine = new NarrativeEngine(pack);
  const messages = resolveLocale(pack.language);
  const progressStore = createBrowserReadingProgressStore();
  const intro = pack.presentation?.intro;
  updateShell(messages, pack.title);
  updateLibraryNavigation(messages, true);
  let transitionInProgress = false;
  const usesImageThenText = pack.layout === "image-then-text";
  let layoutPhase: NarrativeLayoutPhase = usesImageThenText ? "image" : "text";

  const canNavigatePrevious = (): boolean =>
    usesImageThenText ? layoutPhase === "text" || engine.canGoPrevious : engine.canGoPrevious;

  const canNavigateNext = (): boolean =>
    usesImageThenText ? layoutPhase === "image" || engine.canGoNext : engine.canGoNext;

  const progressTextForCurrentState = (): string => {
    const baseProgress = interpolate(messages.progressText, {
      current: engine.currentSceneIndex + 1,
      total: engine.sceneCount,
    });
    if (!usesImageThenText) return baseProgress;
    const phase = layoutPhase === "image" ? messages.contemplatePhase : messages.readPhase;
    return `${baseProgress} — ${phase}`;
  };

  const saveCurrentProgress = (): void => {
    progressStore.save(
      createReadingProgress({
        packId: pack.id,
        packVersion: pack.version,
        sceneId: engine.currentScene.id,
        sceneIndex: engine.currentSceneIndex,
        completed: !engine.canGoNext,
      }),
    );
  };

  const updateControlAvailability = (): void => {
    const previous = mount.querySelector<HTMLButtonElement>('[data-navigation="previous"]');
    const next = mount.querySelector<HTMLButtonElement>('[data-navigation="next"]');
    if (previous) previous.disabled = transitionInProgress || !canNavigatePrevious();
    if (next) next.disabled = transitionInProgress || !canNavigateNext();
  };

  const disableCurrentControls = (): void => {
    for (const button of mount.querySelectorAll<HTMLButtonElement>(".player button")) {
      button.disabled = true;
    }
  };

  const focusNavigationControl = (focusTarget: NavigationTarget): void => {
    const preferredTarget = mount.querySelector<HTMLButtonElement>(`[data-navigation="${focusTarget}"]`);
    const continuation = mount.querySelector<HTMLAnchorElement>("[data-library-continuation]");
    const fallbackTarget = mount.querySelector<HTMLButtonElement>(
      `[data-navigation="${focusTarget === "previous" ? "next" : "previous"}"]`,
    );
    const target = preferredTarget && !preferredTarget.disabled
      ? preferredTarget
      : focusTarget === "next" && continuation
        ? continuation
        : fallbackTarget;
    if (target && (!("disabled" in target) || !target.disabled)) target.focus();
  };

  const focusFirstAvailableNavigationControl = (): void => {
    const next = mount.querySelector<HTMLButtonElement>('[data-navigation="next"]');
    const previous = mount.querySelector<HTMLButtonElement>('[data-navigation="previous"]');
    const target = next && !next.disabled ? next : previous;
    if (target && !target.disabled) target.focus();
  };

  const render = async (
    focusTarget?: NavigationTarget,
    transition: NormalizedSceneTransition = DEFAULT_SCENE_TRANSITION,
    direction: TransitionDirection = "none",
  ): Promise<void> => {
    const scene = engine.currentScene;
    const controls = document.createElement("nav");
    controls.className = "player-controls";
    controls.setAttribute("aria-label", messages.navigationLabel);

    const previous = createButton(messages.previous, () => {
      void navigate("previous");
    });
    previous.dataset.navigation = "previous";
    previous.disabled = transitionInProgress || !canNavigatePrevious();

    const nextLabel = usesImageThenText && layoutPhase === "image" ? messages.readScene : messages.next;
    const next = createButton(nextLabel, () => {
      void navigate("next");
    });
    next.dataset.navigation = "next";
    next.disabled = transitionInProgress || !canNavigateNext();

    controls.append(previous, next);
    if (!engine.canGoNext && (!usesImageThenText || layoutPhase === "text")) {
      const continuation = createLibraryLink(
        messages.continueExploration,
        "journey-continuation",
      );
      continuation.dataset.libraryContinuation = "true";
      controls.append(continuation);
    }
    const sceneIndex = engine.currentSceneIndex;
    const sceneCount = engine.sceneCount;
    const state = {
      pack,
      scene,
      sceneIndex,
      sceneCount,
      controls,
      layout: pack.layout,
      layoutPhase: usesImageThenText ? layoutPhase : undefined,
      messages: {
        engineTitle: messages.engineTitle,
        packLabel: messages.packLabel,
        progressLabel: messages.progressLabel,
        progressText: progressTextForCurrentState(),
      },
    };

    if (transitionInProgress) {
      await renderPlayerWithTransition(mount, state, {
        transition,
        direction,
        reduceMotion: prefersReducedMotion(),
      });
    } else {
      renderPlayer(mount, state);
      mount.removeAttribute("aria-busy");
    }
    updateControlAvailability();
    if (focusTarget) focusNavigationControl(focusTarget);
  };

  const navigate = async (target: NavigationTarget): Promise<void> => {
    if (transitionInProgress) return;
    if (target === "previous" && !canNavigatePrevious()) return;
    if (target === "next" && !canNavigateNext()) return;

    const previousIndex = engine.currentSceneIndex;
    const targetIndex = usesImageThenText && target === "previous" && layoutPhase === "text"
      ? previousIndex
      : usesImageThenText && target === "next" && layoutPhase === "image"
        ? previousIndex
        : target === "next"
          ? previousIndex + 1
          : previousIndex - 1;
    const transition = engine.transitionForSceneIndex(targetIndex);
    let navigationSucceeded = false;

    transitionInProgress = true;
    disableCurrentControls();
    mount.setAttribute("aria-busy", "true");
    try {
      if (usesImageThenText && target === "next" && layoutPhase === "image") {
        layoutPhase = "text";
      } else if (usesImageThenText && target === "previous" && layoutPhase === "text") {
        layoutPhase = "image";
      } else if (target === "next") {
        engine.next();
        if (usesImageThenText) layoutPhase = "image";
      } else {
        engine.previous();
        if (usesImageThenText) layoutPhase = "text";
      }
      await render(target, transition, getTransitionDirection(previousIndex, engine.currentSceneIndex));
      navigationSucceeded = true;
    } catch {
      renderPlayer(mount, {
        pack,
        scene: engine.currentScene,
        sceneIndex: engine.currentSceneIndex,
        sceneCount: engine.sceneCount,
        controls: document.createElement("nav"),
        messages: {
          engineTitle: messages.engineTitle,
          packLabel: messages.packLabel,
          progressLabel: messages.progressLabel,
          progressText: progressTextForCurrentState(),
        },
        layout: pack.layout,
        layoutPhase: usesImageThenText ? layoutPhase : undefined,
      });
    } finally {
      transitionInProgress = false;
      mount.removeAttribute("aria-busy");
      updateControlAvailability();
      focusNavigationControl(target);
      if (navigationSucceeded) saveCurrentProgress();
    }
  };

  const savedProgress = progressStore.load(pack.id);
  let resumableProgress = savedProgress;
  let savedSceneIndex: number | null = null;
  if (resumableProgress && resumableProgress.packVersion === pack.version) {
    savedSceneIndex = resolveProgressSceneIndex(resumableProgress, pack.scenes);
    if (savedSceneIndex === null) {
      progressStore.clear(pack.id);
      resumableProgress = null;
    }
  } else if (resumableProgress) {
    progressStore.clear(pack.id);
    resumableProgress = null;
  }

  const skipIntro = intro ? await shouldSkipHomeIntroForCurrentRoute(pack.id) : false;

  if (intro && !skipIntro) {
    await renderPrologue(intro, pack.title);
  }

  if (
    resumableProgress &&
    savedSceneIndex !== null &&
    savedSceneIndex !== engine.currentSceneIndex
  ) {
    const choice = await renderResumePrompt(messages, savedSceneIndex, engine.sceneCount);
    if (choice === "resume") {
      engine.goToScene(resumableProgress.sceneId);
      await render();
      saveCurrentProgress();
      focusFirstAvailableNavigationControl();
      return;
    }
    progressStore.clear(pack.id);
  }

  await render();
  if (intro) {
    saveCurrentProgress();
    focusFirstAvailableNavigationControl();
  }
}

async function startPolarityPack(packUrl: URL): Promise<void> {
  const pack: PolarityPack = await loadPolarityPack(packUrl);
  const messages = resolveLocale(pack.language);
  updateShell(messages, pack.title);
  updateLibraryNavigation(messages, true);
  const skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
  if (skipLink) skipLink.href = "#polarity";
  let loading = false;

  const showClosing = (): void => {
    globalThis.history.replaceState(null, "", "#closing");
    renderPolarityClosure(mount, {
      image: pack.closingImage,
      imageAlt: pack.closingImageAlt,
      backLabel: pack.closingBackAction,
      continueLabel: messages.continueExploration,
      continueHref: libraryUrl.href,
      onBack: () => void showJourney(),
    });
  };

  const showPolarity = async (id: string): Promise<void> => {
    if (loading) return;
    const item = pack.polarities.find((candidate) => candidate.id === id);
    if (!item) throw new Error("INE_POLARITY_NOT_FOUND");
    loading = true;
    mount.setAttribute("aria-busy", "true");
    try {
      const loadedPolarity = await loadPolarity(new URL(item.source), validatePolarity);
      const polarity = { ...loadedPolarity, article: pack.articleUrl };
      const previousExists =
        polarity.previous !== null &&
        pack.polarities.some((candidate) => candidate.id === polarity.previous);
      const nextExists =
        polarity.next !== null &&
        pack.polarities.some((candidate) => candidate.id === polarity.next);
      renderPolarity(mount, {
        polarity,
        fallbackImage: pack.fallbackImage,
        fallbackImageAlt: pack.fallbackImageAlt,
        landmarkLabel: pack.landmarkLabel,
        onPrevious: previousExists && polarity.previous
          ? () => void showPolarity(polarity.previous as string)
          : undefined,
        onNext: nextExists && polarity.next
          ? () => void showPolarity(polarity.next as string)
          : undefined,
        closingLabel: polarity.next === null ? pack.closingAction : undefined,
        onClosing: polarity.next === null ? showClosing : undefined,
        onBack: () => void showJourney(),
      });
      globalThis.history.replaceState(null, "", `#polarity=${encodeURIComponent(polarity.id)}`);
    } finally {
      loading = false;
      mount.removeAttribute("aria-busy");
    }
  };

  const showJourney = async (): Promise<void> => {
    globalThis.history.replaceState(null, "", globalThis.location.pathname);
    await renderPrologue(
      {
        lines: [pack.subtitle],
        title: pack.title,
        actionLabel: pack.entryAction,
      },
      pack.title,
      { image: pack.coverImage, imageAlt: pack.coverImageAlt },
    );
    await showPolarity(pack.entry);
  };

  await showJourney();
}

async function startLivingCardPack(packUrl: URL): Promise<void> {
  const pack: LivingCardPack = await loadLivingCardPack(packUrl);
  const messages = resolveLocale(pack.language);
  updateShell(messages, pack.title);
  updateLibraryNavigation(messages, true);
  const skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
  if (skipLink) skipLink.href = "#living-card";
  let loading = false;

  const showCard = async (id: string): Promise<void> => {
    if (loading) return;
    const item = pack.cards.find((candidate) => candidate.id === id);
    if (!item) throw new Error("INE_LIVING_CARD_NOT_FOUND");
    loading = true;
    mount.setAttribute("aria-busy", "true");
    try {
      const card = await loadLivingCard(new URL(item.source), validateLivingCard);
      const previousExists =
        card.previous !== null &&
        pack.cards.some((candidate) => candidate.id === card.previous);
      const nextExists =
        card.next !== null &&
        pack.cards.some((candidate) => candidate.id === card.next);
      renderLivingCard(mount, {
        card,
        fallbackImage: pack.fallbackImage,
        fallbackImageAlt: pack.fallbackImageAlt,
        landmarkLabel: pack.landmarkLabel,
        continueLabel: pack.actions.continue,
        previousLabel: pack.actions.previous,
        backLabel: pack.actions.back,
        finishLabel: pack.actions.finish,
        onPrevious: previousExists && card.previous
          ? () => void showCard(card.previous as string)
          : undefined,
        onContinue: nextExists && card.next
          ? () => void showCard(card.next as string)
          : undefined,
        onFinish: () => {
          globalThis.location.href = libraryUrl.href;
        },
        onBack: () => void showJourney(),
      });
      globalThis.history.replaceState(null, "", `#card=${encodeURIComponent(card.id)}`);
    } finally {
      loading = false;
      mount.removeAttribute("aria-busy");
    }
  };

  const showJourney = async (): Promise<void> => {
    globalThis.history.replaceState(null, "", globalThis.location.pathname);
    await renderPrologue(
      {
        lines: [pack.subtitle],
        title: pack.title,
        actionLabel: pack.entryAction,
      },
      pack.title,
      { image: pack.coverImage, imageAlt: pack.coverImageAlt },
    );
    await showCard(pack.entry);
  };

  await showJourney();
}

async function renderWorkshopEntryGate(
  workshop: PublishedAugmentedWorkshop,
  packUrl: URL,
): Promise<void> {
  const pack = await loadWorkshopPack(packUrl, validateWorkshopPack);
  const messages = resolveLocale(pack.language);
  const labels = workshop.labels[messages.language === "fr" ? "fr" : "en"];
  const progressStore = createBrowserWorkshopProgressStore();
  const savedProgress = progressStore.load(pack.id, pack.version, pack.pages);
  const savedPageIndex = savedProgress ? pack.pages.findIndex((page) => page.id === savedProgress.pageId) : -1;
  const hasProgress = savedProgress !== null && savedPageIndex >= 0;
  const completed = savedProgress?.completed === true;

  updateShell(messages, pack.title);
  updateLibraryNavigation(messages, true);
  const skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
  if (skipLink) {
    skipLink.href = "#workshop-entry";
    skipLink.textContent = messages.skipToNarrative;
  }

  const startWorkshop = async (restart = false): Promise<void> => {
    if (restart) progressStore.clear(pack.id);
    await startWorkshopPack(packUrl);
  };

  const section = document.createElement("section");
  section.id = "workshop-entry";
  section.className = "workshop-entry";
  section.setAttribute("aria-labelledby", "workshop-entry-title");

  const media = document.createElement("figure");
  media.className = "workshop-entry__cover";
  const image = document.createElement("img");
  image.src = resolveApplicationRoute(workshop.coverImage);
  image.alt = workshop.coverImageAlt;
  image.decoding = "async";
  media.append(image);

  const content = document.createElement("div");
  content.className = "workshop-entry__content";

  const eyebrow = document.createElement("p");
  eyebrow.className = "workshop-entry__eyebrow";
  eyebrow.textContent = labels.orientation;

  const title = document.createElement("h1");
  title.id = "workshop-entry-title";
  title.textContent = labels.title.toUpperCase();

  const subtitle = document.createElement("p");
  subtitle.className = "workshop-entry__subtitle";
  subtitle.textContent = pack.subtitle;

  const description = document.createElement("p");
  description.className = "workshop-entry__description";
  description.textContent = labels.description;

  const steps = document.createElement("p");
  steps.className = "workshop-entry__steps";
  steps.textContent = messages.workshopEntrySteps;

  const intro = document.createElement("div");
  intro.className = "workshop-entry__intro";
  for (const paragraphText of messages.workshopEntryIntro.split("\n\n")) {
    const paragraph = document.createElement("p");
    paragraph.textContent = paragraphText;
    intro.append(paragraph);
  }

  const privacy = document.createElement("p");
  privacy.className = "workshop-entry__privacy";
  privacy.textContent = messages.workshopEntryPrivacy;

  const actions = document.createElement("div");
  actions.className = "workshop-entry__actions";

  const primary = createButton(
    hasProgress
      ? completed
        ? messages.workshopEntryReview
        : messages.workshopEntryResume
      : messages.workshopEntryStart,
    () => {
      void startWorkshop(false);
    },
  );
  primary.className = "workshop-entry__primary";
  actions.append(primary);

  if (hasProgress) {
    const resumeHint = document.createElement("p");
    resumeHint.className = "workshop-entry__resume";
    resumeHint.textContent = interpolate(
      completed ? messages.workshopEntryCompletedProgress : messages.workshopEntryResumeProgress,
      { current: savedPageIndex + 1, total: pack.pages.length },
    );
    actions.append(resumeHint);

    const restart = createButton(messages.workshopEntryRestart, () => {
      if (section.querySelector(".workshop-entry__confirm")) return;
      const confirmation = document.createElement("section");
      confirmation.className = "workshop-entry__confirm";
      confirmation.setAttribute("role", "dialog");
      confirmation.setAttribute("aria-labelledby", "workshop-entry-restart-title");
      confirmation.setAttribute("aria-describedby", "workshop-entry-restart-description");
      confirmation.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        confirmation.remove();
        restart.focus();
      });

      const confirmTitle = document.createElement("h2");
      confirmTitle.id = "workshop-entry-restart-title";
      confirmTitle.textContent = messages.workshopEntryRestartTitle;
      const confirmDescription = document.createElement("p");
      confirmDescription.id = "workshop-entry-restart-description";
      confirmDescription.textContent = messages.workshopEntryRestartDescription;
      const confirmActions = document.createElement("div");
      confirmActions.className = "workshop-entry__confirm-actions";
      const cancel = createButton(messages.workshopEntryRestartCancel, () => {
        confirmation.remove();
        restart.focus();
      });
      const confirm = createButton(messages.workshopEntryRestartConfirm, () => {
        void startWorkshop(true);
      });
      confirm.className = "workshop-entry__danger";
      confirmActions.append(cancel, confirm);
      confirmation.append(confirmTitle, confirmDescription, confirmActions);
      actions.append(confirmation);
      cancel.focus();
    });
    restart.className = "workshop-entry__secondary";
    actions.append(restart);
  }

  const back = document.createElement("a");
  back.className = "workshop-entry__back";
  back.href = workshopsUrl.href;
  back.textContent = messages.workshopEntryBack;

  content.append(eyebrow, title, subtitle, description, steps, intro, privacy, actions, back);
  section.append(media, content);
  mount.removeAttribute("aria-busy");
  mount.replaceChildren(section);
  primary.focus();
}

async function startWorkshopPack(packUrl: URL): Promise<void> {
  const pack = await loadWorkshopPack(packUrl, validateWorkshopPack);
  const engine = new WorkshopEngine(pack);
  const messages = resolveLocale(pack.language);
  updateShell(messages, pack.title);
  updateLibraryNavigation(messages, true);
  const skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
  if (skipLink) {
    skipLink.href = "#workshop-page";
    skipLink.textContent = messages.skipToNarrative;
  }
  let navigationInProgress = false;
  let clearConfirmationPending = false;
  const responses = new Map<string, WorkshopResponseValue>();
  const progressStore = createBrowserWorkshopProgressStore();
  const savedProgress = progressStore.load(pack.id, pack.version, pack.pages);
  if (savedProgress) {
    engine.goToPage(savedProgress.pageId);
    for (const [blockId, value] of Object.entries(savedProgress.responses)) {
      responses.set(blockId, value);
    }
  }

  const movementForCurrentPage = () => {
    const movement = pack.movements.find((candidate) => candidate.id === engine.currentPage.movementId);
    if (!movement) throw new Error("INE_WORKSHOP_MOVEMENT_STATE_INVALID");
    return movement;
  };

  const copyText = async (text: string): Promise<boolean> => {
    if (!navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const saveCurrentProgress = (): void => {
    progressStore.save(
      createWorkshopProgress({
        workshopId: pack.id,
        workshopVersion: pack.version,
        pageId: engine.currentPage.id,
        completed: !engine.canGoNext,
        responses,
      }),
    );
  };

  const clearProgress = (): void => {
    progressStore.clear(pack.id);
    responses.clear();
    engine.goToPage(pack.startPage);
    clearConfirmationPending = false;
    render();
  };

  const createResetControl = (): HTMLButtonElement => {
    const button = createButton(
      clearConfirmationPending ? messages.workshopClearProgressConfirm : messages.workshopClearProgress,
      () => {
        if (!clearConfirmationPending) {
          clearConfirmationPending = true;
          button.textContent = messages.workshopClearProgressConfirm;
          button.dataset.confirming = "true";
          button.focus();
          return;
        }
        clearProgress();
      },
    );
    button.className = "workshop-reset";
    if (clearConfirmationPending) button.dataset.confirming = "true";
    return button;
  };

  const render = (): void => {
    const controls = document.createElement("nav");
    controls.className = "workshop-controls";
    controls.setAttribute("aria-label", messages.workshopNavigationLabel);

    const previous = createButton(messages.previous, () => navigate("previous"));
    previous.dataset.workshopNavigation = "previous";
    previous.disabled = navigationInProgress || !engine.canGoPrevious;

    const next = createButton(messages.next, () => navigate("next"));
    next.dataset.workshopNavigation = "next";
    next.disabled = navigationInProgress || !engine.canGoNext;

    controls.append(previous, next);

    const exit = document.createElement("a");
    exit.className = "workshop-exit";
    exit.href = workshopsUrl.href;
    exit.textContent = messages.workshopExit;
    exit.setAttribute("aria-label", messages.workshopExit);

    const current = engine.currentPageIndex + 1;
    renderWorkshop(mount, {
      pack,
      page: engine.currentPage,
      movement: movementForCurrentPage(),
      pageIndex: engine.currentPageIndex,
      pageCount: engine.pageCount,
      responses,
      onResponseChange: (blockId, value) => {
        responses.set(blockId, value);
        saveCurrentProgress();
      },
      onCopyText: copyText,
      controls,
      exitControl: !engine.canGoNext ? exit : undefined,
      resetControl: createResetControl(),
      messages: {
        landmarkLabel: messages.workshopPackLabel,
        progressLabel: messages.workshopProgressLabel,
        progressText: `${String(current).padStart(2, "0")} / ${String(engine.pageCount).padStart(2, "0")}`,
        unsupportedBlockText: messages.workshopUnsupportedBlock,
        promptCopyAction: messages.workshopPromptCopyAction,
        promptCopySuccess: messages.workshopPromptCopySuccess,
        promptCopyFailure: messages.workshopPromptCopyFailure,
        recallEmptyText: messages.workshopRecallEmptyText,
      },
    });
    mount.removeAttribute("aria-busy");
  };

  const navigate = (target: NavigationTarget): void => {
    if (navigationInProgress) return;
    if (target === "previous" && !engine.canGoPrevious) return;
    if (target === "next" && !engine.canGoNext) return;

    navigationInProgress = true;
    mount.setAttribute("aria-busy", "true");
    try {
      if (target === "previous") engine.previous();
      else engine.next();
    } finally {
      navigationInProgress = false;
      try {
        render();
        saveCurrentProgress();
      } finally {
        mount.removeAttribute("aria-busy");
      }
    }
  };

  render();
}

async function start(): Promise<void> {
  const hasPackOverride = new URL(globalThis.location.href).searchParams.has("pack");
  if (!hasPackOverride && isHomeRoute()) {
    await renderPublicThreshold();
    return;
  }
  if (!hasPackOverride && isLibraryRoute()) {
    await renderLibrary();
    return;
  }
  if (!hasPackOverride && isReviewRoute()) {
    await renderReview();
    return;
  }
  if (!hasPackOverride && isWorkshopsRoute()) {
    await renderWorkshops();
    return;
  }
  const workshopSlug = hasPackOverride ? null : requestedWorkshopSlug();
  if (workshopSlug) {
    const workshop = findPublishedAugmentedWorkshopBySlug(workshopSlug);
    if (!workshop) throw new Error("INE_WORKSHOP_ROUTE_NOT_FOUND");
    await renderWorkshopEntryGate(workshop, new URL(workshop.manifest, applicationBaseUrl));
    return;
  }
  const configuration = await loadPlayerConfiguration();
  const packUrl = new URL(configuration.packUrl, applicationBaseUrl);
  const format = await detectPackFormat(packUrl);
  if (format === "ine-narrative-pack") {
    await startNarrativePack(packUrl);
    return;
  }
  if (format === "ine-polarity-pack") {
    await startPolarityPack(packUrl);
    return;
  }
  if (format === "ine-living-card-pack") {
    await startLivingCardPack(packUrl);
    return;
  }
  if (format === "ine-workshop-pack") {
    await startWorkshopPack(packUrl);
    return;
  }
  throw new Error("INE_PACK_FORMAT_UNSUPPORTED");
}

function renderError(): void {
  const messages = resolveLocale(navigator.language);
  updateShell(messages);
  mount.replaceChildren();
  const panel = document.createElement("section");
  panel.className = "error-panel";
  panel.setAttribute("role", "alert");
  const title = document.createElement("h1");
  title.textContent = messages.errorTitle;
  const detail = document.createElement("p");
  detail.textContent = messages.errorMessage;
  panel.append(title, detail);
  mount.append(panel);
}

void start().catch(renderError);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(new URL("sw.js", applicationBaseUrl));
  });
}
