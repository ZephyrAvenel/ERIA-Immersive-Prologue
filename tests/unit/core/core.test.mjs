import assert from "node:assert/strict";
import test from "node:test";
import { NarrativeEngine, loadNarrativePack } from "../../../.test-build/packages/core/src/index.js";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";

function createPack() {
  return {
    format: "ine-narrative-pack",
    version: "1.0",
    id: "core-pack",
    title: "Core Pack",
    language: "fr",
    startScene: "middle",
    scenes: [
      { id: "start", title: "Start", text: "First." },
      { id: "middle", title: "Middle", text: "Second." },
      { id: "end", title: "End", text: "Third." },
    ],
  };
}

test("loadNarrativePack loads a valid manifest and resolves scene assets", async () => {
  const pack = {
    ...createPack(),
    startScene: "start",
    scenes: [{ id: "start", title: "Start", text: "First.", image: "assets/images/start.png" }],
  };
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => pack,
  });

  try {
    const loaded = await loadNarrativePack(
      new URL("https://example.test/packs/demo/pack.json"),
      validateNarrativePack,
    );
    assert.equal(loaded.title, "Core Pack");
    assert.equal(loaded.language, "fr");
    assert.equal(loaded.startScene, "start");
    assert.equal(loaded.scenes.length, 1);
    assert.equal(loaded.scenes[0].image, "https://example.test/packs/demo/assets/images/start.png");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("loadNarrativePack rejects failed requests with a stable error code", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404 });

  try {
    await assert.rejects(
      () => loadNarrativePack(new URL("https://example.test/missing.json"), validateNarrativePack),
      /INE_PACK_REQUEST_FAILED/,
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("loadNarrativePack rejects invalid manifests with a stable error code", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ invalid: true }),
  });

  try {
    await assert.rejects(
      () => loadNarrativePack(new URL("https://example.test/invalid.json"), validateNarrativePack),
      /INE_PACK_INVALID/,
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("NarrativeEngine selects the start scene and navigates deterministically", () => {
  const engine = new NarrativeEngine(createPack());

  assert.equal(engine.currentScene.id, "middle");
  assert.equal(engine.currentSceneIndex, 1);
  assert.equal(engine.sceneCount, 3);
  assert.equal(engine.progress, 2 / 3);
  assert.equal(engine.canGoPrevious, true);
  assert.equal(engine.canGoNext, true);

  engine.next();
  engine.next();
  assert.equal(engine.currentScene.id, "end");
  assert.equal(engine.currentSceneIndex, 2);
  assert.equal(engine.progress, 1);
  assert.equal(engine.canGoNext, false);

  engine.previous();
  engine.previous();
  engine.previous();
  assert.equal(engine.currentScene.id, "start");
  assert.equal(engine.currentSceneIndex, 0);
  assert.equal(engine.progress, 1 / 3);
  assert.equal(engine.canGoPrevious, false);
});

test("NarrativeEngine rejects a missing start scene", () => {
  assert.throws(
    () => new NarrativeEngine({ ...createPack(), startScene: "missing" }),
    /INE_START_SCENE_MISSING/,
  );
});

test("NarrativeEngine reports an incoherent navigation state", () => {
  const pack = createPack();
  const engine = new NarrativeEngine(pack);
  pack.scenes.length = 0;
  assert.throws(() => engine.currentScene, /INE_SCENE_STATE_INVALID/);
});
