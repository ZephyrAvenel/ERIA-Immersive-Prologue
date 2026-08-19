import type { WorkshopPage } from "@ine/core";

export const WORKSHOP_PROGRESS_SCHEMA_VERSION = 1;

export type WorkshopStoredResponseValue = string | boolean;

export interface WorkshopProgress {
  readonly schemaVersion: typeof WORKSHOP_PROGRESS_SCHEMA_VERSION;
  readonly workshopId: string;
  readonly workshopVersion: string;
  readonly pageId: string;
  readonly updatedAt: string;
  readonly completed: boolean;
  readonly responses: Readonly<Record<string, WorkshopStoredResponseValue>>;
}

export interface WorkshopProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface CreateWorkshopProgressInput {
  readonly workshopId: string;
  readonly workshopVersion: string;
  readonly pageId: string;
  readonly completed: boolean;
  readonly responses: ReadonlyMap<string, WorkshopStoredResponseValue>;
}

function workshopProgressKey(workshopId: string): string {
  return `ine:workshop-progress:v${WORKSHOP_PROGRESS_SCHEMA_VERSION}:${workshopId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectPersistableBlockTypes(
  pages: readonly WorkshopPage[],
): ReadonlyMap<string, "textarea" | "choice" | "reveal"> {
  const blocks = new Map<string, "textarea" | "choice" | "reveal">();
  for (const page of pages) {
    for (const block of page.blocks) {
      if (block.type === "textarea" || block.type === "choice" || block.type === "reveal") {
        blocks.set(block.id, block.type);
      }
    }
  }
  return blocks;
}

function sanitizeResponses(
  value: unknown,
  pages: readonly WorkshopPage[],
): Record<string, WorkshopStoredResponseValue> {
  if (!isRecord(value)) return {};

  const blockTypes = collectPersistableBlockTypes(pages);
  const responses: Record<string, WorkshopStoredResponseValue> = {};
  for (const [blockId, response] of Object.entries(value)) {
    const blockType = blockTypes.get(blockId);
    if ((blockType === "textarea" || blockType === "choice") && typeof response === "string") {
      responses[blockId] = response;
    }
    if (blockType === "reveal" && typeof response === "boolean") {
      responses[blockId] = response;
    }
  }
  return responses;
}

function isValidProgressEnvelope(
  value: unknown,
  workshopId: string,
  workshopVersion: string,
  pages: readonly WorkshopPage[],
): value is Omit<WorkshopProgress, "responses"> & { readonly responses: unknown } {
  if (!isRecord(value)) return false;
  return (
    value.schemaVersion === WORKSHOP_PROGRESS_SCHEMA_VERSION &&
    value.workshopId === workshopId &&
    value.workshopVersion === workshopVersion &&
    typeof value.pageId === "string" &&
    pages.some((page) => page.id === value.pageId) &&
    typeof value.updatedAt === "string" &&
    value.updatedAt.length > 0 &&
    typeof value.completed === "boolean" &&
    "responses" in value
  );
}

export function createWorkshopProgress(
  input: CreateWorkshopProgressInput,
  now: () => string = () => new Date().toISOString(),
): WorkshopProgress {
  return {
    schemaVersion: WORKSHOP_PROGRESS_SCHEMA_VERSION,
    workshopId: input.workshopId,
    workshopVersion: input.workshopVersion,
    pageId: input.pageId,
    updatedAt: now(),
    completed: input.completed,
    responses: Object.fromEntries(input.responses),
  };
}

export class WorkshopProgressStore {
  readonly #storage: WorkshopProgressStorage | null;

  constructor(storage: WorkshopProgressStorage | null) {
    this.#storage = storage;
  }

  load(
    workshopId: string,
    workshopVersion: string,
    pages: readonly WorkshopPage[],
  ): WorkshopProgress | null {
    if (!this.#storage) return null;

    try {
      const raw = this.#storage.getItem(workshopProgressKey(workshopId));
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isValidProgressEnvelope(parsed, workshopId, workshopVersion, pages)) return null;
      return {
        ...parsed,
        responses: sanitizeResponses(parsed.responses, pages),
      };
    } catch {
      return null;
    }
  }

  save(progress: WorkshopProgress): void {
    if (!this.#storage) return;

    try {
      this.#storage.setItem(workshopProgressKey(progress.workshopId), JSON.stringify(progress));
    } catch {
      return;
    }
  }

  clear(workshopId: string): void {
    if (!this.#storage) return;

    try {
      this.#storage.removeItem(workshopProgressKey(workshopId));
    } catch {
      return;
    }
  }
}

export function createBrowserWorkshopProgressStore(): WorkshopProgressStore {
  try {
    return new WorkshopProgressStore(globalThis.localStorage ?? null);
  } catch {
    return new WorkshopProgressStore(null);
  }
}

export function getWorkshopProgressStorageKey(workshopId: string): string {
  return workshopProgressKey(workshopId);
}
