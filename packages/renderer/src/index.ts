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

const IMAGE_READY_TIMEOUT_MS = 2_500;
type ImageLoadingState = "loading" | "ready" | "error";

function createSceneStep(active: boolean): HTMLSpanElement {
  const step = document.createElement("span");
  step.className = active ? "progress__step progress__step--active" : "progress__step";
  return step;
}

function setImageState(image: HTMLImageElement, state: ImageLoadingState): void {
  image.dataset.imageState = state;
  if (image.parentElement) image.parentElement.dataset.imageState = state;
}

function markImageState(image: HTMLImageElement): void {
  if (!image.complete) {
    setImageState(image, "loading");
    return;
  }
  setImageState(image, image.naturalWidth > 0 && image.naturalHeight > 0 ? "ready" : "error");
}

function createSceneImage(scene: NarrativeScene): HTMLImageElement {
  const image = document.createElement("img");
  image.className = "scene__image";
  image.alt = scene.imageAlt ?? "";
  image.dataset.displayMode = scene.imageDisplayMode ?? "contain";
  image.dataset.imageState = "loading";
  image.addEventListener("load", () => {
    setImageState(image, "ready");
  });
  image.addEventListener("error", () => {
    setImageState(image, "error");
    console.warn("INE_IMAGE_LOAD_FAILED", { alt: image.alt });
  });
  image.src = scene.image ?? "";
  markImageState(image);
  return image;
}

function waitForImageReady(image: HTMLImageElement, timeoutMs = IMAGE_READY_TIMEOUT_MS): Promise<void> {
  if (image.complete) {
    markImageState(image);
    if (image.naturalWidth > 0 && image.naturalHeight > 0 && typeof image.decode === "function") {
      return Promise.race([
        image.decode().then(() => {
          setImageState(image, "ready");
        }),
        new Promise<void>((resolve) => globalThis.setTimeout(resolve, timeoutMs)),
      ]).catch(() => {
        setImageState(image, "error");
      });
    }
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let timeout: ReturnType<typeof globalThis.setTimeout>;
    const finish = (state: "ready" | "error"): void => {
      globalThis.clearTimeout(timeout);
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
      setImageState(image, state);
      resolve();
    };
    const onLoad = (): void => finish(image.naturalWidth > 0 && image.naturalHeight > 0 ? "ready" : "error");
    const onError = (): void => finish("error");
    timeout = globalThis.setTimeout(() => finish("error"), timeoutMs);
    image.addEventListener("load", onLoad, { once: true });
    image.addEventListener("error", onError, { once: true });
  });
}

async function waitForImagesReady(root: HTMLElement): Promise<void> {
  const images = [...root.querySelectorAll("img")];
  await Promise.all(images.map((image) => waitForImageReady(image)));
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
  player.dataset.engineTitle = state.messages.engineTitle;
  player.dataset.packId = state.pack.id;

  const header = document.createElement("header");
  header.className = "player__header";
  header.setAttribute("aria-label", state.messages.packLabel);

  const packTitle = document.createElement("strong");
  packTitle.className = "player__work-title";
  packTitle.textContent = state.pack.title;

  header.append(packTitle);

  const article = document.createElement("article");
  article.id = "scene";
  article.className = "scene";
  article.tabIndex = -1;

  if (state.scene.image) {
    const media = document.createElement("figure");
    media.className = "scene__media";
    media.dataset.imageState = "loading";
    const image = createSceneImage(state.scene);
    image.addEventListener("load", () => {
      media.dataset.imageState = "ready";
    });
    image.addEventListener("error", () => {
      media.dataset.imageState = "error";
    });
    if (image.complete) media.dataset.imageState = image.dataset.imageState ?? "loading";
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
      const nextPlayer = createPlayerElement(state);
      await waitForImagesReady(nextPlayer);
      const fadeOut = animateElement(currentPlayer, [{ opacity: 1 }, { opacity: 0 }], transition);
      if (!fadeOut) {
        target.replaceChildren(nextPlayer);
        return;
      }
      await fadeOut;
      target.replaceChildren(nextPlayer);
      await animateElement(nextPlayer, [{ opacity: 0 }, { opacity: 1 }], transition);
      return;
    }

    const nextPlayer = createPlayerElement(state);
    await waitForImagesReady(nextPlayer);
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
