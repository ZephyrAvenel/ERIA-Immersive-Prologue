import type { WorkshopPack, WorkshopPage } from "@ine/core";
import {
  WORKSHOP_PROGRESS_SCHEMA_VERSION,
  type WorkshopProgress,
  type WorkshopStoredResponseValue,
} from "./workshop-progress.js";

export const WORKSHOP_EXPORT_FORMAT = "ine-workshop-export";
export const WORKSHOP_EXPORT_FORMAT_VERSION = 1;
export const WORKSHOP_IMPORT_MAX_BYTES = 2_097_152;

export interface WorkshopExportFile {
  readonly format: typeof WORKSHOP_EXPORT_FORMAT;
  readonly formatVersion: typeof WORKSHOP_EXPORT_FORMAT_VERSION;
  readonly exportedAt: string;
  readonly workshop: {
    readonly id: string;
    readonly manifestVersion: string;
    readonly title: string;
  };
  readonly progress: WorkshopProgress;
}

export interface WorkshopImportPreview {
  readonly progress: WorkshopProgress;
  readonly exportedAt: string;
  readonly responseCount: number;
  readonly pageIndex: number;
}

export type WorkshopImportResult =
  | { readonly valid: true; readonly preview: WorkshopImportPreview }
  | { readonly valid: false; readonly reason: "invalid" | "workshop" | "version" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const received = Object.keys(value).sort();
  const expected = [...keys].sort();
  return received.length === expected.length && received.every((key, index) => key === expected[index]);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function responseBlocks(pages: readonly WorkshopPage[]): Map<string, WorkshopPage["blocks"][number]> {
  const blocks = new Map<string, WorkshopPage["blocks"][number]>();
  for (const page of pages) {
    for (const block of page.blocks) {
      if (block.type === "textarea" || block.type === "choice" || block.type === "reveal") blocks.set(block.id, block);
    }
  }
  return blocks;
}

function validateResponses(value: unknown, pages: readonly WorkshopPage[]): value is Record<string, WorkshopStoredResponseValue> {
  if (!isRecord(value)) return false;
  const blocks = responseBlocks(pages);
  for (const [id, response] of Object.entries(value)) {
    const block = blocks.get(id);
    if (!block) return false;
    if (block.type === "textarea" && typeof response !== "string") return false;
    if (block.type === "reveal" && typeof response !== "boolean") return false;
    if (block.type === "choice" && (typeof response !== "string" || !block.options.some((option) => option.id === response))) {
      return false;
    }
  }
  return true;
}

function validateProgress(value: unknown, pack: WorkshopPack): value is WorkshopProgress {
  if (!isRecord(value) || !hasExactKeys(value, ["schemaVersion", "workshopId", "workshopVersion", "pageId", "updatedAt", "completed", "responses"])) return false;
  const pageIndex = typeof value.pageId === "string" ? pack.pages.findIndex((page) => page.id === value.pageId) : -1;
  return value.schemaVersion === WORKSHOP_PROGRESS_SCHEMA_VERSION
    && value.workshopId === pack.id
    && value.workshopVersion === pack.version
    && pageIndex >= 0
    && isIsoDate(value.updatedAt)
    && typeof value.completed === "boolean"
    && value.completed === (pageIndex === pack.pages.length - 1)
    && validateResponses(value.responses, pack.pages);
}

export function createWorkshopExport(pack: WorkshopPack, progress: WorkshopProgress, now: () => string = () => new Date().toISOString()): WorkshopExportFile {
  return {
    format: WORKSHOP_EXPORT_FORMAT,
    formatVersion: WORKSHOP_EXPORT_FORMAT_VERSION,
    exportedAt: now(),
    workshop: { id: pack.id, manifestVersion: pack.version, title: pack.title },
    progress,
  };
}

export function serializeWorkshopExport(pack: WorkshopPack, progress: WorkshopProgress, now?: () => string): string {
  return `${JSON.stringify(createWorkshopExport(pack, progress, now), null, 2)}\n`;
}

function fenced(value: string): string {
  const longest = Math.max(0, ...[...value.matchAll(/`+/g)].map(([run]) => run.length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  return `${fence}\n${value}\n${fence}`;
}

function dateStamp(value: string): string {
  return value.slice(0, 10);
}

export function workshopExportFilename(pack: WorkshopPack, extension: "md" | "json", exportedAt = new Date().toISOString()): string {
  return `recits-vivants-${pack.id}-parcours-${dateStamp(exportedAt)}.${extension}`;
}

export function createWorkshopMarkdown(pack: WorkshopPack, progress: WorkshopProgress, exportedAt = new Date().toISOString()): string {
  const pageIndex = pack.pages.findIndex((page) => page.id === progress.pageId);
  const currentPage = pack.pages[pageIndex];
  const currentMovement = currentPage ? pack.movements.find((movement) => movement.id === currentPage.movementId) : undefined;
  const lines = [
    `# ${pack.title} — parcours personnel`,
    "",
    `- Exporté le : ${exportedAt}`,
    `- Progression : ${currentMovement ? `Mouvement ${currentMovement.order} — ${currentMovement.title}` : "Mouvement inconnu"}, étape ${pageIndex + 1} sur ${pack.pages.length} — ${currentPage?.title ?? "Étape inconnue"}`,
    `- État : ${progress.completed ? "Parcours terminé" : "Parcours en cours"}`,
    "",
    "> Document personnel lisible. Il n’est pas destiné à être restauré automatiquement.",
    "",
    "## Vos réponses",
  ];

  for (const movement of pack.movements) {
    lines.push("", `## Mouvement ${movement.order} — ${movement.title}`);
    for (const page of pack.pages.filter((candidate) => candidate.movementId === movement.id)) {
      lines.push("", `### Étape ${page.order} — ${page.title}`);
      const blocks = page.blocks.filter((block) => block.type === "textarea" || block.type === "choice" || block.type === "reveal");
      if (blocks.length === 0) {
        lines.push("Aucun élément personnel à renseigner à cette étape.");
        continue;
      }
      for (const block of blocks) {
        const value = progress.responses[block.id];
        if (block.type === "textarea") {
          lines.push("", `#### ${block.label}`, "", typeof value === "string" && value.length > 0 ? fenced(value) : "*Non renseigné.*");
        } else if (block.type === "choice") {
          const label = typeof value === "string" ? block.options.find((option) => option.id === value)?.label : undefined;
          lines.push("", `- **${block.label} :** ${label ?? "Non renseigné."}`);
        } else {
          lines.push("", `- **${block.label} :** ${value === true ? "Section révélée." : "Non renseigné."}`);
        }
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

export function inspectWorkshopImport(text: string, pack: WorkshopPack): WorkshopImportResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { valid: false, reason: "invalid" };
  }
  if (!isRecord(value) || !hasExactKeys(value, ["format", "formatVersion", "exportedAt", "workshop", "progress"])) {
    return { valid: false, reason: "invalid" };
  }
  if (value.format !== WORKSHOP_EXPORT_FORMAT || value.formatVersion !== WORKSHOP_EXPORT_FORMAT_VERSION || !isIsoDate(value.exportedAt)) {
    return { valid: false, reason: "version" };
  }
  if (!isRecord(value.workshop) || !hasExactKeys(value.workshop, ["id", "manifestVersion", "title"])
    || typeof value.workshop.id !== "string" || typeof value.workshop.manifestVersion !== "string" || typeof value.workshop.title !== "string") {
    return { valid: false, reason: "invalid" };
  }
  if (value.workshop.id !== pack.id) return { valid: false, reason: "workshop" };
  if (value.workshop.manifestVersion !== pack.version) return { valid: false, reason: "version" };
  const progress = value.progress;
  if (!validateProgress(progress, pack)) return { valid: false, reason: "invalid" };
  if (progress.workshopId !== value.workshop.id || progress.workshopVersion !== value.workshop.manifestVersion) {
    return { valid: false, reason: "invalid" };
  }
  return {
    valid: true,
    preview: {
      progress,
      exportedAt: value.exportedAt,
      responseCount: Object.keys(progress.responses).length,
      pageIndex: pack.pages.findIndex((page) => page.id === progress.pageId),
    },
  };
}
