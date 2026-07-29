import {
  DEFAULT_SCENE_TRANSITION,
  NarrativeEngine,
  getTransitionDirection,
  loadNarrativePack,
  type NormalizedSceneTransition,
  type TransitionDirection,
} from "@ine/core";
import { renderPlayer, renderPlayerWithTransition } from "@ine/renderer";
import { createButton } from "@ine/ui";
import { validateNarrativePack } from "@ine/validators";
import { interpolate, resolveLocale, type LocaleMessages } from "./localization";
import {
  createBrowserReadingProgressStore,
  createReadingProgress,
  resolveProgressSceneIndex,
} from "./progress";
import "./styles.css";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("INE_PLAYER_MOUNT_MISSING");
}

const mount = app;
type NavigationTarget = "previous" | "next";
type ResumeChoice = "resume" | "restart";

interface PlayerConfiguration {
  readonly narrativePackUrl: string;
}

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

async function loadPlayerConfiguration(): Promise<PlayerConfiguration> {
  const response = await fetch(new URL("player.config.json", document.baseURI));
  if (!response.ok) {
    throw new Error("INE_PLAYER_CONFIGURATION_REQUEST_FAILED");
  }

  const value: unknown = await response.json();
  if (
    typeof value !== "object" ||
    value === null ||
    !("narrativePackUrl" in value) ||
    typeof value.narrativePackUrl !== "string" ||
    value.narrativePackUrl.length === 0
  ) {
    throw new Error("INE_PLAYER_CONFIGURATION_INVALID");
  }

  return { narrativePackUrl: value.narrativePackUrl };
}

async function start(): Promise<void> {
  const configuration = await loadPlayerConfiguration();
  const packUrl = new URL(configuration.narrativePackUrl, document.baseURI);
  const pack = await loadNarrativePack(packUrl, validateNarrativePack);
  const engine = new NarrativeEngine(pack);
  const messages = resolveLocale(pack.language);
  const progressStore = createBrowserReadingProgressStore();
  updateShell(messages, pack.title);
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
    for (const button of mount.querySelectorAll<HTMLButtonElement>(".player-controls button")) {
      button.disabled = true;
    }
  };

  const focusNavigationControl = (focusTarget: NavigationTarget): void => {
    const preferredTarget = mount.querySelector<HTMLButtonElement>(`[data-navigation="${focusTarget}"]`);
    const fallbackTarget = mount.querySelector<HTMLButtonElement>(
      `[data-navigation="${focusTarget === "previous" ? "next" : "previous"}"]`,
    );
    const target = preferredTarget && !preferredTarget.disabled ? preferredTarget : fallbackTarget;
    if (target && !target.disabled) target.focus();
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
    }
  } else if (savedProgress) {
    progressStore.clear(pack.id);
  }

  await render();
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
    void navigator.serviceWorker.register(new URL("sw.js", document.baseURI));
  });
}
