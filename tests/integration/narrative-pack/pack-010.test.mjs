import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-010-le-monde-commun");

test("PACK-010 manifest declares twelve image-then-text narrative entries", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const result = validateNarrativePack(manifest);
  assert.equal(result.valid, true, result.errors.join(", "));
  assert.equal(manifest.format, "ine-narrative-pack");
  assert.equal(manifest.id, "pack-010-le-monde-commun");
  assert.equal(manifest.title, "Le Monde commun");
  assert.equal(manifest.subtitle, "Habiter nos différences sans rompre le lien.");
  assert.equal(manifest.layout, "image-then-text");
  assert.equal(manifest.startScene, "scene-00");
  assert.equal(manifest.scenes.length, 12);
  assert.equal(new Set(manifest.scenes.map(({ id }) => id)).size, 12);
  for (let packNumber = 1; packNumber <= 9; packNumber += 1) {
    assert.equal(JSON.stringify(manifest).includes(`pack-00${packNumber}`), false);
  }
});

test("PACK-010 uses optimized WebP images for every image-then-text step", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/00-couverture-le-monde-commun.webp");
  assert.equal(manifest.coverImageAlt.length > 0, true);

  const finalScene = manifest.scenes.find(({ id }) => id === "scene-11");
  assert.equal(finalScene.title, "Clôture — Faire monde");
  assert.equal(finalScene.image, "assets/images/11-faire-monde.webp");
  assert.equal(finalScene.imageAlt.length > 0, true);

  for (const scene of manifest.scenes) {
    assert.equal(scene.image.endsWith(".webp"), true, scene.id);
    assert.equal(scene.imageDisplayMode, "contain", scene.id);
    assert.equal(typeof scene.imageAlt, "string", scene.id);
    assert.equal(scene.imageAlt.length > 0, true, scene.id);
    await access(join(packRoot, scene.image));
  }
});

test("PACK-010 preserves PNG originals and uses the required naming convention", async () => {
  const imageDirectory = join(packRoot, "assets", "images");
  const originalsDirectory = join(imageDirectory, "originals");
  const webpImages = (await readdir(imageDirectory)).filter((name) => name.endsWith(".webp")).sort();
  const originalPngImages = (await readdir(originalsDirectory)).filter((name) => name.endsWith(".png")).sort();

  assert.deepEqual(webpImages, [
    "00-couverture-le-monde-commun.webp",
    "01-des-chemins-differents.webp",
    "02-la-tentation-du-camp.webp",
    "03-ce-qui-nous-separe.webp",
    "04-ce-qui-nous-relie-encore.webp",
    "05-le-desaccord-vivant.webp",
    "06-l-ecoute-comme-seuil.webp",
    "07-construire-sans-uniformiser.webp",
    "08-les-lieux-qui-tiennent-le-lien.webp",
    "09-les-recits-qui-reparent.webp",
    "10-veiller-ensemble.webp",
    "11-faire-monde.webp",
  ]);
  assert.deepEqual(
    originalPngImages.map((name) => name.replace(".png", ".webp")),
    webpImages,
  );

  for (const image of webpImages) {
    const bytes = await readFile(join(imageDirectory, image));
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", image);
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", image);
    assert.ok(bytes.length < 700_000, `${image} exceeds the performance budget`);
  }
});

test("PACK-010 is registered as the tenth immersive work", async () => {
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
      "pack-009-trouver-sa-juste-place",
      "pack-010-le-monde-commun",
      "pack-011-la-joie-lucide",
    ],
  );
  const entry = registry.packs.find(({ id }) => id === "pack-010-le-monde-commun");
  assert.equal(entry.slug, "le-monde-commun");
  assert.equal(entry.manifest, "pack-010-le-monde-commun/pack.json");
});
