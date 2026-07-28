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

  return data as NarrativePack;
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
