import type { ImageDisplayMode, NarrativePack, NarrativeScene } from "@ine/core";

export interface RendererMessages {
  readonly engineTitle: string;
  readonly packLabel: string;
  readonly progressLabel: string;
  readonly progressText: string;
}

export interface RenderPlayerState {
  readonly pack: NarrativePack;
  readonly scene: NarrativeScene;
  readonly sceneIndex: number;
  readonly sceneCount: number;
  readonly controls: HTMLElement;
  readonly messages: RendererMessages;
}

function createSceneStep(active: boolean): HTMLSpanElement {
  const step = document.createElement("span");
  step.className = active ? "progress__step progress__step--active" : "progress__step";
  return step;
}

export function renderPlayer(target: HTMLElement, state: RenderPlayerState): void {
  target.replaceChildren();

  const player = document.createElement("div");
  player.className = "player";

  const header = document.createElement("header");
  header.className = "player__header";

  const engineTitle = document.createElement("p");
  engineTitle.className = "player__brand";
  engineTitle.textContent = state.messages.engineTitle;

  const packMeta = document.createElement("div");
  packMeta.className = "player__pack";
  const packLabel = document.createElement("span");
  packLabel.className = "player__pack-label";
  packLabel.textContent = state.messages.packLabel;
  const packTitle = document.createElement("strong");
  packTitle.className = "player__pack-title";
  packTitle.textContent = state.pack.title;
  packMeta.append(packLabel, packTitle);

  header.append(engineTitle, packMeta);

  const article = document.createElement("article");
  article.id = "scene";
  article.className = "scene";
  article.tabIndex = -1;

  if (state.scene.image) {
    const media = document.createElement("figure");
    media.className = "scene__media";
    const image = document.createElement("img");
    image.className = "scene__image";
    image.src = state.scene.image;
    image.alt = state.scene.imageAlt ?? "";
    image.dataset.displayMode = state.scene.imageDisplayMode ?? "contain";
    media.append(image);
    article.append(media);
  }

  const content = document.createElement("div");
  content.className = "scene__content";
  const title = document.createElement("h1");
  title.className = "scene__title";
  title.textContent = state.scene.title;
  const text = document.createElement("p");
  text.className = "scene__text";
  text.textContent = state.scene.text;
  content.append(title, text);
  article.append(content);

  const progress = document.createElement("div");
  progress.className = "progress";
  progress.setAttribute("aria-label", state.messages.progressLabel);

  const progressText = document.createElement("p");
  progressText.className = "progress__text";
  progressText.textContent = state.messages.progressText;

  const progressSteps = document.createElement("div");
  progressSteps.className = "progress__steps";
  progressSteps.setAttribute("aria-hidden", "true");
  for (let index = 0; index < state.sceneCount; index += 1) {
    progressSteps.append(createSceneStep(index <= state.sceneIndex));
  }

  progress.append(progressText, progressSteps);

  const footer = document.createElement("footer");
  footer.className = "player__footer";
  footer.append(progress, state.controls);

  player.append(header, article, footer);
  target.append(player);
}

export type { ImageDisplayMode };
