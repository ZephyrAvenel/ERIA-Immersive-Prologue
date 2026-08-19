import assert from "node:assert/strict";
import test from "node:test";
import {
  loadWorkshopPack,
  WorkshopEngine,
} from "../../../.test-build/packages/core/src/index.js";
import { validateWorkshopPack } from "../../../.test-build/packages/validators/src/index.js";
import { readJsonFixture, readProjectJson } from "../../helpers/fixtures.mjs";

test("technical workshop fixture is valid, declarative, and navigable", async () => {
  const fixture = await readJsonFixture("workshop/valid", "minimal.json");
  const result = validateWorkshopPack(fixture);
  assert.deepEqual(result, { valid: true, errors: [] });
  assert.equal(fixture.format, "ine-workshop-pack");
  assert.equal(fixture.movements.length, 2);
  assert.equal(fixture.pages.length, 2);
  assert.equal(fixture.pages.some((page) => page.blocks.some((block) => block.type === "promptCopy")), true);
  assert.equal(JSON.stringify(fixture).includes("apiKey"), false);
  assert.equal(JSON.stringify(fixture).includes("endpoint"), false);
  assert.equal(JSON.stringify(fixture).includes("chatbot"), false);

  const engine = new WorkshopEngine(fixture);
  assert.equal(engine.currentPage.id, "page-01");
  engine.next();
  assert.equal(engine.currentPage.id, "page-02");
});

test("workshop schema remains independent from the narrative pack schema", async () => {
  const workshopSchema = await readProjectJson("schemas", "workshop-pack.schema.json");
  const narrativeSchema = await readProjectJson("schemas", "narrative-pack.schema.json");
  assert.equal(workshopSchema.properties.format.const, "ine-workshop-pack");
  assert.equal(narrativeSchema.properties.format.const, "ine-narrative-pack");
  assert.equal(workshopSchema.properties.pages.items.$ref, "#/$defs/page");
  assert.equal(narrativeSchema.properties.scenes.items.$ref, "#/$defs/scene");
});

test("workshop loader keeps the pack local and declarative", async () => {
  const fixture = await readJsonFixture("workshop/valid", "minimal.json");
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => fixture });

  try {
    const loaded = await loadWorkshopPack(
      new URL("https://example.test/ateliers/ecriture-augmentee/pack.json"),
      validateWorkshopPack,
    );
    assert.equal(loaded.id, "ecriture-augmentee");
    assert.equal(loaded.pages[1].blocks.find((block) => block.type === "promptCopy").text.includes("Ne choisis pas à ma place."), true);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
