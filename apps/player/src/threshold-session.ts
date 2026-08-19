export const PUBLIC_THRESHOLD_SESSION_KEY = "ine:public-threshold:v1:recits-vivants";

export interface ThresholdSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class PublicThresholdSession {
  readonly #storage: ThresholdSessionStorage | null;

  constructor(storage: ThresholdSessionStorage | null) {
    this.#storage = storage;
  }

  hasCrossed(): boolean {
    if (!this.#storage) return false;

    try {
      return this.#storage.getItem(PUBLIC_THRESHOLD_SESSION_KEY) === "crossed";
    } catch {
      return false;
    }
  }

  markCrossed(): void {
    if (!this.#storage) return;

    try {
      this.#storage.setItem(PUBLIC_THRESHOLD_SESSION_KEY, "crossed");
    } catch {
      return;
    }
  }
}

export function createBrowserPublicThresholdSession(): PublicThresholdSession {
  try {
    return new PublicThresholdSession(globalThis.sessionStorage ?? null);
  } catch {
    return new PublicThresholdSession(null);
  }
}
