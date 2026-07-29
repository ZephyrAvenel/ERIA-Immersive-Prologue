export const READING_PROGRESS_SCHEMA_VERSION = 1;

export interface ReadingProgress {
  readonly schemaVersion: typeof READING_PROGRESS_SCHEMA_VERSION;
  readonly packId: string;
  readonly packVersion: string;
  readonly sceneId: string;
  readonly sceneIndex: number;
  readonly updatedAt: string;
  readonly completed: boolean;
}

export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ProgressSceneReference {
  readonly id: string;
}

export interface CreateReadingProgressInput {
  readonly packId: string;
  readonly packVersion: string;
  readonly sceneId: string;
  readonly sceneIndex: number;
  readonly completed: boolean;
}

function progressKey(packId: string): string {
  return `ine:progress:v${READING_PROGRESS_SCHEMA_VERSION}:${packId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidProgress(value: unknown, packId: string): value is ReadingProgress {
  if (!isRecord(value)) return false;
  const sceneIndex = value.sceneIndex;
  return (
    value.schemaVersion === READING_PROGRESS_SCHEMA_VERSION &&
    value.packId === packId &&
    typeof value.packVersion === "string" &&
    value.packVersion.length > 0 &&
    typeof value.sceneId === "string" &&
    value.sceneId.length > 0 &&
    Number.isInteger(sceneIndex) &&
    typeof sceneIndex === "number" &&
    sceneIndex >= 0 &&
    typeof value.updatedAt === "string" &&
    value.updatedAt.length > 0 &&
    typeof value.completed === "boolean"
  );
}

export class ReadingProgressStore {
  readonly #storage: ProgressStorage | null;

  constructor(storage: ProgressStorage | null) {
    this.#storage = storage;
  }

  load(packId: string): ReadingProgress | null {
    if (!this.#storage) return null;

    try {
      const raw = this.#storage.getItem(progressKey(packId));
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isValidProgress(parsed, packId) ? parsed : null;
    } catch {
      return null;
    }
  }

  save(progress: ReadingProgress): void {
    if (!this.#storage) return;

    try {
      this.#storage.setItem(progressKey(progress.packId), JSON.stringify(progress));
    } catch {
      return;
    }
  }

  clear(packId: string): void {
    if (!this.#storage) return;

    try {
      this.#storage.removeItem(progressKey(packId));
    } catch {
      return;
    }
  }
}

export function createReadingProgress(
  input: CreateReadingProgressInput,
  now: () => string = () => new Date().toISOString(),
): ReadingProgress {
  return {
    schemaVersion: READING_PROGRESS_SCHEMA_VERSION,
    packId: input.packId,
    packVersion: input.packVersion,
    sceneId: input.sceneId,
    sceneIndex: input.sceneIndex,
    updatedAt: now(),
    completed: input.completed,
  };
}

export function createBrowserReadingProgressStore(): ReadingProgressStore {
  try {
    return new ReadingProgressStore(globalThis.localStorage ?? null);
  } catch {
    return new ReadingProgressStore(null);
  }
}

export function resolveProgressSceneIndex(
  progress: ReadingProgress,
  scenes: readonly ProgressSceneReference[],
): number | null {
  const index = scenes.findIndex((scene) => scene.id === progress.sceneId);
  return index >= 0 ? index : null;
}

export function getReadingProgressStorageKey(packId: string): string {
  return progressKey(packId);
}
