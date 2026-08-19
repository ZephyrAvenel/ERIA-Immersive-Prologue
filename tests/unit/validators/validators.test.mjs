import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";
import {
  validateLivingCard,
  validateNarrativePack,
  validatePolarity,
  validateWorkshopPack,
} from "../../../.test-build/packages/validators/src/index.js";
import { readJsonFixture, readProjectJson } from "../../helpers/fixtures.mjs";

const expectedInvalidCodes = {
  "unknown-property.json": "INE_VALIDATION_UNKNOWN_PROPERTY",
  "invalid-id.json": "INE_VALIDATION_ID_KEBAB_CASE_REQUIRED",
  "duplicate-scene-id.json": "INE_VALIDATION_SCENE_1_ID_DUPLICATED",
  "missing-start-scene.json": "INE_VALIDATION_START_SCENE_UNKNOWN",
  "scene-missing-title.json": "INE_VALIDATION_SCENE_0_TITLE_REQUIRED",
  "empty-image.json": "INE_VALIDATION_SCENE_0_IMAGE_INVALID",
  "invalid-language.json": "INE_VALIDATION_LANGUAGE_INVALID",
  "invalid-image-display-mode.json": "INE_VALIDATION_SCENE_0_IMAGE_DISPLAY_MODE_INVALID",
  "wrong-property-type.json": "INE_VALIDATION_SCENE_0_TEXT_REQUIRED",
  "empty-scenes.json": "INE_VALIDATION_SCENES_REQUIRED",
  "unknown-transition-type.json": "INE_VALIDATION_TRANSITION_TYPE_INVALID",
  "negative-transition-duration.json": "INE_VALIDATION_TRANSITION_DURATION_INVALID",
  "too-long-transition-duration.json": "INE_VALIDATION_TRANSITION_DURATION_INVALID",
  "nonnumeric-transition-duration.json": "INE_VALIDATION_TRANSITION_DURATION_INVALID",
  "unknown-transition-easing.json": "INE_VALIDATION_TRANSITION_EASING_INVALID",
  "transition-extra-property.json": "INE_VALIDATION_UNKNOWN_PROPERTY",
  "malformed-transition.json": "INE_VALIDATION_TRANSITION_OBJECT_REQUIRED",
  "intro-missing-action.json": "INE_VALIDATION_INTRO_ACTION_LABEL_REQUIRED",
  "intro-extra-property.json": "INE_VALIDATION_UNKNOWN_PROPERTY",
  "intro-empty-lines.json": "INE_VALIDATION_INTRO_LINES_INVALID",
};

test("validator accepts every valid fixture", async () => {
  const names = await readdir("tests/fixtures/valid");
  for (const name of names) {
    const result = validateNarrativePack(await readJsonFixture("valid", name));
    assert.equal(result.valid, true, `${name}: ${result.errors.join(", ")}`);
    assert.deepEqual(result.errors, []);
  }
});

test("validator rejects every invalid fixture with stable error codes", async () => {
  for (const [name, expectedCode] of Object.entries(expectedInvalidCodes)) {
    const result = validateNarrativePack(await readJsonFixture("invalid", name));
    assert.equal(result.valid, false, `${name} should be invalid`);
    assert.ok(result.errors.some((error) => error.includes(expectedCode)), `${name}: ${result.errors.join(", ")}`);
  }
});

test("runtime validator and JSON Schema expose the same structural image display modes", async () => {
  const schema = await readProjectJson("schemas", "narrative-pack.schema.json");
  const enumValues = schema.$defs.scene.properties.imageDisplayMode.enum;
  assert.deepEqual(enumValues, ["contain", "cover", "fill", "immersive"]);

  for (const mode of enumValues) {
    const result = validateNarrativePack({
      format: "ine-narrative-pack",
      version: "1.0",
      id: `mode-${mode}`,
      title: mode,
      language: "en",
      startScene: "start",
      scenes: [{ id: "start", title: "Start", text: "Text.", imageDisplayMode: mode }],
    });
    assert.equal(result.valid, true, mode);
  }
});

test("JSON Schema and runtime validator agree on required root and scene fields", async () => {
  const schema = await readProjectJson("schemas", "narrative-pack.schema.json");
  assert.deepEqual(schema.required, ["format", "version", "id", "title", "language", "startScene", "scenes"]);
  assert.deepEqual(schema.$defs.scene.required, ["id", "title", "text"]);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.$defs.scene.additionalProperties, false);
});

test("runtime validator and JSON Schema expose the optional image-then-text layout", async () => {
  const schema = await readProjectJson("schemas", "narrative-pack.schema.json");
  assert.deepEqual(schema.properties.layout.enum, ["image-then-text"]);

  const result = validateNarrativePack({
    format: "ine-narrative-pack",
    version: "1.0",
    id: "image-then-text-layout",
    title: "Image then text",
    language: "fr",
    layout: "image-then-text",
    startScene: "start",
    scenes: [{ id: "start", title: "Start", text: "Text." }],
  });
  assert.equal(result.valid, true, result.errors.join(", "));

  const invalid = validateNarrativePack({
    format: "ine-narrative-pack",
    version: "1.0",
    id: "invalid-layout",
    title: "Invalid layout",
    language: "fr",
    layout: "text-only",
    startScene: "start",
    scenes: [{ id: "start", title: "Start", text: "Text." }],
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.includes("INE_VALIDATION_LAYOUT_INVALID"), true);
});

test("runtime validator and JSON Schema expose optional scene links", async () => {
  const schema = await readProjectJson("schemas", "narrative-pack.schema.json");
  assert.deepEqual(schema.$defs.sceneLink.required, ["label", "href"]);
  assert.equal(schema.$defs.sceneLink.additionalProperties, false);

  const result = validateNarrativePack({
    format: "ine-narrative-pack",
    version: "1.0",
    id: "scene-links",
    title: "Scene links",
    language: "fr",
    startScene: "start",
    scenes: [
      {
        id: "start",
        title: "Start",
        text: "Text.",
        links: [
          {
            label: "Explorer",
            href: "https://example.test",
            description: "Ressource complémentaire.",
          },
        ],
      },
    ],
  });
  assert.equal(result.valid, true, result.errors.join(", "));

  const invalid = validateNarrativePack({
    format: "ine-narrative-pack",
    version: "1.0",
    id: "invalid-scene-links",
    title: "Invalid scene links",
    language: "fr",
    startScene: "start",
    scenes: [{ id: "start", title: "Start", text: "Text.", links: [{ href: "https://example.test" }] }],
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.includes("INE_VALIDATION_SCENE_LINK_LABEL_REQUIRED:scenes[0].links[0].label"));
});

test("runtime validator and JSON Schema expose the same transition contract", async () => {
  const schema = await readProjectJson("schemas", "narrative-pack.schema.json");
  assert.deepEqual(schema.$defs.transition.required, ["type"]);
  assert.deepEqual(schema.$defs.transition.properties.type.enum, ["none", "fade", "crossfade", "slide"]);
  assert.deepEqual(schema.$defs.transition.properties.easing.enum, [
    "linear",
    "ease",
    "ease-in",
    "ease-out",
    "ease-in-out",
  ]);
  assert.equal(schema.$defs.transition.properties.durationMs.minimum, 0);
  assert.equal(schema.$defs.transition.properties.durationMs.maximum, 3000);

  for (const type of schema.$defs.transition.properties.type.enum) {
    const result = validateNarrativePack({
      format: "ine-narrative-pack",
      version: "1.0",
      id: `transition-${type}`,
      title: type,
      language: "en",
      startScene: "start",
      presentation: { defaultTransition: { type } },
      scenes: [{ id: "start", title: "Start", text: "Text." }],
    });
    assert.equal(result.valid, true, type);
  }
});

test("runtime validator and JSON Schema expose the same intro contract", async () => {
  const schema = await readProjectJson("schemas", "narrative-pack.schema.json");
  assert.deepEqual(schema.$defs.intro.required, ["lines", "actionLabel"]);
  assert.equal(schema.$defs.intro.additionalProperties, false);
  assert.equal(schema.$defs.intro.properties.lines.minItems, 1);

  const result = validateNarrativePack({
    format: "ine-narrative-pack",
    version: "1.0",
    id: "intro-contract",
    title: "Intro Contract",
    language: "en",
    startScene: "start",
    presentation: {
      intro: {
        lines: ["Before the words.", "There was breath."],
        actionLabel: "Enter",
      },
    },
    scenes: [{ id: "start", title: "Start", text: "Text." }],
  });

  assert.equal(result.valid, true, result.errors.join(", "));
});

function validWorkshopPack() {
  return {
    format: "ine-workshop-pack",
    version: "1.0",
    id: "ecriture-augmentee",
    slug: "ecriture-augmentee",
    title: "Écriture augmentée",
    subtitle: "Écrire avec l'IA sans lui abandonner sa voix",
    language: "fr",
    startPage: "page-01",
    movements: [
      { id: "intention", order: 1, title: "INTENTION", description: "Faire apparaître." },
      { id: "divergence", order: 2, title: "DIVERGENCE" },
    ],
    pages: [
      {
        id: "page-01",
        movementId: "intention",
        order: 1,
        title: "Le seuil",
        blocks: [
          { id: "intro", type: "text", text: "Avant le prompt existe une intention." },
          { id: "spark", type: "textarea", label: "Votre étincelle", placeholder: "Une image..." },
        ],
      },
      {
        id: "page-02",
        movementId: "divergence",
        order: 2,
        title: "Ouvrir",
        blocks: [
          {
            id: "direction",
            type: "choice",
            label: "Quelle piste ?",
            options: [
              { id: "intime", label: "Intime" },
              { id: "symbolique", label: "Symbolique", description: "Une image forte." },
            ],
          },
          { id: "question", type: "reveal", label: "Révéler", content: "Et si ?" },
          {
            id: "prompt",
            type: "promptCopy",
            label: "Copier le prompt",
            text: "Propose cinq directions narratives sans rédiger l'histoire.",
          },
          { id: "recall-spark", type: "recall", sourceBlockId: "spark", label: "Votre étincelle" },
        ],
      },
    ],
  };
}

test("workshop validator accepts a minimal reusable workshop fixture", async () => {
  const result = validateWorkshopPack(await readJsonFixture("workshop/valid", "minimal.json"));
  assert.deepEqual(result, { valid: true, errors: [] });
});

test("runtime validator and JSON Schema expose the workshop pack contract", async () => {
  const schema = await readProjectJson("schemas", "workshop-pack.schema.json");
  assert.deepEqual(schema.required, [
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
  assert.deepEqual(schema.$defs.movement.required, ["id", "order", "title"]);
  assert.deepEqual(schema.$defs.page.required, ["id", "movementId", "order", "title", "blocks"]);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.$defs.movement.additionalProperties, false);
  assert.equal(schema.$defs.page.additionalProperties, false);
  assert.deepEqual(schema.$defs.blockBase.properties.type.enum, [
    "text",
    "textarea",
    "choice",
    "reveal",
    "promptCopy",
    "recall",
  ]);

  const result = validateWorkshopPack(validWorkshopPack());
  assert.equal(result.valid, true, result.errors.join(", "));
});

test("workshop validator rejects unknown formats, blocks, and properties", () => {
  const unknownFormat = validateWorkshopPack({ ...validWorkshopPack(), format: "ine-narrative-pack" });
  assert.equal(unknownFormat.valid, false);
  assert.ok(unknownFormat.errors.includes("INE_WORKSHOP_FORMAT_INVALID"));

  const unknownRootProperty = validateWorkshopPack({ ...validWorkshopPack(), apiEndpoint: "https://example.test" });
  assert.equal(unknownRootProperty.valid, false);
  assert.ok(unknownRootProperty.errors.includes("INE_VALIDATION_UNKNOWN_PROPERTY:workshop.apiEndpoint"));

  const unknownBlock = validWorkshopPack();
  unknownBlock.pages[0].blocks = [{ id: "chat", type: "chatbot", prompt: "Écris à ma place." }];
  const unknownBlockResult = validateWorkshopPack(unknownBlock);
  assert.equal(unknownBlockResult.valid, false);
  assert.ok(unknownBlockResult.errors.includes("INE_WORKSHOP_BLOCK_TYPE_INVALID:workshop.pages[0].blocks[0].type"));

  const extraBlockProperty = validWorkshopPack();
  extraBlockProperty.pages[0].blocks[0].html = "<strong>Interdit</strong>";
  const extraBlockResult = validateWorkshopPack(extraBlockProperty);
  assert.equal(extraBlockResult.valid, false);
  assert.ok(extraBlockResult.errors.includes("INE_VALIDATION_UNKNOWN_PROPERTY:workshop.pages[0].blocks[0].html"));
});

test("workshop validator rejects duplicate ids and broken structural references", () => {
  const duplicateMovement = validWorkshopPack();
  duplicateMovement.movements[1].id = "intention";
  const duplicateMovementResult = validateWorkshopPack(duplicateMovement);
  assert.equal(duplicateMovementResult.valid, false);
  assert.ok(duplicateMovementResult.errors.includes("INE_WORKSHOP_MOVEMENT_ID_DUPLICATED:workshop.movements[1].id"));

  const duplicatePage = validWorkshopPack();
  duplicatePage.pages[1].id = "page-01";
  const duplicatePageResult = validateWorkshopPack(duplicatePage);
  assert.equal(duplicatePageResult.valid, false);
  assert.ok(duplicatePageResult.errors.includes("INE_WORKSHOP_PAGE_ID_DUPLICATED:workshop.pages[1].id"));

  const unknownMovement = validWorkshopPack();
  unknownMovement.pages[1].movementId = "creation";
  const unknownMovementResult = validateWorkshopPack(unknownMovement);
  assert.equal(unknownMovementResult.valid, false);
  assert.ok(unknownMovementResult.errors.includes("INE_WORKSHOP_PAGE_MOVEMENT_UNKNOWN:workshop.pages[1].movementId"));

  const unknownStart = validateWorkshopPack({ ...validWorkshopPack(), startPage: "missing" });
  assert.equal(unknownStart.valid, false);
  assert.ok(unknownStart.errors.includes("INE_WORKSHOP_START_PAGE_UNKNOWN"));

  const unknownRecall = validWorkshopPack();
  unknownRecall.pages[1].blocks[3].sourceBlockId = "missing-block";
  const unknownRecallResult = validateWorkshopPack(unknownRecall);
  assert.equal(unknownRecallResult.valid, false);
  assert.ok(unknownRecallResult.errors.includes("INE_WORKSHOP_RECALL_SOURCE_BLOCK_UNKNOWN:missing-block"));
});

test("workshop validator rejects invalid textarea, choice, and prompt copy blocks", () => {
  const invalidTextarea = validWorkshopPack();
  invalidTextarea.pages[0].blocks[1] = { id: "spark", type: "textarea", placeholder: "Missing label" };
  const textareaResult = validateWorkshopPack(invalidTextarea);
  assert.equal(textareaResult.valid, false);
  assert.ok(textareaResult.errors.includes("INE_WORKSHOP_TEXTAREA_LABEL_REQUIRED:workshop.pages[0].blocks[1].label"));

  const invalidChoice = validWorkshopPack();
  invalidChoice.pages[1].blocks[0] = {
    id: "direction",
    type: "choice",
    label: "Quelle piste ?",
    options: [{ id: "one", label: "Une seule option" }],
  };
  const choiceResult = validateWorkshopPack(invalidChoice);
  assert.equal(choiceResult.valid, false);
  assert.ok(choiceResult.errors.includes("INE_WORKSHOP_CHOICE_OPTIONS_INVALID:workshop.pages[1].blocks[0].options"));

  const invalidPrompt = validWorkshopPack();
  invalidPrompt.pages[1].blocks[2] = { id: "prompt", type: "promptCopy", label: "Copier" };
  const promptResult = validateWorkshopPack(invalidPrompt);
  assert.equal(promptResult.valid, false);
  assert.ok(promptResult.errors.includes("INE_WORKSHOP_PROMPT_COPY_TEXT_REQUIRED:workshop.pages[1].blocks[2].text"));
});

test("validator accepts a complete reusable polarity", () => {
  const result = validatePolarity({
    id: "affirmation-don",
    title: "Entre affirmation et don",
    subtitle: "Une tension vivante.",
    image: "assets/image.svg",
    imageAlt: "Deux mouvements.",
    left: { title: "Affirmation", icon: "leaf", text: "Poser des limites." },
    right: { title: "Don", icon: "hands", text: "Accueillir." },
    quote: "Une relation vivante.",
    question: "Où est-elle présente ?",
    article: "https://example.test",
    previous: null,
    next: "memoire-avenir",
    actions: { article: "Explorer", previous: "Précédente", next: "Suivante", back: "Retour" },
  });
  assert.deepEqual(result, { valid: true, errors: [] });
});

test("validator rejects incomplete or unexpected polarity content", () => {
  const result = validatePolarity({
    id: "Bad Id",
    title: "Titre",
    subtitle: "",
    image: "image.svg",
    imageAlt: "Image",
    left: { title: "Gauche", icon: "leaf" },
    right: null,
    quote: "Citation",
    question: "Question",
    article: "Article",
    previous: null,
    next: "next",
    actions: { article: "Article", next: "Next" },
    unexpected: true,
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("INE_POLARITY_ID_INVALID:polarity.id"));
  assert.ok(result.errors.includes("INE_POLARITY_STRING_REQUIRED:polarity.subtitle"));
  assert.ok(result.errors.includes("INE_POLARITY_POLE_REQUIRED:polarity.right"));
  assert.ok(result.errors.includes("INE_POLARITY_STRING_REQUIRED:polarity.actions.back"));
  assert.ok(result.errors.includes("INE_VALIDATION_UNKNOWN_PROPERTY:polarity.unexpected"));
});

test("validator accepts a reusable living card with bilingual metadata", () => {
  const result = validateLivingCard({
    id: "premier-pas",
    type: "living-card",
    title: "Carte du Premier Pas",
    subtitle: "Oser entrer dans le récit.",
    image: "assets/image.svg",
    imageAlt: "Une graine.",
    symbol: "graine",
    quote: "Tout récit vivant commence.",
    motto: "ÉCOUTER • RELIER • HABITER • TRANSMETTRE",
    metadata: [{ label: "Famille", value: "Atlas" }],
    previous: null,
    next: "equilibre-vivant",
    locale: { fr: {}, en: { title: "Card of the First Step" } },
  });
  assert.deepEqual(result, { valid: true, errors: [] });
});

test("validator rejects incomplete or unexpected living card content", () => {
  const result = validateLivingCard({
    id: "Bad Id",
    type: "card",
    title: "Carte",
    subtitle: "",
    image: "image.svg",
    imageAlt: "Image",
    symbol: "symbole",
    quote: "Citation",
    motto: "Devise",
    metadata: [{ label: "Famille" }],
    previous: null,
    next: 12,
    locale: { fr: [], en: { title: "" } },
    unexpected: true,
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("INE_LIVING_CARD_TYPE_INVALID:livingCard.type"));
  assert.ok(result.errors.includes("INE_LIVING_CARD_ID_INVALID:livingCard.id"));
  assert.ok(result.errors.includes("INE_LIVING_CARD_STRING_REQUIRED:livingCard.subtitle"));
  assert.ok(result.errors.includes("INE_LIVING_CARD_LINK_INVALID:livingCard.next"));
  assert.ok(result.errors.includes("INE_LIVING_CARD_METADATA_STRING_REQUIRED:livingCard.metadata[0].value"));
  assert.ok(result.errors.includes("INE_LIVING_CARD_LOCALE_OBJECT_REQUIRED:livingCard.locale.fr"));
  assert.ok(result.errors.includes("INE_LIVING_CARD_LOCALE_STRING_INVALID:livingCard.locale.en.title"));
  assert.ok(result.errors.includes("INE_VALIDATION_UNKNOWN_PROPERTY:livingCard.unexpected"));
});
