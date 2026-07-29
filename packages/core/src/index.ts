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

export interface NarrativeScene {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly imageDisplayMode?: ImageDisplayMode;
  readonly transition?: SceneTransition;
}

export interface NarrativePack {
  readonly format: "ine-narrative-pack";
  readonly version: "1.0";
  readonly id: string;
  readonly title: string;
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
