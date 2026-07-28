import type {
  ImageDisplayMode,
  NarrativePack,
  NarrativeScene,
  NormalizedSceneTransition,
  TransitionDirection,
} from "@ine/core";

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

function addClass(element: HTMLElement, className: string): void {
  const classes = new Set(element.className.split(/\s+/).filter(Boolean));
  classes.add(className);
  element.className = [...classes].join(" ");
}

function removeClass(element: HTMLElement, className: string): void {
  element.className = element.className
    .split(/\s+/)
    .filter((value) => value.length > 0 && value !== className)
    .join(" ");
}

function createPlayerElement(state: RenderPlayerState): HTMLElement {
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
  return player;
}

function animateElement(
  element: HTMLElement,
  keyframes: Keyframe[],
  transition: NormalizedSceneTransition,
): Promise<void> | undefined {
  if (typeof element.animate !== "function") return undefined;

  const animation = element.animate(keyframes, {
    duration: transition.durationMs,
    easing: transition.easing,
    fill: "both",
  });
  const finished = animation.finished.then(() => undefined);
  const fallback = new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, transition.durationMs + 50);
  });
  return Promise.race([finished, fallback]);
}

function cleanupTransition(target: HTMLElement): void {
  removeClass(target, "player-transition-stage");
  target.removeAttribute("data-transition");
  target.style.removeProperty("overflow-x");
}

function shouldRenderImmediately(transition: NormalizedSceneTransition, reduceMotion: boolean): boolean {
  return reduceMotion || transition.type === "none" || transition.durationMs <= 0;
}

export interface RenderTransitionOptions {
  readonly transition: NormalizedSceneTransition;
  readonly direction: TransitionDirection;
  readonly reduceMotion: boolean;
}

export function renderPlayer(target: HTMLElement, state: RenderPlayerState): void {
  target.replaceChildren(createPlayerElement(state));
}

export async function renderPlayerWithTransition(
  target: HTMLElement,
  state: RenderPlayerState,
  options: RenderTransitionOptions,
): Promise<void> {
  const { transition, direction, reduceMotion } = options;

  if (shouldRenderImmediately(transition, reduceMotion)) {
    renderPlayer(target, state);
    return;
  }

  const currentPlayer = target.firstElementChild as HTMLElement | null;
  if (!currentPlayer) {
    renderPlayer(target, state);
    return;
  }

  addClass(target, "player-transition-stage");
  target.setAttribute("data-transition", transition.type);
  target.style.overflowX = "clip";

  try {
    if (transition.type === "fade") {
      const fadeOut = animateElement(currentPlayer, [{ opacity: 1 }, { opacity: 0 }], transition);
      if (!fadeOut) {
        renderPlayer(target, state);
        return;
      }
      await fadeOut;
      renderPlayer(target, state);
      const nextPlayer = target.firstElementChild as HTMLElement | null;
      if (nextPlayer) {
        await animateElement(nextPlayer, [{ opacity: 0 }, { opacity: 1 }], transition);
      }
      return;
    }

    const nextPlayer = createPlayerElement(state);
    currentPlayer.setAttribute("aria-hidden", "true");
    addClass(currentPlayer, "player--transition-leave");
    addClass(nextPlayer, "player--transition-enter");
    target.append(nextPlayer);

    const incomingOffset = direction === "backward" ? "-4rem" : "4rem";
    const outgoingOffset = direction === "backward" ? "4rem" : "-4rem";
    const animations =
      transition.type === "slide"
        ? [
            animateElement(currentPlayer, [{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: `translateX(${outgoingOffset})` }], transition),
            animateElement(nextPlayer, [{ opacity: 0, transform: `translateX(${incomingOffset})` }, { opacity: 1, transform: "translateX(0)" }], transition),
          ]
        : [
            animateElement(currentPlayer, [{ opacity: 1 }, { opacity: 0 }], transition),
            animateElement(nextPlayer, [{ opacity: 0 }, { opacity: 1 }], transition),
          ];

    if (animations.some((animation) => animation === undefined)) {
      renderPlayer(target, state);
      return;
    }

    await Promise.all(animations);
    removeClass(nextPlayer, "player--transition-enter");
    target.replaceChildren(nextPlayer);
  } catch {
    renderPlayer(target, state);
  } finally {
    cleanupTransition(target);
  }
}

export type { ImageDisplayMode };
