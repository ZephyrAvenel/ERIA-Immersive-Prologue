import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { loadNarrativePack, NarrativeEngine } from "../../../.test-build/packages/core/src/index.js";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

test("demo Narrative Pack remains valid, French, and independent from engine code", async () => {
  const pack = await readProjectJson("examples", "demo-pack", "pack.json");
  const result = validateNarrativePack(pack);

  assert.equal(result.valid, true, result.errors.join(", "));
  assert.equal(pack.language, "fr");
  assert.equal(pack.scenes.length, 8);
  assert.equal(pack.scenes.every((scene) => scene.image?.startsWith("assets/images/")), true);
  assert.equal(pack.scenes.some((scene) => "imageDisplayMode" in scene), false);
  assert.deepEqual(pack.presentation.defaultTransition, {
    type: "fade",
    durationMs: 450,
    easing: "ease-in-out",
  });
});

test("demo Narrative Pack references exactly eight existing PNG images", async () => {
  const pack = await readProjectJson("examples", "demo-pack", "pack.json");
  const files = await readdir("examples/demo-pack/assets/images");
  const pngFiles = files.filter((name) => name.endsWith(".png"));
  const sceneImages = pack.scenes.map((scene) => scene.image);

  assert.equal(pngFiles.length, 8);
  assert.equal(new Set(pngFiles).size, 8);
  assert.equal(sceneImages.length, 8);

  for (const image of sceneImages) {
    await access(join("examples", "demo-pack", image));
    assert.ok(pngFiles.includes(image.replace("assets/images/", "")));
  }
});

test("demo Narrative Pack images are non-empty PNG files", async () => {
  const pack = await readProjectJson("examples", "demo-pack", "pack.json");
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  for (const scene of pack.scenes) {
    const bytes = await readFile(join("examples", "demo-pack", scene.image));
    assert.ok(bytes.length > 0, scene.image);
    assert.equal(bytes.subarray(0, pngSignature.length).equals(pngSignature), true, scene.image);
  }
});

test("loading a moved pack keeps image URLs relative to the moved manifest", async () => {
  const pack = await readProjectJson("examples", "demo-pack", "pack.json");
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => pack,
  });

  try {
    const loaded = await loadNarrativePack(
      new URL("https://cdn.example.test/moved/work/pack.json"),
      validateNarrativePack,
    );
    assert.equal(
      loaded.scenes[0].image,
      "https://cdn.example.test/moved/work/assets/images/scene-01-mount-fuji.png",
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("loaded demo pack can be navigated from first to last scene", async () => {
  const pack = await readProjectJson("examples", "demo-pack", "pack.json");
  const engine = new NarrativeEngine(pack);

  assert.equal(engine.currentScene.id, "scene-01");
  for (let index = 1; index < pack.scenes.length; index += 1) {
    engine.next();
    assert.equal(engine.currentScene.id, `scene-${String(index + 1).padStart(2, "0")}`);
  }
  assert.equal(engine.currentSceneIndex, 7);
  assert.equal(engine.progress, 1);
  assert.equal(engine.canGoNext, false);
});
