import { NarrativeEngine, loadNarrativePack } from "@ine/core";
import { renderPlayer } from "@ine/renderer";
import { createButton } from "@ine/ui";
import { validateNarrativePack } from "@ine/validators";
import { interpolate, resolveLocale, type LocaleMessages } from "./localization";
import "./styles.css";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("INE_PLAYER_MOUNT_MISSING");
}

const mount = app;

interface PlayerConfiguration {
  readonly narrativePackUrl: string;
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
  updateShell(messages, pack.title);

  const render = (focusTarget?: "previous" | "next"): void => {
    const scene = engine.currentScene;
    const controls = document.createElement("nav");
    controls.className = "player-controls";
    controls.setAttribute("aria-label", messages.navigationLabel);

    const previous = createButton(messages.previous, () => {
      engine.previous();
      render("previous");
    });
    previous.disabled = !engine.canGoPrevious;

    const next = createButton(messages.next, () => {
      engine.next();
      render("next");
    });
    next.disabled = !engine.canGoNext;

    controls.append(previous, next);
    const sceneIndex = engine.currentSceneIndex;
    const sceneCount = engine.sceneCount;
    renderPlayer(mount, {
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
    });
    if (focusTarget) {
      const preferredTarget = focusTarget === "previous" ? previous : next;
      const fallbackTarget = focusTarget === "previous" ? next : previous;
      const target = preferredTarget.disabled ? fallbackTarget : preferredTarget;
      requestAnimationFrame(() => target.focus());
    }
  };

  render();
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
