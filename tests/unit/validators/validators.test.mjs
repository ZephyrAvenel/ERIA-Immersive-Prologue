import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
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
