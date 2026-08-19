import type {
  ImageDisplayMode,
  LivingCard,
  NarrativePack,
  NarrativePackLayout,
  NarrativeScene,
  NormalizedSceneTransition,
  Polarity,
  TransitionDirection,
  WorkshopBlock,
  WorkshopMovement,
  WorkshopPack,
  WorkshopPage,
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
  readonly layout?: NarrativePackLayout;
  readonly layoutPhase?: "image" | "text";
  readonly primaryNavigation?: HTMLElement;
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
  if (state.layout) player.dataset.layout = state.layout;
  if (state.layoutPhase) player.dataset.layoutPhase = state.layoutPhase;

  const header = document.createElement("header");
  header.className = "player__header";
  header.setAttribute("aria-label", state.messages.packLabel);

  const packTitle = document.createElement("strong");
  packTitle.className = "player__work-title";
  packTitle.textContent = state.pack.title;

  header.append(packTitle);
  if (state.primaryNavigation) header.append(state.primaryNavigation);

  const article = document.createElement("article");
  article.id = "scene";
  article.className = "scene";
  article.tabIndex = -1;
  if (state.layoutPhase) article.dataset.layoutPhase = state.layoutPhase;

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
  if (state.scene.links?.length) {
    const links = document.createElement("nav");
    links.className = "scene__links";
    links.setAttribute("aria-label", "Ressources complémentaires");
    for (const sceneLink of state.scene.links) {
      const link = document.createElement("a");
      link.className = "scene__link";
      link.href = sceneLink.href;
      link.textContent = sceneLink.label;
      if (sceneLink.description) link.title = sceneLink.description;
      if (/^https?:\/\//.test(sceneLink.href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      links.append(link);
    }
    content.append(links);
  }
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

export interface WorkshopRendererMessages {
  readonly landmarkLabel: string;
  readonly progressLabel: string;
  readonly progressText: string;
  readonly unsupportedBlockText: string;
  readonly promptCopyAction: string;
  readonly promptCopySuccess: string;
  readonly promptCopyFailure: string;
  readonly recallEmptyText: string;
}

export type WorkshopResponseValue = string | boolean;

export interface RenderWorkshopState {
  readonly pack: WorkshopPack;
  readonly page: WorkshopPage;
  readonly movement: WorkshopMovement;
  readonly pageIndex: number;
  readonly pageCount: number;
  readonly responses?: ReadonlyMap<string, WorkshopResponseValue>;
  readonly onResponseChange?: (blockId: string, value: WorkshopResponseValue) => void;
  readonly onCopyText?: (text: string) => Promise<boolean>;
  readonly controls: HTMLElement;
  readonly exitControl?: HTMLElement;
  readonly messages: WorkshopRendererMessages;
}

function romanNumeral(value: number): string {
  const numerals: readonly [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let remaining = value;
  let output = "";
  for (const [amount, numeral] of numerals) {
    while (remaining >= amount) {
      output += numeral;
      remaining -= amount;
    }
  }
  return output || String(value);
}

function createDomId(pageId: string, blockId: string, suffix?: string): string {
  const safe = `${pageId}-${blockId}${suffix ? `-${suffix}` : ""}`.replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `workshop-${safe}`;
}

function getStringResponse(responses: ReadonlyMap<string, WorkshopResponseValue> | undefined, blockId: string): string {
  const value = responses?.get(blockId);
  return typeof value === "string" ? value : "";
}

function getBooleanResponse(responses: ReadonlyMap<string, WorkshopResponseValue> | undefined, blockId: string): boolean {
  return responses?.get(blockId) === true;
}

function createWorkshopBlock(
  pageId: string,
  block: WorkshopBlock,
  responses: ReadonlyMap<string, WorkshopResponseValue> | undefined,
  onResponseChange: ((blockId: string, value: WorkshopResponseValue) => void) | undefined,
  onCopyText: ((text: string) => Promise<boolean>) | undefined,
  messages: WorkshopRendererMessages,
  unsupportedBlockText: string,
): HTMLElement {
  const section = document.createElement("section");
  section.className = `workshop-block workshop-block--${block.type}`;
  section.dataset.blockId = block.id;
  section.dataset.blockType = block.type;

  if (block.type === "text") {
    const paragraph = document.createElement("p");
    paragraph.textContent = block.text;
    section.append(paragraph);
    return section;
  }

  if (block.type === "textarea") {
    const textareaId = createDomId(pageId, block.id, "textarea");
    const label = document.createElement("label");
    label.className = "workshop-field__label";
    label.setAttribute("for", textareaId);
    label.textContent = block.label;

    const textarea = document.createElement("textarea");
    textarea.id = textareaId;
    textarea.className = "workshop-textarea";
    textarea.name = block.id;
    textarea.value = getStringResponse(responses, block.id);
    if (block.placeholder) textarea.placeholder = block.placeholder;
    if (block.required) textarea.required = true;
    textarea.addEventListener("input", () => onResponseChange?.(block.id, textarea.value));

    section.append(label, textarea);
    return section;
  }

  if (block.type === "choice") {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "workshop-choice";
    const legend = document.createElement("legend");
    legend.className = "workshop-field__label";
    legend.textContent = block.label;
    fieldset.append(legend);

    const selected = getStringResponse(responses, block.id);
    const options = document.createElement("div");
    options.className = "workshop-choice__options";
    for (const option of block.options) {
      const optionId = createDomId(pageId, block.id, option.id);
      const item = document.createElement("label");
      item.className = "workshop-choice__option";
      item.setAttribute("for", optionId);

      const input = document.createElement("input");
      input.id = optionId;
      input.type = "radio";
      input.name = block.id;
      input.value = option.id;
      input.checked = selected === option.id;
      input.addEventListener("change", () => {
        if (input.checked) onResponseChange?.(block.id, option.id);
      });

      const labelText = document.createElement("span");
      labelText.className = "workshop-choice__label";
      labelText.textContent = option.label;
      item.append(input, labelText);
      if (option.description) {
        const description = document.createElement("span");
        description.className = "workshop-choice__description";
        description.textContent = option.description;
        item.append(description);
      }
      options.append(item);
    }
    fieldset.append(options);
    section.append(fieldset);
    return section;
  }

  if (block.type === "reveal") {
    const contentId = createDomId(pageId, block.id, "content");
    const isOpen = getBooleanResponse(responses, block.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "workshop-reveal__button";
    button.textContent = block.label;
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-controls", contentId);

    const content = document.createElement("div");
    content.id = contentId;
    content.className = "workshop-reveal__content";
    if (!isOpen) {
      content.hidden = true;
      content.setAttribute("hidden", "");
    }
    const paragraph = document.createElement("p");
    paragraph.textContent = block.content;
    content.append(paragraph);

    button.addEventListener("click", () => {
      onResponseChange?.(block.id, true);
      button.setAttribute("aria-expanded", "true");
      content.hidden = false;
      content.removeAttribute("hidden");
    });

    section.append(button, content);
    return section;
  }

  if (block.type === "promptCopy") {
    const promptId = createDomId(pageId, block.id, "prompt");
    const statusId = createDomId(pageId, block.id, "status");

    const title = document.createElement("h2");
    title.className = "workshop-field__label";
    title.textContent = block.label;

    if (block.description) {
      const description = document.createElement("p");
      description.className = "workshop-prompt-copy__description";
      description.textContent = block.description;
      section.append(title, description);
    } else {
      section.append(title);
    }

    const prompt = document.createElement("pre");
    prompt.id = promptId;
    prompt.className = "workshop-prompt-copy__text";
    const code = document.createElement("code");
    code.textContent = block.text;
    prompt.append(code);

    const status = document.createElement("p");
    status.id = statusId;
    status.className = "workshop-prompt-copy__status";
    status.setAttribute("aria-live", "polite");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "workshop-prompt-copy__button";
    button.textContent = messages.promptCopyAction;
    button.setAttribute("aria-describedby", `${promptId} ${statusId}`);
    button.addEventListener("click", () => {
      void (async () => {
        const copied = await onCopyText?.(block.text);
        status.textContent = copied ? messages.promptCopySuccess : messages.promptCopyFailure;
      })();
    });

    section.append(prompt, button, status);
    return section;
  }

  if (block.type === "recall") {
    const title = document.createElement("h2");
    title.className = "workshop-field__label";
    title.textContent = block.label ?? block.sourceBlockId;
    const quote = document.createElement("blockquote");
    quote.className = "workshop-recall__content";
    const paragraph = document.createElement("p");
    const value = getStringResponse(responses, block.sourceBlockId).trim();
    paragraph.textContent = value.length > 0 ? value : block.emptyText ?? messages.recallEmptyText;
    quote.append(paragraph);
    section.append(title, quote);
    return section;
  }

  const unknownBlock = block as { readonly type: string; readonly label?: unknown };
  section.className += " workshop-block--pending";
  section.setAttribute("aria-disabled", "true");
  const label = typeof unknownBlock.label === "string" ? unknownBlock.label : unknownBlock.type;
  const title = document.createElement("h2");
  title.textContent = label;
  const status = document.createElement("p");
  status.textContent = unsupportedBlockText;
  section.append(title, status);
  return section;
}

export function renderWorkshop(target: HTMLElement, state: RenderWorkshopState): void {
  const shell = document.createElement("section");
  shell.className = "workshop-player";
  shell.dataset.packId = state.pack.id;
  shell.setAttribute("aria-labelledby", "workshop-page-title");
  shell.setAttribute("aria-label", state.messages.landmarkLabel);

  const header = document.createElement("header");
  header.className = "workshop-player__header";
  const packTitle = document.createElement("strong");
  packTitle.className = "workshop-player__title";
  packTitle.textContent = state.pack.title;
  const subtitle = document.createElement("p");
  subtitle.className = "workshop-player__subtitle";
  subtitle.textContent = state.pack.subtitle;
  header.append(packTitle, subtitle);

  const article = document.createElement("article");
  article.id = "workshop-page";
  article.className = "workshop-page";
  article.tabIndex = -1;
  article.setAttribute("aria-labelledby", "workshop-page-title");

  const movement = document.createElement("p");
  movement.className = "workshop-page__movement";
  movement.textContent = `MOUVEMENT ${romanNumeral(state.movement.order)} · ${state.movement.title}`;

  const title = document.createElement("h1");
  title.id = "workshop-page-title";
  title.className = "workshop-page__title";
  title.textContent = state.page.title;

  const body = document.createElement("div");
  body.className = "workshop-page__blocks";
  for (const block of state.page.blocks) {
    body.append(createWorkshopBlock(
      state.page.id,
      block,
      state.responses,
      state.onResponseChange,
      state.onCopyText,
      state.messages,
      state.messages.unsupportedBlockText,
    ));
  }

  article.append(movement, title, body);

  const progress = document.createElement("div");
  progress.className = "workshop-progress";
  progress.setAttribute("aria-label", state.messages.progressLabel);
  const progressText = document.createElement("p");
  progressText.className = "workshop-progress__text";
  progressText.textContent = state.messages.progressText;
  progress.append(progressText);

  const footer = document.createElement("footer");
  footer.className = "workshop-player__footer";
  footer.append(progress, state.controls);
  if (state.exitControl) footer.append(state.exitControl);

  shell.append(header, article, footer);
  target.replaceChildren(shell);
  article.focus();
}

export interface RenderPolarityState {
  readonly polarity: Polarity;
  readonly fallbackImage: string;
  readonly fallbackImageAlt: string;
  readonly landmarkLabel: string;
  readonly onPrevious?: () => void;
  readonly onNext?: () => void;
  readonly closingLabel?: string;
  readonly onClosing?: () => void;
  readonly onBack: () => void;
}

export function PolarityRenderer(target: HTMLElement, state: RenderPolarityState): void {
  const { polarity } = state;
  const article = document.createElement("article");
  article.id = "polarity";
  article.className = "polarity";
  article.tabIndex = -1;
  article.setAttribute("aria-labelledby", "polarity-title");

  const media = document.createElement("figure");
  media.className = "polarity__media";
  const image = document.createElement("img");
  image.className = "polarity__image";
  image.src = polarity.image;
  image.alt = polarity.imageAlt;
  image.addEventListener("error", () => {
    if (image.src === state.fallbackImage) return;
    image.src = state.fallbackImage;
    image.alt = state.fallbackImageAlt;
    media.dataset.fallback = "true";
  }, { once: true });
  media.append(image);

  const veil = document.createElement("div");
  veil.className = "polarity__veil";
  const header = document.createElement("header");
  header.className = "polarity__header";
  const title = document.createElement("h1");
  title.id = "polarity-title";
  title.className = "polarity__title";
  title.textContent = polarity.title;
  const subtitle = document.createElement("p");
  subtitle.className = "polarity__subtitle";
  subtitle.textContent = polarity.subtitle;
  header.append(title, subtitle);

  const bridge = document.createElement("section");
  bridge.className = "polarity__bridge";
  bridge.setAttribute("aria-label", state.landmarkLabel);
  const createPole = (side: "left" | "right"): HTMLElement => {
    const value = polarity[side];
    const pole = document.createElement("div");
    pole.className = `polarity__pole polarity__pole--${side}`;
    const icon = document.createElement("span");
    icon.className = "polarity__icon";
    icon.dataset.icon = value.icon;
    icon.setAttribute("aria-hidden", "true");
    const poleTitle = document.createElement("h2");
    poleTitle.textContent = value.title;
    const text = document.createElement("p");
    text.textContent = value.text;
    pole.append(icon, poleTitle, text);
    return pole;
  };
  const light = document.createElement("div");
  light.className = "polarity__light";
  light.setAttribute("aria-hidden", "true");
  bridge.append(createPole("left"), light, createPole("right"));

  const reflection = document.createElement("div");
  reflection.className = "polarity__reflection";
  const quote = document.createElement("blockquote");
  quote.textContent = polarity.quote;
  const question = document.createElement("p");
  question.className = "polarity__question";
  question.textContent = polarity.question;
  reflection.append(quote, question);

  const actions = document.createElement("nav");
  actions.className = "polarity__actions";
  const explore = document.createElement("a");
  explore.className = "polarity__action polarity__action--article";
  explore.href = polarity.article;
  explore.textContent = polarity.actions.article;
  if (/^https?:\/\//.test(polarity.article)) {
    explore.target = "_blank";
    explore.rel = "noopener noreferrer";
  }
  const onPrevious = state.onPrevious;
  const previous = onPrevious ? document.createElement("button") : undefined;
  if (previous && onPrevious) {
    previous.type = "button";
    previous.dataset.polarityAction = "previous";
    previous.textContent = polarity.actions.previous;
    previous.addEventListener("click", onPrevious);
  }
  const onNext = state.onNext;
  const next = onNext ? document.createElement("button") : undefined;
  if (next && onNext) {
    next.type = "button";
    next.dataset.polarityAction = "next";
    next.textContent = polarity.actions.next;
    next.addEventListener("click", onNext);
  }
  const back = document.createElement("button");
  back.type = "button";
  back.dataset.polarityAction = "back";
  back.textContent = polarity.actions.back;
  back.addEventListener("click", state.onBack);
  actions.append(explore);
  if (previous) actions.append(previous);
  if (next) actions.append(next);
  if (state.closingLabel && state.onClosing) {
    const closing = document.createElement("button");
    closing.type = "button";
    closing.dataset.polarityAction = "closing";
    closing.textContent = state.closingLabel;
    closing.addEventListener("click", state.onClosing);
    actions.append(closing);
  }
  actions.append(back);

  veil.append(header, bridge, reflection, actions);
  article.append(media, veil);
  target.replaceChildren(article);
  article.focus();
}

export const renderPolarity = PolarityRenderer;

export interface RenderLivingCardState {
  readonly card: LivingCard;
  readonly fallbackImage: string;
  readonly fallbackImageAlt: string;
  readonly landmarkLabel: string;
  readonly continueLabel: string;
  readonly previousLabel: string;
  readonly backLabel: string;
  readonly finishLabel: string;
  readonly onContinue?: () => void;
  readonly onPrevious?: () => void;
  readonly onFinish?: () => void;
  readonly onBack: () => void;
}

export function LivingCardRenderer(target: HTMLElement, state: RenderLivingCardState): void {
  const { card } = state;
  const article = document.createElement("article");
  article.id = "living-card";
  article.className = "living-card";
  article.tabIndex = -1;
  article.setAttribute("aria-labelledby", "living-card-title");

  const media = document.createElement("figure");
  media.className = "living-card__media";
  const image = document.createElement("img");
  image.className = "living-card__image";
  image.src = card.image;
  image.alt = card.imageAlt;
  image.addEventListener("error", () => {
    if (image.src === state.fallbackImage) return;
    image.src = state.fallbackImage;
    image.alt = state.fallbackImageAlt;
    media.dataset.fallback = "true";
  }, { once: true });
  media.append(image);

  const content = document.createElement("div");
  content.className = "living-card__content";
  content.setAttribute("aria-label", state.landmarkLabel);

  const symbol = document.createElement("p");
  symbol.className = "living-card__symbol";
  symbol.textContent = card.symbol;
  const title = document.createElement("h1");
  title.id = "living-card-title";
  title.className = "living-card__title";
  title.textContent = card.title;
  const subtitle = document.createElement("p");
  subtitle.className = "living-card__subtitle";
  subtitle.textContent = card.subtitle;

  const quote = document.createElement("blockquote");
  quote.className = "living-card__quote";
  quote.textContent = card.quote;
  const motto = document.createElement("p");
  motto.className = "living-card__motto";
  motto.textContent = card.motto;

  const metadata = document.createElement("dl");
  metadata.className = "living-card__metadata";
  for (const item of card.metadata) {
    const term = document.createElement("dt");
    term.textContent = item.label;
    const value = document.createElement("dd");
    value.textContent = item.value;
    metadata.append(term, value);
  }

  const actions = document.createElement("nav");
  actions.className = "living-card__actions";
  if (state.onPrevious) {
    const previous = document.createElement("button");
    previous.type = "button";
    previous.dataset.cardAction = "previous";
    previous.textContent = state.previousLabel;
    previous.addEventListener("click", state.onPrevious);
    actions.append(previous);
  }
  const primary = document.createElement("button");
  primary.type = "button";
  primary.dataset.cardAction = state.onContinue ? "continue" : "finish";
  primary.textContent = state.onContinue ? state.continueLabel : state.finishLabel;
  primary.addEventListener("click", state.onContinue ?? state.onFinish ?? state.onBack);
  actions.append(primary);

  const back = document.createElement("button");
  back.type = "button";
  back.dataset.cardAction = "back";
  back.textContent = state.backLabel;
  back.addEventListener("click", state.onBack);
  actions.append(back);

  content.append(symbol, title, subtitle, quote, motto, metadata, actions);
  article.append(media, content);
  target.replaceChildren(article);
  article.focus();
}

export const renderLivingCard = LivingCardRenderer;

export interface RenderPolarityClosureState {
  readonly image: string;
  readonly imageAlt: string;
  readonly backLabel: string;
  readonly continueLabel: string;
  readonly continueHref: string;
  readonly onBack: () => void;
}

export function renderPolarityClosure(
  target: HTMLElement,
  state: RenderPolarityClosureState,
): void {
  const section = document.createElement("section");
  section.id = "polarity-closing";
  section.className = "polarity-closing";
  section.tabIndex = -1;
  const image = document.createElement("img");
  image.className = "polarity-closing__image";
  image.src = state.image;
  image.alt = state.imageAlt;
  const actions = document.createElement("nav");
  actions.className = "polarity-closing__actions";
  const continuation = document.createElement("a");
  continuation.className = "polarity-closing__continue";
  continuation.href = state.continueHref;
  continuation.textContent = state.continueLabel;
  const back = document.createElement("button");
  back.type = "button";
  back.className = "polarity-closing__back";
  back.textContent = state.backLabel;
  back.addEventListener("click", state.onBack);
  actions.append(continuation, back);
  section.append(image, actions);
  target.replaceChildren(section);
  section.focus();
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
