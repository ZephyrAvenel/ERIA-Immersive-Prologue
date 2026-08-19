export const TRANSITION_TYPES = ["none", "fade", "crossfade", "slide"] as const;
export const TRANSITION_EASINGS = ["linear", "ease", "ease-in", "ease-out", "ease-in-out"] as const;
export const MAX_TRANSITION_DURATION_MS = 3_000;
export const DEFAULT_TRANSITION_DURATION_MS = 450;

export type TransitionType = (typeof TRANSITION_TYPES)[number];
export type TransitionEasing = (typeof TRANSITION_EASINGS)[number];
export type TransitionDirection = "none" | "forward" | "backward";

export interface SceneTransition {
  readonly type: TransitionType;
  readonly durationMs?: number;
  readonly easing?: TransitionEasing;
}

export interface NormalizedSceneTransition {
  readonly type: TransitionType;
  readonly durationMs: number;
  readonly easing: TransitionEasing;
}

export interface NarrativeIntro {
  readonly lines: readonly string[];
  readonly title?: string;
  readonly actionLabel: string;
}

export interface NarrativePresentation {
  readonly defaultTransition?: SceneTransition;
  readonly intro?: NarrativeIntro;
}

export type NarrativePackLayout = "image-then-text";

export interface NarrativeSceneLink {
  readonly label: string;
  readonly href: string;
  readonly description?: string;
}

export interface NarrativeScene {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly imageDisplayMode?: ImageDisplayMode;
  readonly links?: readonly NarrativeSceneLink[];
  readonly transition?: SceneTransition;
}

export interface NarrativePack {
  readonly format: "ine-narrative-pack";
  readonly version: "1.0";
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly description?: string;
  readonly coverImage?: string;
  readonly coverImageAlt?: string;
  readonly layout?: NarrativePackLayout;
  readonly language: string;
  readonly startScene: string;
  readonly presentation?: NarrativePresentation;
  readonly scenes: readonly NarrativeScene[];
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export type NarrativePackValidator = (value: unknown) => ValidationResult;
export type PolarityValidator = (value: unknown) => ValidationResult;
export type LivingCardValidator = (value: unknown) => ValidationResult;
export type WorkshopPackValidator = (value: unknown) => ValidationResult;

export interface PolarityPole {
  readonly title: string;
  readonly icon: string;
  readonly text: string;
}

export interface PolarityActions {
  readonly article: string;
  readonly next: string;
  readonly previous: string;
  readonly back: string;
}

export interface Polarity {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly left: PolarityPole;
  readonly right: PolarityPole;
  readonly quote: string;
  readonly question: string;
  readonly article: string;
  readonly previous: string | null;
  readonly next: string | null;
  readonly actions: PolarityActions;
}

export interface PolarityPackItem {
  readonly id: string;
  readonly source: string;
}

export interface PolarityPack {
  readonly format: "ine-polarity-pack";
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly type: "contemplatif";
  readonly version: string;
  readonly author: string;
  readonly language: string;
  readonly estimatedDuration: number;
  readonly entry: string;
  readonly entryAction: string;
  readonly articleUrl: string;
  readonly polarities: readonly PolarityPackItem[];
  readonly coverImage: string;
  readonly coverImageAlt: string;
  readonly closingImage: string;
  readonly closingImageAlt: string;
  readonly closingAction: string;
  readonly closingBackAction: string;
  readonly fallbackImage: string;
  readonly fallbackImageAlt: string;
  readonly landmarkLabel: string;
}

export interface LivingCardMetadataItem {
  readonly label: string;
  readonly value: string;
}

export interface LivingCardLocaleContent {
  readonly title?: string;
  readonly subtitle?: string;
  readonly quote?: string;
  readonly motto?: string;
}

export interface LivingCard {
  readonly id: string;
  readonly type: "living-card";
  readonly title: string;
  readonly subtitle: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly symbol: string;
  readonly quote: string;
  readonly motto: string;
  readonly metadata: readonly LivingCardMetadataItem[];
  readonly previous: string | null;
  readonly next: string | null;
  readonly locale: {
    readonly fr: LivingCardLocaleContent;
    readonly en: LivingCardLocaleContent;
  };
}

export interface LivingCardPackItem {
  readonly id: string;
  readonly source: string;
}

export interface LivingCardPackActions {
  readonly continue: string;
  readonly previous: string;
  readonly back: string;
  readonly finish: string;
}

export interface LivingCardPack {
  readonly format: "ine-living-card-pack";
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly type: "symbolique";
  readonly version: string;
  readonly author: string;
  readonly language: string;
  readonly estimatedDuration: number;
  readonly entry: string;
  readonly entryAction: string;
  readonly cards: readonly LivingCardPackItem[];
  readonly coverImage: string;
  readonly coverImageAlt: string;
  readonly fallbackImage: string;
  readonly fallbackImageAlt: string;
  readonly landmarkLabel: string;
  readonly actions: LivingCardPackActions;
}

export type WorkshopBlockType = "text" | "textarea" | "choice" | "reveal" | "promptCopy" | "recall";

export interface WorkshopTextBlock {
  readonly id: string;
  readonly type: "text";
  readonly text: string;
}

export interface WorkshopTextareaBlock {
  readonly id: string;
  readonly type: "textarea";
  readonly label: string;
  readonly placeholder?: string;
  readonly required?: boolean;
}

export interface WorkshopChoiceOption {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

export interface WorkshopChoiceBlock {
  readonly id: string;
  readonly type: "choice";
  readonly label: string;
  readonly options: readonly WorkshopChoiceOption[];
  readonly allowMultiple?: boolean;
}

export interface WorkshopRevealBlock {
  readonly id: string;
  readonly type: "reveal";
  readonly label: string;
  readonly content: string;
}

export interface WorkshopPromptCopyBlock {
  readonly id: string;
  readonly type: "promptCopy";
  readonly label: string;
  readonly text: string;
  readonly description?: string;
}

export interface WorkshopRecallBlock {
  readonly id: string;
  readonly type: "recall";
  readonly sourceBlockId: string;
  readonly label?: string;
  readonly emptyText?: string;
}

export type WorkshopBlock =
  | WorkshopTextBlock
  | WorkshopTextareaBlock
  | WorkshopChoiceBlock
  | WorkshopRevealBlock
  | WorkshopPromptCopyBlock
  | WorkshopRecallBlock;

export interface WorkshopMovement {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly description?: string;
}

export interface WorkshopPage {
  readonly id: string;
  readonly movementId: string;
  readonly order: number;
  readonly title: string;
  readonly blocks: readonly WorkshopBlock[];
}

export interface WorkshopPack {
  readonly format: "ine-workshop-pack";
  readonly version: "1.0";
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly subtitle: string;
  readonly language: string;
  readonly startPage: string;
  readonly movements: readonly WorkshopMovement[];
  readonly pages: readonly WorkshopPage[];
}

export type AssetKind = "images" | "audio" | "video" | "icons";
export type ImageDisplayMode = "contain" | "cover" | "fill" | "immersive";

export const DEFAULT_SCENE_TRANSITION: NormalizedSceneTransition = {
  type: "none",
  durationMs: 0,
  easing: "ease-in-out",
};

export function normalizeSceneTransition(transition?: SceneTransition): NormalizedSceneTransition {
  if (!transition) return DEFAULT_SCENE_TRANSITION;

  if (transition.type === "none") {
    return {
      type: "none",
      durationMs: 0,
      easing: transition.easing ?? DEFAULT_SCENE_TRANSITION.easing,
    };
  }

  return {
    type: transition.type,
    durationMs: transition.durationMs ?? DEFAULT_TRANSITION_DURATION_MS,
    easing: transition.easing ?? DEFAULT_SCENE_TRANSITION.easing,
  };
}

export function getSceneTransition(pack: NarrativePack, scene: NarrativeScene): NormalizedSceneTransition {
  return normalizeSceneTransition(scene.transition ?? pack.presentation?.defaultTransition);
}

export function getTransitionDirection(fromIndex: number, toIndex: number): TransitionDirection {
  if (toIndex > fromIndex) return "forward";
  if (toIndex < fromIndex) return "backward";
  return "none";
}

export class AssetManager {
  readonly #baseUrl: URL;

  constructor(baseUrl: URL) {
    this.#baseUrl = new URL(".", baseUrl);
  }

  resolve(path: string): string {
    return new URL(path, this.#baseUrl).href;
  }

  image(path: string): string {
    return this.resolve(path);
  }

  audio(path: string): string {
    return this.resolve(path);
  }

  video(path: string): string {
    return this.resolve(path);
  }

  icon(path: string): string {
    return this.resolve(path);
  }

  async preloadImage(path: string): Promise<void> {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error(`Image asset failed to load: ${path}`)), {
        once: true,
      });
    });
    image.src = this.image(path);
    await loaded;
  }

  async preloadImages(paths: readonly string[]): Promise<void> {
    await Promise.all(paths.map((path) => this.preloadImage(path)));
  }
}

export async function loadNarrativePack(
  source: URL,
  validate: NarrativePackValidator,
): Promise<NarrativePack> {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error("INE_PACK_REQUEST_FAILED");
  }

  const data: unknown = await response.json();
  const result = validate(data);
  if (!result.valid) {
    throw new Error("INE_PACK_INVALID");
  }

  const pack = data as NarrativePack;
  const assets = new AssetManager(source);
  const imagePaths = pack.scenes.flatMap((scene) => (scene.image ? [scene.image] : []));
  void assets.preloadImages(imagePaths).catch(() => undefined);

  return {
    ...pack,
    scenes: pack.scenes.map((scene) => ({
      ...scene,
      image: scene.image ? assets.image(scene.image) : undefined,
    })),
  };
}

export async function detectPackFormat(source: URL): Promise<string> {
  const response = await fetch(source);
  if (!response.ok) throw new Error("INE_PACK_REQUEST_FAILED");
  const value: unknown = await response.json();
  if (typeof value !== "object" || value === null || !("format" in value) || typeof value.format !== "string") {
    throw new Error("INE_PACK_FORMAT_MISSING");
  }
  return value.format;
}

export async function loadPolarityPack(source: URL): Promise<PolarityPack> {
  const response = await fetch(source);
  if (!response.ok) throw new Error("INE_POLARITY_PACK_REQUEST_FAILED");
  const value: unknown = await response.json();
  if (
    typeof value !== "object" ||
    value === null ||
    !("format" in value) ||
    value.format !== "ine-polarity-pack" ||
    !("id" in value) || typeof value.id !== "string" ||
    !("title" in value) || typeof value.title !== "string" ||
    !("subtitle" in value) || typeof value.subtitle !== "string" ||
    !("description" in value) || typeof value.description !== "string" ||
    !("type" in value) || value.type !== "contemplatif" ||
    !("version" in value) || typeof value.version !== "string" ||
    !("author" in value) || typeof value.author !== "string" ||
    !("language" in value) || typeof value.language !== "string" ||
    !("estimatedDuration" in value) || typeof value.estimatedDuration !== "number" ||
    !("entry" in value) || typeof value.entry !== "string" ||
    !("entryAction" in value) || typeof value.entryAction !== "string" ||
    !("articleUrl" in value) || typeof value.articleUrl !== "string" || value.articleUrl.length === 0 ||
    !("coverImage" in value) || typeof value.coverImage !== "string" ||
    !("coverImageAlt" in value) || typeof value.coverImageAlt !== "string" ||
    !("closingImage" in value) || typeof value.closingImage !== "string" ||
    !("closingImageAlt" in value) || typeof value.closingImageAlt !== "string" ||
    !("closingAction" in value) || typeof value.closingAction !== "string" ||
    !("closingBackAction" in value) || typeof value.closingBackAction !== "string" ||
    !("polarities" in value) ||
    !Array.isArray(value.polarities) ||
    value.polarities.length === 0 ||
    !value.polarities.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof item.id === "string" &&
        "source" in item &&
        typeof item.source === "string",
    ) ||
    !("fallbackImage" in value) ||
    typeof value.fallbackImage !== "string" ||
    !("fallbackImageAlt" in value) ||
    typeof value.fallbackImageAlt !== "string" ||
    !("landmarkLabel" in value) ||
    typeof value.landmarkLabel !== "string"
  ) {
    throw new Error("INE_POLARITY_PACK_INVALID");
  }
  const pack = value as PolarityPack;
  if (!pack.polarities.some((item) => item.id === pack.entry)) {
    throw new Error("INE_POLARITY_ENTRY_MISSING");
  }
  const assets = new AssetManager(source);
  return {
    ...pack,
    coverImage: assets.image(pack.coverImage),
    closingImage: assets.image(pack.closingImage),
    fallbackImage: assets.image(pack.fallbackImage),
    polarities: pack.polarities.map((item) => ({ ...item, source: assets.resolve(item.source) })),
  };
}

export async function loadPolarity(source: URL, validate: PolarityValidator): Promise<Polarity> {
  const response = await fetch(source);
  if (!response.ok) throw new Error("INE_POLARITY_REQUEST_FAILED");
  const value: unknown = await response.json();
  const result = validate(value);
  if (!result.valid) throw new Error("INE_POLARITY_INVALID");
  const polarity = value as Polarity;
  return { ...polarity, image: new AssetManager(source).image(polarity.image) };
}

export async function loadLivingCardPack(source: URL): Promise<LivingCardPack> {
  const response = await fetch(source);
  if (!response.ok) throw new Error("INE_LIVING_CARD_PACK_REQUEST_FAILED");
  const value: unknown = await response.json();
  if (
    typeof value !== "object" ||
    value === null ||
    !("format" in value) ||
    value.format !== "ine-living-card-pack" ||
    !("id" in value) || typeof value.id !== "string" ||
    !("title" in value) || typeof value.title !== "string" ||
    !("subtitle" in value) || typeof value.subtitle !== "string" ||
    !("description" in value) || typeof value.description !== "string" ||
    !("type" in value) || value.type !== "symbolique" ||
    !("version" in value) || typeof value.version !== "string" ||
    !("author" in value) || typeof value.author !== "string" ||
    !("language" in value) || typeof value.language !== "string" ||
    !("estimatedDuration" in value) || typeof value.estimatedDuration !== "number" ||
    !("entry" in value) || typeof value.entry !== "string" ||
    !("entryAction" in value) || typeof value.entryAction !== "string" ||
    !("coverImage" in value) || typeof value.coverImage !== "string" ||
    !("coverImageAlt" in value) || typeof value.coverImageAlt !== "string" ||
    !("cards" in value) ||
    !Array.isArray(value.cards) ||
    value.cards.length === 0 ||
    !value.cards.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof item.id === "string" &&
        "source" in item &&
        typeof item.source === "string",
    ) ||
    !("fallbackImage" in value) ||
    typeof value.fallbackImage !== "string" ||
    !("fallbackImageAlt" in value) ||
    typeof value.fallbackImageAlt !== "string" ||
    !("landmarkLabel" in value) ||
    typeof value.landmarkLabel !== "string" ||
    !("actions" in value) ||
    typeof value.actions !== "object" ||
    value.actions === null ||
    !["continue", "previous", "back", "finish"].every(
      (key) => key in (value.actions as Record<string, unknown>) &&
        typeof (value.actions as Record<string, unknown>)[key] === "string" &&
        ((value.actions as Record<string, unknown>)[key] as string).length > 0,
    )
  ) {
    throw new Error("INE_LIVING_CARD_PACK_INVALID");
  }
  const pack = value as LivingCardPack;
  if (!pack.cards.some((item) => item.id === pack.entry)) {
    throw new Error("INE_LIVING_CARD_ENTRY_MISSING");
  }
  const assets = new AssetManager(source);
  return {
    ...pack,
    coverImage: assets.image(pack.coverImage),
    fallbackImage: assets.image(pack.fallbackImage),
    cards: pack.cards.map((item) => ({ ...item, source: assets.resolve(item.source) })),
  };
}

export async function loadLivingCard(source: URL, validate: LivingCardValidator): Promise<LivingCard> {
  const response = await fetch(source);
  if (!response.ok) throw new Error("INE_LIVING_CARD_REQUEST_FAILED");
  const value: unknown = await response.json();
  const result = validate(value);
  if (!result.valid) throw new Error("INE_LIVING_CARD_INVALID");
  const card = value as LivingCard;
  return { ...card, image: new AssetManager(source).image(card.image) };
}

export async function loadWorkshopPack(
  source: URL,
  validate: WorkshopPackValidator,
): Promise<WorkshopPack> {
  const response = await fetch(source);
  if (!response.ok) throw new Error("INE_WORKSHOP_PACK_REQUEST_FAILED");
  const value: unknown = await response.json();
  const result = validate(value);
  if (!result.valid) throw new Error("INE_WORKSHOP_PACK_INVALID");
  return value as WorkshopPack;
}

export class WorkshopEngine {
  readonly #pack: WorkshopPack;
  #index: number;

  constructor(pack: WorkshopPack) {
    this.#pack = pack;
    const startIndex = pack.pages.findIndex((page) => page.id === pack.startPage);
    if (startIndex < 0) {
      throw new Error("INE_WORKSHOP_START_PAGE_MISSING");
    }
    this.#index = startIndex;
  }

  get currentPage(): WorkshopPage {
    const page = this.#pack.pages[this.#index];
    if (!page) {
      throw new Error("INE_WORKSHOP_PAGE_STATE_INVALID");
    }
    return page;
  }

  get currentPageIndex(): number {
    return this.#index;
  }

  get pageCount(): number {
    return this.#pack.pages.length;
  }

  get canGoPrevious(): boolean {
    return this.#index > 0;
  }

  get canGoNext(): boolean {
    return this.#index < this.#pack.pages.length - 1;
  }

  findPageIndex(pageId: string): number {
    return this.#pack.pages.findIndex((page) => page.id === pageId);
  }

  goToPage(pageId: string): boolean {
    const index = this.findPageIndex(pageId);
    if (index < 0) return false;
    this.#index = index;
    return true;
  }

  previous(): void {
    if (this.canGoPrevious) this.#index -= 1;
  }

  next(): void {
    if (this.canGoNext) this.#index += 1;
  }
}

export class NarrativeEngine {
  readonly #pack: NarrativePack;
  #index: number;

  constructor(pack: NarrativePack) {
    this.#pack = pack;
    const startIndex = pack.scenes.findIndex((scene) => scene.id === pack.startScene);
    if (startIndex < 0) {
      throw new Error("INE_START_SCENE_MISSING");
    }
    this.#index = startIndex;
  }

  get currentScene(): NarrativeScene {
    const scene = this.#pack.scenes[this.#index];
    if (!scene) {
      throw new Error("INE_SCENE_STATE_INVALID");
    }
    return scene;
  }

  get currentSceneIndex(): number {
    return this.#index;
  }

  get sceneCount(): number {
    return this.#pack.scenes.length;
  }

  get canGoPrevious(): boolean {
    return this.#index > 0;
  }

  get canGoNext(): boolean {
    return this.#index < this.#pack.scenes.length - 1;
  }

  get progress(): number {
    return (this.#index + 1) / this.#pack.scenes.length;
  }

  transitionForScene(scene: NarrativeScene): NormalizedSceneTransition {
    return getSceneTransition(this.#pack, scene);
  }

  transitionForSceneIndex(index: number): NormalizedSceneTransition {
    const scene = this.#pack.scenes[index];
    if (!scene) {
      throw new Error("INE_SCENE_STATE_INVALID");
    }
    return this.transitionForScene(scene);
  }

  findSceneIndex(sceneId: string): number {
    return this.#pack.scenes.findIndex((scene) => scene.id === sceneId);
  }

  goToScene(sceneId: string): boolean {
    const index = this.findSceneIndex(sceneId);
    if (index < 0) return false;
    this.#index = index;
    return true;
  }

  previous(): void {
    if (this.canGoPrevious) this.#index -= 1;
  }

  next(): void {
    if (this.canGoNext) this.#index += 1;
  }
}
