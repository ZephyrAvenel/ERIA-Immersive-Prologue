import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-008-le-veilleur");

test("PACK-008 manifest declares twelve independent narrative steps", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const result = validateNarrativePack(manifest);
  assert.equal(result.valid, true, result.errors.join(", "));
  assert.equal(manifest.format, "ine-narrative-pack");
  assert.equal(manifest.id, "pack-008");
  assert.equal(manifest.title, "Le Veilleur");
  assert.equal(manifest.subtitle, "Du prophète au veilleur");
  assert.equal(manifest.startScene, "scene-00");
  assert.equal(manifest.scenes.length, 12);
  assert.equal(new Set(manifest.scenes.map(({ id }) => id)).size, 12);
  for (let packNumber = 1; packNumber <= 7; packNumber += 1) {
    assert.equal(JSON.stringify(manifest).includes(`pack-00${packNumber}`), false);
  }
});

test("PACK-008 uses optimized WebP images for every narrative step", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/00-couverture-le-veilleur.webp");
  assert.equal(manifest.coverImageAlt.length > 0, true);

  const aiScene = manifest.scenes.find(({ id }) => id === "scene-09");
  assert.equal(aiScene.title, "La Plume et l’IA");
  assert.equal(aiScene.image, "assets/images/09-la-plume-et-l-ia.webp");
  assert.equal(aiScene.imageAlt.length > 0, true);

  for (const scene of manifest.scenes) {
    assert.equal(scene.image.endsWith(".webp"), true, scene.id);
    assert.equal(typeof scene.imageAlt, "string", scene.id);
    assert.equal(scene.imageAlt.length > 0, true, scene.id);
    await access(join(packRoot, scene.image));
  }
});

test("PACK-008 preserves PNG originals and maps 010 and 011 explicitly", async () => {
  const imageDirectory = join(packRoot, "assets", "images");
  const originalsDirectory = join(imageDirectory, "originals");
  const webpImages = (await readdir(imageDirectory)).filter((name) => name.endsWith(".webp")).sort();
  const originalPngImages = (await readdir(originalsDirectory)).filter((name) => name.endsWith(".png")).sort();

  assert.deepEqual(webpImages, [
    "00-couverture-le-veilleur.webp",
    "01-la-voix.webp",
    "02-le-prophete.webp",
    "03-le-poete.webp",
    "04-le-bruit-du-monde.webp",
    "05-le-silence.webp",
    "06-le-veilleur.webp",
    "07-les-recits-vivants.webp",
    "08-le-monde-commun.webp",
    "09-la-plume-et-l-ia.webp",
    "10-transmettre.webp",
    "11-cloture-devenir-veilleur.webp",
  ]);
  assert.deepEqual(
    originalPngImages.map((name) => name.replace(".png", ".webp")),
    webpImages,
  );
  assert.equal(originalPngImages.includes("010.png"), false);
  assert.equal(originalPngImages.includes("011.png"), false);
  assert.equal(originalPngImages.includes("10-transmettre.png"), true);
  assert.equal(originalPngImages.includes("11-cloture-devenir-veilleur.png"), true);

  for (const image of webpImages) {
    const bytes = await readFile(join(imageDirectory, image));
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", image);
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", image);
    assert.ok(bytes.length < 700_000, `${image} exceeds the performance budget`);
  }
});

test("PACK-008 is registered as the eighth immersive work", async () => {
  const registry = await readProjectJson("packs", "index.json");
  assert.deepEqual(
    registry.packs.map(({ id }) => id),
    [
      "les-gardiens-des-recits-vivants",
      "pack-002",
      "pack-003",
      "pack-004",
      "pack-005",
      "pack-006",
      "pack-007",
      "pack-008",
    ],
  );
  const entry = registry.packs.find(({ id }) => id === "pack-008");
  assert.equal(entry.slug, "le-veilleur");
  assert.equal(entry.manifest, "pack-008-le-veilleur/pack.json");
});
