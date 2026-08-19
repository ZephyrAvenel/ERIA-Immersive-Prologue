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
  "subtitle",
  "description",
  "coverImage",
  "coverImageAlt",
  "layout",
  "language",
  "startScene",
  "presentation",
  "scenes",
]);
const PRESENTATION_PROPERTIES = new Set(["defaultTransition", "intro"]);
const INTRO_PROPERTIES = new Set(["lines", "title", "actionLabel"]);
const SCENE_PROPERTIES = new Set(["id", "title", "text", "image", "imageAlt", "imageDisplayMode", "links", "transition"]);
const SCENE_LINK_PROPERTIES = new Set(["label", "href", "description"]);
const TRANSITION_PROPERTIES = new Set(["type", "durationMs", "easing"]);
const PACK_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NARRATIVE_PACK_LAYOUTS = new Set(["image-then-text"]);
const IMAGE_DISPLAY_MODES = new Set(["contain", "cover", "fill", "immersive"]);
const ALLOWED_TRANSITION_TYPES = new Set<string>(TRANSITION_TYPES);
const ALLOWED_TRANSITION_EASINGS = new Set<string>(TRANSITION_EASINGS);
const POLARITY_PROPERTIES = new Set([
  "id", "title", "subtitle", "image", "imageAlt", "left", "right", "quote", "question",
  "article", "previous", "next", "actions",
]);
const POLARITY_POLE_PROPERTIES = new Set(["title", "icon", "text"]);
const POLARITY_ACTION_PROPERTIES = new Set(["article", "next", "previous", "back"]);
const LIVING_CARD_PROPERTIES = new Set([
  "id", "type", "title", "subtitle", "image", "imageAlt", "symbol", "quote", "motto",
  "metadata", "previous", "next", "locale",
]);
const LIVING_CARD_METADATA_PROPERTIES = new Set(["label", "value"]);
const LIVING_CARD_LOCALE_PROPERTIES = new Set(["fr", "en"]);
const LIVING_CARD_LOCALE_CONTENT_PROPERTIES = new Set(["title", "subtitle", "quote", "motto"]);
const WORKSHOP_PACK_PROPERTIES = new Set([
  "$schema",
  "format",
  "version",
  "id",
  "slug",
  "title",
  "subtitle",
  "language",
  "startPage",
  "movements",
  "pages",
]);
const WORKSHOP_MOVEMENT_PROPERTIES = new Set(["id", "order", "title", "description"]);
const WORKSHOP_PAGE_PROPERTIES = new Set(["id", "movementId", "order", "title", "blocks"]);
const WORKSHOP_TEXT_BLOCK_PROPERTIES = new Set(["id", "type", "text"]);
const WORKSHOP_TEXTAREA_BLOCK_PROPERTIES = new Set(["id", "type", "label", "placeholder", "required"]);
const WORKSHOP_CHOICE_BLOCK_PROPERTIES = new Set(["id", "type", "label", "options", "allowMultiple"]);
const WORKSHOP_CHOICE_OPTION_PROPERTIES = new Set(["id", "label", "description"]);
const WORKSHOP_REVEAL_BLOCK_PROPERTIES = new Set(["id", "type", "label", "content"]);
const WORKSHOP_PROMPT_COPY_BLOCK_PROPERTIES = new Set(["id", "type", "label", "text", "description"]);
const WORKSHOP_RECALL_BLOCK_PROPERTIES = new Set(["id", "type", "sourceBlockId", "label", "emptyText"]);
const WORKSHOP_BLOCK_TYPES = new Set(["text", "textarea", "choice", "reveal", "promptCopy", "recall"]);

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

function validateIntro(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`INE_VALIDATION_INTRO_OBJECT_REQUIRED:${path}`);
    return;
  }

  reportUnknownProperties(value, INTRO_PROPERTIES, path, errors);
  if (
    !Array.isArray(value.lines) ||
    value.lines.length === 0 ||
    value.lines.some((line) => typeof line !== "string" || line.length === 0)
  ) {
    errors.push(`INE_VALIDATION_INTRO_LINES_INVALID:${path}.lines`);
  }
  if (value.title !== undefined && !hasString(value, "title")) {
    errors.push(`INE_VALIDATION_INTRO_TITLE_INVALID:${path}.title`);
  }
  if (!hasString(value, "actionLabel")) {
    errors.push(`INE_VALIDATION_INTRO_ACTION_LABEL_REQUIRED:${path}.actionLabel`);
  }
}

function validateSceneLinks(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`INE_VALIDATION_SCENE_LINKS_ARRAY_REQUIRED:${path}`);
    return;
  }
  if (value.length === 0) {
    errors.push(`INE_VALIDATION_SCENE_LINKS_EMPTY:${path}`);
    return;
  }
  value.forEach((link, index) => {
    const linkPath = `${path}[${index}]`;
    if (!isRecord(link)) {
      errors.push(`INE_VALIDATION_SCENE_LINK_OBJECT_REQUIRED:${linkPath}`);
      return;
    }
    reportUnknownProperties(link, SCENE_LINK_PROPERTIES, linkPath, errors);
    if (!hasString(link, "label")) errors.push(`INE_VALIDATION_SCENE_LINK_LABEL_REQUIRED:${linkPath}.label`);
    if (!hasString(link, "href")) errors.push(`INE_VALIDATION_SCENE_LINK_HREF_REQUIRED:${linkPath}.href`);
    if (link.description !== undefined && typeof link.description !== "string") {
      errors.push(`INE_VALIDATION_SCENE_LINK_DESCRIPTION_INVALID:${linkPath}.description`);
    }
  });
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
  if (
    value.layout !== undefined &&
    (typeof value.layout !== "string" || !NARRATIVE_PACK_LAYOUTS.has(value.layout))
  ) {
    errors.push("INE_VALIDATION_LAYOUT_INVALID");
  }
  if (value.presentation !== undefined) {
    if (!isRecord(value.presentation)) {
      errors.push("INE_VALIDATION_PRESENTATION_OBJECT_REQUIRED");
    } else {
      reportUnknownProperties(value.presentation, PRESENTATION_PROPERTIES, "root.presentation", errors);
      if (value.presentation.defaultTransition !== undefined) {
        validateTransition(value.presentation.defaultTransition, "root.presentation.defaultTransition", errors);
      }
      if (value.presentation.intro !== undefined) {
        validateIntro(value.presentation.intro, "root.presentation.intro", errors);
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
      if (scene.links !== undefined) {
        validateSceneLinks(scene.links, `scenes[${index}].links`, errors);
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

export function validatePolarity(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) return { valid: false, errors: ["INE_POLARITY_OBJECT_REQUIRED"] };
  reportUnknownProperties(value, POLARITY_PROPERTIES, "polarity", errors);
  for (const key of [
    "id", "title", "subtitle", "image", "imageAlt", "quote", "question", "article",
  ]) {
    if (!hasString(value, key)) errors.push(`INE_POLARITY_STRING_REQUIRED:polarity.${key}`);
  }
  for (const key of ["subtitle", "description", "coverImage"]) {
    if (value[key] !== undefined && !hasString(value, key)) {
      errors.push(`INE_VALIDATION_${key.toUpperCase()}_INVALID`);
    }
  }
  if (value.coverImageAlt !== undefined && typeof value.coverImageAlt !== "string") {
    errors.push("INE_VALIDATION_COVERIMAGEALT_INVALID");
  }
  if (typeof value.id === "string" && !PACK_ID_PATTERN.test(value.id)) {
    errors.push("INE_POLARITY_ID_INVALID:polarity.id");
  }
  for (const key of ["previous", "next"]) {
    if (value[key] !== null && !hasString(value, key)) {
      errors.push(`INE_POLARITY_LINK_INVALID:polarity.${key}`);
    }
  }
  for (const side of ["left", "right"]) {
    const pole = value[side];
    if (!isRecord(pole)) {
      errors.push(`INE_POLARITY_POLE_REQUIRED:polarity.${side}`);
      continue;
    }
    reportUnknownProperties(pole, POLARITY_POLE_PROPERTIES, `polarity.${side}`, errors);
    for (const key of POLARITY_POLE_PROPERTIES) {
      if (!hasString(pole, key)) errors.push(`INE_POLARITY_STRING_REQUIRED:polarity.${side}.${key}`);
    }
  }
  if (!isRecord(value.actions)) {
    errors.push("INE_POLARITY_ACTIONS_REQUIRED:polarity.actions");
  } else {
    reportUnknownProperties(value.actions, POLARITY_ACTION_PROPERTIES, "polarity.actions", errors);
    for (const key of POLARITY_ACTION_PROPERTIES) {
      if (!hasString(value.actions, key)) errors.push(`INE_POLARITY_STRING_REQUIRED:polarity.actions.${key}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateLivingCard(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) return { valid: false, errors: ["INE_LIVING_CARD_OBJECT_REQUIRED"] };
  reportUnknownProperties(value, LIVING_CARD_PROPERTIES, "livingCard", errors);
  if (value.type !== "living-card") errors.push("INE_LIVING_CARD_TYPE_INVALID:livingCard.type");
  for (const key of ["id", "title", "subtitle", "image", "imageAlt", "symbol", "quote", "motto"]) {
    if (!hasString(value, key)) errors.push(`INE_LIVING_CARD_STRING_REQUIRED:livingCard.${key}`);
  }
  if (typeof value.id === "string" && !PACK_ID_PATTERN.test(value.id)) {
    errors.push("INE_LIVING_CARD_ID_INVALID:livingCard.id");
  }
  for (const key of ["previous", "next"]) {
    if (value[key] !== null && !hasString(value, key)) {
      errors.push(`INE_LIVING_CARD_LINK_INVALID:livingCard.${key}`);
    }
  }
  if (!Array.isArray(value.metadata)) {
    errors.push("INE_LIVING_CARD_METADATA_REQUIRED:livingCard.metadata");
  } else {
    value.metadata.forEach((item, index) => {
      if (!isRecord(item)) {
        errors.push(`INE_LIVING_CARD_METADATA_OBJECT_REQUIRED:livingCard.metadata[${index}]`);
        return;
      }
      reportUnknownProperties(item, LIVING_CARD_METADATA_PROPERTIES, `livingCard.metadata[${index}]`, errors);
      for (const key of LIVING_CARD_METADATA_PROPERTIES) {
        if (!hasString(item, key)) {
          errors.push(`INE_LIVING_CARD_METADATA_STRING_REQUIRED:livingCard.metadata[${index}].${key}`);
        }
      }
    });
  }
  if (!isRecord(value.locale)) {
    errors.push("INE_LIVING_CARD_LOCALE_REQUIRED:livingCard.locale");
  } else {
    reportUnknownProperties(value.locale, LIVING_CARD_LOCALE_PROPERTIES, "livingCard.locale", errors);
    for (const key of LIVING_CARD_LOCALE_PROPERTIES) {
      const locale = value.locale[key];
      if (!isRecord(locale)) {
        errors.push(`INE_LIVING_CARD_LOCALE_OBJECT_REQUIRED:livingCard.locale.${key}`);
        continue;
      }
      reportUnknownProperties(locale, LIVING_CARD_LOCALE_CONTENT_PROPERTIES, `livingCard.locale.${key}`, errors);
      for (const contentKey of LIVING_CARD_LOCALE_CONTENT_PROPERTIES) {
        if (locale[contentKey] !== undefined && !hasString(locale, contentKey)) {
          errors.push(`INE_LIVING_CARD_LOCALE_STRING_INVALID:livingCard.locale.${key}.${contentKey}`);
        }
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

function validateWorkshopBlock(
  value: unknown,
  path: string,
  errors: string[],
  knownBlockIds: Set<string>,
  recallReferences: string[],
): void {
  if (!isRecord(value)) {
    errors.push(`INE_WORKSHOP_BLOCK_OBJECT_REQUIRED:${path}`);
    return;
  }

  if (!hasString(value, "id")) errors.push(`INE_WORKSHOP_BLOCK_ID_REQUIRED:${path}.id`);
  if (typeof value.id === "string") {
    if (knownBlockIds.has(value.id)) errors.push(`INE_WORKSHOP_BLOCK_ID_DUPLICATED:${path}.id`);
    knownBlockIds.add(value.id);
  }
  if (typeof value.type !== "string" || !WORKSHOP_BLOCK_TYPES.has(value.type)) {
    errors.push(`INE_WORKSHOP_BLOCK_TYPE_INVALID:${path}.type`);
    return;
  }

  if (value.type === "text") {
    reportUnknownProperties(value, WORKSHOP_TEXT_BLOCK_PROPERTIES, path, errors);
    if (!hasString(value, "text")) errors.push(`INE_WORKSHOP_TEXT_REQUIRED:${path}.text`);
    return;
  }

  if (value.type === "textarea") {
    reportUnknownProperties(value, WORKSHOP_TEXTAREA_BLOCK_PROPERTIES, path, errors);
    if (!hasString(value, "label")) errors.push(`INE_WORKSHOP_TEXTAREA_LABEL_REQUIRED:${path}.label`);
    if (value.placeholder !== undefined && typeof value.placeholder !== "string") {
      errors.push(`INE_WORKSHOP_TEXTAREA_PLACEHOLDER_INVALID:${path}.placeholder`);
    }
    if (value.required !== undefined && typeof value.required !== "boolean") {
      errors.push(`INE_WORKSHOP_TEXTAREA_REQUIRED_INVALID:${path}.required`);
    }
    return;
  }

  if (value.type === "choice") {
    reportUnknownProperties(value, WORKSHOP_CHOICE_BLOCK_PROPERTIES, path, errors);
    if (!hasString(value, "label")) errors.push(`INE_WORKSHOP_CHOICE_LABEL_REQUIRED:${path}.label`);
    if (!Array.isArray(value.options) || value.options.length < 2) {
      errors.push(`INE_WORKSHOP_CHOICE_OPTIONS_INVALID:${path}.options`);
    } else {
      const optionIds = new Set<string>();
      value.options.forEach((option, index) => {
        const optionPath = `${path}.options[${index}]`;
        if (!isRecord(option)) {
          errors.push(`INE_WORKSHOP_CHOICE_OPTION_OBJECT_REQUIRED:${optionPath}`);
          return;
        }
        reportUnknownProperties(option, WORKSHOP_CHOICE_OPTION_PROPERTIES, optionPath, errors);
        if (!hasString(option, "id")) errors.push(`INE_WORKSHOP_CHOICE_OPTION_ID_REQUIRED:${optionPath}.id`);
        if (typeof option.id === "string") {
          if (optionIds.has(option.id)) errors.push(`INE_WORKSHOP_CHOICE_OPTION_ID_DUPLICATED:${optionPath}.id`);
          optionIds.add(option.id);
        }
        if (!hasString(option, "label")) errors.push(`INE_WORKSHOP_CHOICE_OPTION_LABEL_REQUIRED:${optionPath}.label`);
        if (option.description !== undefined && typeof option.description !== "string") {
          errors.push(`INE_WORKSHOP_CHOICE_OPTION_DESCRIPTION_INVALID:${optionPath}.description`);
        }
      });
    }
    if (value.allowMultiple !== undefined && typeof value.allowMultiple !== "boolean") {
      errors.push(`INE_WORKSHOP_CHOICE_ALLOW_MULTIPLE_INVALID:${path}.allowMultiple`);
    }
    return;
  }

  if (value.type === "reveal") {
    reportUnknownProperties(value, WORKSHOP_REVEAL_BLOCK_PROPERTIES, path, errors);
    if (!hasString(value, "label")) errors.push(`INE_WORKSHOP_REVEAL_LABEL_REQUIRED:${path}.label`);
    if (!hasString(value, "content")) errors.push(`INE_WORKSHOP_REVEAL_CONTENT_REQUIRED:${path}.content`);
    return;
  }

  if (value.type === "promptCopy") {
    reportUnknownProperties(value, WORKSHOP_PROMPT_COPY_BLOCK_PROPERTIES, path, errors);
    if (!hasString(value, "label")) errors.push(`INE_WORKSHOP_PROMPT_COPY_LABEL_REQUIRED:${path}.label`);
    if (!hasString(value, "text")) errors.push(`INE_WORKSHOP_PROMPT_COPY_TEXT_REQUIRED:${path}.text`);
    if (value.description !== undefined && typeof value.description !== "string") {
      errors.push(`INE_WORKSHOP_PROMPT_COPY_DESCRIPTION_INVALID:${path}.description`);
    }
    return;
  }

  reportUnknownProperties(value, WORKSHOP_RECALL_BLOCK_PROPERTIES, path, errors);
  if (!hasString(value, "sourceBlockId")) {
    errors.push(`INE_WORKSHOP_RECALL_SOURCE_BLOCK_REQUIRED:${path}.sourceBlockId`);
  } else {
    recallReferences.push(value.sourceBlockId as string);
  }
  if (value.label !== undefined && typeof value.label !== "string") {
    errors.push(`INE_WORKSHOP_RECALL_LABEL_INVALID:${path}.label`);
  }
  if (value.emptyText !== undefined && typeof value.emptyText !== "string") {
    errors.push(`INE_WORKSHOP_RECALL_EMPTY_TEXT_INVALID:${path}.emptyText`);
  }
}

export function validateWorkshopPack(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) return { valid: false, errors: ["INE_WORKSHOP_PACK_OBJECT_REQUIRED"] };

  reportUnknownProperties(value, WORKSHOP_PACK_PROPERTIES, "workshop", errors);
  if (value.format !== "ine-workshop-pack") errors.push("INE_WORKSHOP_FORMAT_INVALID");
  if (value.version !== "1.0") errors.push("INE_WORKSHOP_VERSION_INVALID");
  if (value.$schema !== undefined && typeof value.$schema !== "string") {
    errors.push("INE_WORKSHOP_SCHEMA_STRING_REQUIRED");
  }
  for (const key of ["id", "slug", "title", "subtitle", "language", "startPage"]) {
    if (!hasString(value, key)) errors.push(`INE_WORKSHOP_${key.toUpperCase()}_REQUIRED`);
  }
  for (const key of ["id", "slug"]) {
    if (typeof value[key] === "string" && !PACK_ID_PATTERN.test(value[key])) {
      errors.push(`INE_WORKSHOP_${key.toUpperCase()}_KEBAB_CASE_REQUIRED`);
    }
  }
  if (typeof value.language === "string" && value.language.length < 2) {
    errors.push("INE_WORKSHOP_LANGUAGE_INVALID");
  }

  const movementIds = new Set<string>();
  if (!Array.isArray(value.movements) || value.movements.length === 0) {
    errors.push("INE_WORKSHOP_MOVEMENTS_REQUIRED");
  } else {
    const movementOrders = new Set<number>();
    value.movements.forEach((movement, index) => {
      const path = `workshop.movements[${index}]`;
      if (!isRecord(movement)) {
        errors.push(`INE_WORKSHOP_MOVEMENT_OBJECT_REQUIRED:${path}`);
        return;
      }
      reportUnknownProperties(movement, WORKSHOP_MOVEMENT_PROPERTIES, path, errors);
      if (!hasString(movement, "id")) errors.push(`INE_WORKSHOP_MOVEMENT_ID_REQUIRED:${path}.id`);
      if (typeof movement.id === "string") {
        if (movementIds.has(movement.id)) errors.push(`INE_WORKSHOP_MOVEMENT_ID_DUPLICATED:${path}.id`);
        movementIds.add(movement.id);
      }
      if (!Number.isInteger(movement.order) || typeof movement.order !== "number" || movement.order < 1) {
        errors.push(`INE_WORKSHOP_MOVEMENT_ORDER_INVALID:${path}.order`);
      } else if (movementOrders.has(movement.order)) {
        errors.push(`INE_WORKSHOP_MOVEMENT_ORDER_DUPLICATED:${path}.order`);
      } else {
        movementOrders.add(movement.order);
      }
      if (!hasString(movement, "title")) errors.push(`INE_WORKSHOP_MOVEMENT_TITLE_REQUIRED:${path}.title`);
      if (movement.description !== undefined && typeof movement.description !== "string") {
        errors.push(`INE_WORKSHOP_MOVEMENT_DESCRIPTION_INVALID:${path}.description`);
      }
    });
  }

  const pageIds = new Set<string>();
  const blockIds = new Set<string>();
  const recallReferences: string[] = [];
  if (!Array.isArray(value.pages) || value.pages.length === 0) {
    errors.push("INE_WORKSHOP_PAGES_REQUIRED");
  } else {
    const pageOrders = new Set<number>();
    value.pages.forEach((page, index) => {
      const path = `workshop.pages[${index}]`;
      if (!isRecord(page)) {
        errors.push(`INE_WORKSHOP_PAGE_OBJECT_REQUIRED:${path}`);
        return;
      }
      reportUnknownProperties(page, WORKSHOP_PAGE_PROPERTIES, path, errors);
      if (!hasString(page, "id")) errors.push(`INE_WORKSHOP_PAGE_ID_REQUIRED:${path}.id`);
      if (typeof page.id === "string") {
        if (pageIds.has(page.id)) errors.push(`INE_WORKSHOP_PAGE_ID_DUPLICATED:${path}.id`);
        pageIds.add(page.id);
      }
      if (!hasString(page, "movementId")) {
        errors.push(`INE_WORKSHOP_PAGE_MOVEMENT_ID_REQUIRED:${path}.movementId`);
      } else if (!movementIds.has(page.movementId as string)) {
        errors.push(`INE_WORKSHOP_PAGE_MOVEMENT_UNKNOWN:${path}.movementId`);
      }
      if (!Number.isInteger(page.order) || typeof page.order !== "number" || page.order < 1) {
        errors.push(`INE_WORKSHOP_PAGE_ORDER_INVALID:${path}.order`);
      } else if (pageOrders.has(page.order)) {
        errors.push(`INE_WORKSHOP_PAGE_ORDER_DUPLICATED:${path}.order`);
      } else {
        pageOrders.add(page.order);
      }
      if (!hasString(page, "title")) errors.push(`INE_WORKSHOP_PAGE_TITLE_REQUIRED:${path}.title`);
      if (!Array.isArray(page.blocks) || page.blocks.length === 0) {
        errors.push(`INE_WORKSHOP_PAGE_BLOCKS_REQUIRED:${path}.blocks`);
      } else {
        page.blocks.forEach((block, blockIndex) => {
          validateWorkshopBlock(block, `${path}.blocks[${blockIndex}]`, errors, blockIds, recallReferences);
        });
      }
    });
  }

  if (typeof value.startPage === "string" && !pageIds.has(value.startPage)) {
    errors.push("INE_WORKSHOP_START_PAGE_UNKNOWN");
  }
  for (const sourceBlockId of recallReferences) {
    if (!blockIds.has(sourceBlockId)) errors.push(`INE_WORKSHOP_RECALL_SOURCE_BLOCK_UNKNOWN:${sourceBlockId}`);
  }

  return { valid: errors.length === 0, errors };
}
