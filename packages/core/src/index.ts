export interface NarrativeScene {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly image?: string;
  readonly imageAlt?: string;
}

export interface NarrativePack {
  readonly format: "ine-narrative-pack";
  readonly version: "1.0";
  readonly id: string;
  readonly title: string;
  readonly language: string;
  readonly startScene: string;
  readonly scenes: readonly NarrativeScene[];
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export type NarrativePackValidator = (value: unknown) => ValidationResult;

export type AssetKind = "images" | "audio" | "video" | "icons";

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
    throw new Error(`Narrative Pack request failed (${response.status}).`);
  }

  const data: unknown = await response.json();
  const result = validate(data);
  if (!result.valid) {
    throw new Error(`Invalid Narrative Pack: ${result.errors.join("; ")}`);
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
      throw new Error(`Start scene "${pack.startScene}" does not exist.`);
    }
    this.#index = startIndex;
  }

  get currentScene(): NarrativeScene {
    const scene = this.#pack.scenes[this.#index];
    if (!scene) {
      throw new Error("Narrative state points to an unknown scene.");
    }
    return scene;
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

  previous(): void {
    if (this.canGoPrevious) this.#index -= 1;
  }

  next(): void {
    if (this.canGoNext) this.#index += 1;
  }
}
