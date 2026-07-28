import { NarrativeEngine, loadNarrativePack } from "@ine/core";
import { renderPlayer } from "@ine/renderer";
import { createButton } from "@ine/ui";
import { validateNarrativePack } from "@ine/validators";
import "./styles.css";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("Player mount element not found.");
}

const mount = app;

async function start(): Promise<void> {
  const packUrl = new URL("demo-pack/pack.json", document.baseURI);
  const pack = await loadNarrativePack(packUrl, validateNarrativePack);
  const engine = new NarrativeEngine(pack);

  const render = (): void => {
    const scene = engine.currentScene;
    const controls = document.createElement("nav");
    controls.className = "player-controls";
    controls.setAttribute("aria-label", "Narrative navigation");

    const previous = createButton("Previous", () => {
      engine.previous();
      render();
    });
    previous.disabled = !engine.canGoPrevious;

    const next = createButton("Next", () => {
      engine.next();
      render();
    });
    next.disabled = !engine.canGoNext;

    controls.append(previous, next);
    renderPlayer(mount, pack, scene, engine.progress, controls);
  };

  render();
}

function renderError(error: unknown): void {
  const message = error instanceof Error ? error.message : "Unknown player error";
  mount.replaceChildren();
  const panel = document.createElement("section");
  panel.className = "error-panel";
  panel.setAttribute("role", "alert");
  const title = document.createElement("h1");
  title.textContent = "Unable to load the Narrative Pack";
  const detail = document.createElement("p");
  detail.textContent = message;
  panel.append(title, detail);
  mount.append(panel);
}

void start().catch(renderError);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(new URL("sw.js", document.baseURI));
  });
}
