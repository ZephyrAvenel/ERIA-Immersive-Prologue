import {
  MAX_TRANSITION_DURATION_MS,
  TRANSITION_EASINGS,
  TRANSITION_TYPES,
  type ValidationResult,
} from "@ine/core";

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
    if (!allowed.has(key)) errors.push(`INE_VALIDATION_UNKNOWN_PROPERTY:${path}.${key}`);
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
  "presentation",
  "scenes",
]);
const PRESENTATION_PROPERTIES = new Set(["defaultTransition"]);
const SCENE_PROPERTIES = new Set(["id", "title", "text", "image", "imageAlt", "imageDisplayMode", "transition"]);
const TRANSITION_PROPERTIES = new Set(["type", "durationMs", "easing"]);
const PACK_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_DISPLAY_MODES = new Set(["contain", "cover", "fill", "immersive"]);
const ALLOWED_TRANSITION_TYPES = new Set<string>(TRANSITION_TYPES);
const ALLOWED_TRANSITION_EASINGS = new Set<string>(TRANSITION_EASINGS);

function validateTransition(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`INE_VALIDATION_TRANSITION_OBJECT_REQUIRED:${path}`);
    return;
  }

  reportUnknownProperties(value, TRANSITION_PROPERTIES, path, errors);
  if (typeof value.type !== "string" || !ALLOWED_TRANSITION_TYPES.has(value.type)) {
    errors.push(`INE_VALIDATION_TRANSITION_TYPE_INVALID:${path}.type`);
  }
  if (
    value.durationMs !== undefined &&
    (typeof value.durationMs !== "number" ||
      !Number.isFinite(value.durationMs) ||
      value.durationMs < 0 ||
      value.durationMs > MAX_TRANSITION_DURATION_MS)
  ) {
    errors.push(`INE_VALIDATION_TRANSITION_DURATION_INVALID:${path}.durationMs`);
  }
  if (
    value.easing !== undefined &&
    (typeof value.easing !== "string" || !ALLOWED_TRANSITION_EASINGS.has(value.easing))
  ) {
    errors.push(`INE_VALIDATION_TRANSITION_EASING_INVALID:${path}.easing`);
  }
}

export function validateNarrativePack(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ["INE_VALIDATION_ROOT_OBJECT_REQUIRED"] };
  }

  reportUnknownProperties(value, PACK_PROPERTIES, "root", errors);
  if (value.format !== "ine-narrative-pack") errors.push("INE_VALIDATION_FORMAT_INVALID");
  if (value.version !== "1.0") errors.push("INE_VALIDATION_VERSION_INVALID");
  if (value.$schema !== undefined && typeof value.$schema !== "string") {
    errors.push("INE_VALIDATION_SCHEMA_STRING_REQUIRED");
  }
  for (const key of ["id", "title", "language", "startScene"]) {
    if (!hasString(value, key)) errors.push(`INE_VALIDATION_${key.toUpperCase()}_REQUIRED`);
  }
  if (typeof value.id === "string" && !PACK_ID_PATTERN.test(value.id)) {
    errors.push("INE_VALIDATION_ID_KEBAB_CASE_REQUIRED");
  }
  if (typeof value.language === "string" && value.language.length < 2) {
    errors.push("INE_VALIDATION_LANGUAGE_INVALID");
  }
  if (value.presentation !== undefined) {
    if (!isRecord(value.presentation)) {
      errors.push("INE_VALIDATION_PRESENTATION_OBJECT_REQUIRED");
    } else {
      reportUnknownProperties(value.presentation, PRESENTATION_PROPERTIES, "root.presentation", errors);
      if (value.presentation.defaultTransition !== undefined) {
        validateTransition(value.presentation.defaultTransition, "root.presentation.defaultTransition", errors);
      }
    }
  }

  if (!Array.isArray(value.scenes) || value.scenes.length === 0) {
    errors.push("INE_VALIDATION_SCENES_REQUIRED");
  } else {
    const ids = new Set<string>();
    value.scenes.forEach((scene, index) => {
      if (!isRecord(scene)) {
        errors.push(`INE_VALIDATION_SCENE_${index}_OBJECT_REQUIRED`);
        return;
      }
      reportUnknownProperties(scene, SCENE_PROPERTIES, `scenes[${index}]`, errors);
      for (const key of ["id", "title", "text"]) {
        if (!hasString(scene, key)) errors.push(`INE_VALIDATION_SCENE_${index}_${key.toUpperCase()}_REQUIRED`);
      }
      if (typeof scene.id === "string") {
        if (ids.has(scene.id)) errors.push(`INE_VALIDATION_SCENE_${index}_ID_DUPLICATED`);
        ids.add(scene.id);
      }
      if (scene.image !== undefined && !hasString(scene, "image")) {
        errors.push(`INE_VALIDATION_SCENE_${index}_IMAGE_INVALID`);
      }
      if (scene.imageAlt !== undefined && typeof scene.imageAlt !== "string") {
        errors.push(`INE_VALIDATION_SCENE_${index}_IMAGE_ALT_INVALID`);
      }
      if (
        scene.imageDisplayMode !== undefined &&
        (typeof scene.imageDisplayMode !== "string" || !IMAGE_DISPLAY_MODES.has(scene.imageDisplayMode))
      ) {
        errors.push(`INE_VALIDATION_SCENE_${index}_IMAGE_DISPLAY_MODE_INVALID`);
      }
      if (scene.transition !== undefined) {
        validateTransition(scene.transition, `scenes[${index}].transition`, errors);
      }
    });
    if (typeof value.startScene === "string" && !ids.has(value.startScene)) {
      errors.push("INE_VALIDATION_START_SCENE_UNKNOWN");
    }
  }

  return { valid: errors.length === 0, errors };
}
