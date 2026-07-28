import type { ValidationResult } from "@ine/core";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "string" && record[key].length > 0;
}

export function validateNarrativePack(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ["root must be an object"] };
  }

  if (value.format !== "ine-narrative-pack") errors.push('format must be "ine-narrative-pack"');
  if (value.version !== "1.0") errors.push('version must be "1.0"');
  for (const key of ["id", "title", "language", "startScene"]) {
    if (!hasString(value, key)) errors.push(`${key} must be a non-empty string`);
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
      for (const key of ["id", "title", "text"]) {
        if (!hasString(scene, key)) errors.push(`scenes[${index}].${key} must be a non-empty string`);
      }
      if (typeof scene.id === "string") {
        if (ids.has(scene.id)) errors.push(`scene id "${scene.id}" is duplicated`);
        ids.add(scene.id);
      }
      for (const key of ["image", "imageAlt"]) {
        if (scene[key] !== undefined && typeof scene[key] !== "string") {
          errors.push(`scenes[${index}].${key} must be a string`);
        }
      }
    });
    if (typeof value.startScene === "string" && !ids.has(value.startScene)) {
      errors.push("startScene must reference an existing scene");
    }
  }

  return { valid: errors.length === 0, errors };
}
