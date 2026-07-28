import type { ValidationResult } from "@ine/core";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "string" && record[key].length > 0;
}

function reportUnknownProperties(
  record: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  path: string,
  errors: string[],
): void {
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) errors.push(`${path}.${key} is not allowed`);
  }
}

const PACK_PROPERTIES = new Set([
  "$schema",
  "format",
  "version",
  "id",
  "title",
  "language",
  "startScene",
  "scenes",
]);
const SCENE_PROPERTIES = new Set(["id", "title", "text", "image", "imageAlt"]);
const PACK_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateNarrativePack(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ["root must be an object"] };
  }

  reportUnknownProperties(value, PACK_PROPERTIES, "root", errors);
  if (value.format !== "ine-narrative-pack") errors.push('format must be "ine-narrative-pack"');
  if (value.version !== "1.0") errors.push('version must be "1.0"');
  if (value.$schema !== undefined && typeof value.$schema !== "string") {
    errors.push("$schema must be a string");
  }
  for (const key of ["id", "title", "language", "startScene"]) {
    if (!hasString(value, key)) errors.push(`${key} must be a non-empty string`);
  }
  if (typeof value.id === "string" && !PACK_ID_PATTERN.test(value.id)) {
    errors.push("id must use lowercase kebab-case");
  }
  if (typeof value.language === "string" && value.language.length < 2) {
    errors.push("language must contain at least two characters");
  }

  if (!Array.isArray(value.scenes) || value.scenes.length === 0) {
    errors.push("scenes must be a non-empty array");
  } else {
    const ids = new Set<string>();
    value.scenes.forEach((scene, index) => {
      if (!isRecord(scene)) {
        errors.push(`scenes[${index}] must be an object`);
        return;
      }
      reportUnknownProperties(scene, SCENE_PROPERTIES, `scenes[${index}]`, errors);
      for (const key of ["id", "title", "text"]) {
        if (!hasString(scene, key)) errors.push(`scenes[${index}].${key} must be a non-empty string`);
      }
      if (typeof scene.id === "string") {
        if (ids.has(scene.id)) errors.push(`scene id "${scene.id}" is duplicated`);
        ids.add(scene.id);
      }
      if (scene.image !== undefined && !hasString(scene, "image")) {
        errors.push(`scenes[${index}].image must be a non-empty string`);
      }
      if (scene.imageAlt !== undefined && typeof scene.imageAlt !== "string") {
        errors.push(`scenes[${index}].imageAlt must be a string`);
      }
    });
    if (typeof value.startScene === "string" && !ids.has(value.startScene)) {
      errors.push("startScene must reference an existing scene");
    }
  }

  return { valid: errors.length === 0, errors };
}
