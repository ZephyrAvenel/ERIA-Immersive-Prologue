export const PUBLIC_THRESHOLD_SESSION_KEY = "ine:public-threshold:v1:recits-vivants";
export const PUBLIC_THRESHOLD_SKIP_HOME_INTRO_KEY = `${PUBLIC_THRESHOLD_SESSION_KEY}:skip-home-intro-once`;

export interface ThresholdSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
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

  markHomeIntroSkippedOnce(): void {
    if (!this.#storage || !this.hasCrossed()) return;

    try {
      this.#storage.setItem(PUBLIC_THRESHOLD_SKIP_HOME_INTRO_KEY, "pending");
    } catch {
      return;
    }
  }

  consumeHomeIntroSkip(): boolean {
    if (!this.#storage) return false;

    try {
      if (this.#storage.getItem(PUBLIC_THRESHOLD_SKIP_HOME_INTRO_KEY) !== "pending") return false;
      this.#storage.removeItem(PUBLIC_THRESHOLD_SKIP_HOME_INTRO_KEY);
      return true;
    } catch {
      return false;
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
