import {
  DEFAULT_SCENE_TRANSITION,
  NarrativeEngine,
  detectPackFormat,
  getTransitionDirection,
  loadNarrativePack,
  loadPolarity,
  loadPolarityPack,
  type NarrativeIntro,
  type NormalizedSceneTransition,
  type PolarityPack,
  type TransitionDirection,
} from "@ine/core";
import {
  renderPlayer,
  renderPlayerWithTransition,
  renderPolarity,
  renderPolarityClosure,
} from "@ine/renderer";
import { createButton } from "@ine/ui";
import { validateNarrativePack, validatePolarity } from "@ine/validators";
import { interpolate, resolveLocale, type LocaleMessages } from "./localization";
import {
  createBrowserReadingProgressStore,
  createReadingProgress,
  resolveProgressSceneIndex,
} from "./progress";
import {
  findRegistryEntryBySlug,
  loadCatalog,
  loadPackRegistry,
} from "./catalog";
import "./styles.css";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("INE_PLAYER_MOUNT_MISSING");
}

const mount = app;
type NavigationTarget = "previous" | "next";
type ResumeChoice = "resume" | "restart";

interface PlayerConfiguration {
  readonly packUrl: string;
}

declare const __INE_BASE__: string;

const applicationBaseUrl = new URL(__INE_BASE__, globalThis.location.origin);
const registryUrl = new URL("packs/index.json", applicationBaseUrl);
const libraryUrl = new URL("bibliotheque/", applicationBaseUrl);

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function updateShell(messages: LocaleMessages, packTitle?: string): void {
  document.documentElement.lang = messages.language;
  document.title = packTitle ? `${packTitle} | ${messages.engineTitle}` : messages.engineTitle;

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

function isLibraryRoute(): boolean {
  const path = globalThis.location.pathname;
  return path === libraryUrl.pathname || path === libraryUrl.pathname.replace(/\/$/, "");
}

async function loadPlayerConfiguration(): Promise<PlayerConfiguration | null> {
  const requestedPack = new URL(globalThis.location.href).searchParams.get("pack");
  if (requestedPack) return { packUrl: requestedPack };

  if (isLibraryRoute()) return null;

  const workSlug = requestedWorkSlug();
  if (workSlug) {
    const registry = await loadPackRegistry(registryUrl);
    const entry = findRegistryEntryBySlug(registry, workSlug);
    if (!entry) throw new Error("INE_PACK_ROUTE_NOT_FOUND");
    return { packUrl: new URL(entry.manifest, registryUrl).href };
  }

  if (globalThis.location.pathname === applicationBaseUrl.pathname) {
    const registry = await loadPackRegistry(registryUrl);
    const entry = registry.packs.find(({ id }) => id === registry.home);
    if (!entry) throw new Error("INE_PACK_REGISTRY_HOME_MISSING");
    return { packUrl: new URL(entry.manifest, registryUrl).href };
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

async function renderLibrary(): Promise<void> {
  const messages = resolveLocale(navigator.language);
  const packs = await loadCatalog(registryUrl);
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
  const title = document.createElement("h1");
  title.id = "library-title";
  title.textContent = messages.libraryTitle;
  const description = document.createElement("p");
  description.textContent = messages.libraryDescription;
  header.append(title, description);

  const grid = document.createElement("div");
  grid.className = "library__grid";
  for (const pack of packs) {
    const article = document.createElement("article");
    article.className = "work-card";
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
    link.setAttribute("aria-label", `${messages.exploreWork} — ${pack.title}`);
    content.append(workTitle, subtitle, summary, link);
    article.append(image, content);
    grid.append(article);
  }

  library.append(header, grid);
  mount.append(library);
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
    if (previous) previous.disabled = transitionInProgress || !engine.canGoPrevious;
    if (next) next.disabled = transitionInProgress || !engine.canGoNext;
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
    previous.disabled = transitionInProgress || !engine.canGoPrevious;

    const next = createButton(messages.next, () => {
      void navigate("next");
    });
    next.dataset.navigation = "next";
    next.disabled = transitionInProgress || !engine.canGoNext;

    controls.append(previous, next);
    if (!engine.canGoNext) {
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
      messages: {
        engineTitle: messages.engineTitle,
        packLabel: messages.packLabel,
        progressLabel: messages.progressLabel,
        progressText: interpolate(messages.progressText, {
          current: sceneIndex + 1,
          total: sceneCount,
        }),
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
    if (target === "previous" && !engine.canGoPrevious) return;
    if (target === "next" && !engine.canGoNext) return;

    const previousIndex = engine.currentSceneIndex;
    const targetIndex = target === "next" ? previousIndex + 1 : previousIndex - 1;
    const transition = engine.transitionForSceneIndex(targetIndex);
    let navigationSucceeded = false;

    transitionInProgress = true;
    disableCurrentControls();
    mount.setAttribute("aria-busy", "true");
    try {
      if (target === "next") engine.next();
      else engine.previous();
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
          progressText: interpolate(messages.progressText, {
            current: engine.currentSceneIndex + 1,
            total: engine.sceneCount,
          }),
        },
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
  if (savedProgress && savedProgress.packVersion === pack.version) {
    const savedSceneIndex = resolveProgressSceneIndex(savedProgress, pack.scenes);
    if (savedSceneIndex === null) {
      progressStore.clear(pack.id);
    } else if (savedSceneIndex !== engine.currentSceneIndex) {
      const choice = await renderResumePrompt(messages, savedSceneIndex, engine.sceneCount);
      if (choice === "resume") {
        engine.goToScene(savedProgress.sceneId);
        await render();
        saveCurrentProgress();
        focusFirstAvailableNavigationControl();
        return;
      }
      progressStore.clear(pack.id);
      if (intro) {
        await renderPrologue(intro, pack.title);
        await render();
        saveCurrentProgress();
        focusFirstAvailableNavigationControl();
        return;
      }
    }
  } else if (savedProgress) {
    progressStore.clear(pack.id);
  }

  if (!savedProgress && intro) {
    await renderPrologue(intro, pack.title);
    await render();
    saveCurrentProgress();
    focusFirstAvailableNavigationControl();
    return;
  }

  await render();
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
      const polarity = pack.articleUrl
        ? { ...loadedPolarity, article: pack.articleUrl }
        : loadedPolarity;
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

async function start(): Promise<void> {
  const configuration = await loadPlayerConfiguration();
  if (!configuration) {
    await renderLibrary();
    return;
  }
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
