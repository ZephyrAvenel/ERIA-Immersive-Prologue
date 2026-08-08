import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-009-trouver-sa-juste-place");

test("PACK-009 manifest declares eleven image-then-text narrative entries", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const result = validateNarrativePack(manifest);
  assert.equal(result.valid, true, result.errors.join(", "));
  assert.equal(manifest.format, "ine-narrative-pack");
  assert.equal(manifest.id, "pack-009-trouver-sa-juste-place");
  assert.equal(manifest.title, "Trouver sa juste place");
  assert.equal(manifest.subtitle, "Habiter sa place sans dominer, sans s’effacer.");
  assert.equal(manifest.layout, "image-then-text");
  assert.equal(manifest.startScene, "scene-00");
  assert.equal(manifest.scenes.length, 11);
  assert.equal(new Set(manifest.scenes.map(({ id }) => id)).size, 11);
  for (let packNumber = 1; packNumber <= 8; packNumber += 1) {
    assert.equal(JSON.stringify(manifest).includes(`pack-00${packNumber}`), false);
  }
});

test("PACK-009 uses optimized WebP images for every image-then-text step", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/00-couverture-trouver-sa-juste-place.webp");
  assert.equal(manifest.coverImageAlt.length > 0, true);

  const finalScene = manifest.scenes.find(({ id }) => id === "scene-10");
  assert.equal(finalScene.title, "Devenir présence");
  assert.equal(finalScene.image, "assets/images/10-devenir-presence.webp");
  assert.equal(finalScene.imageAlt.length > 0, true);

  for (const scene of manifest.scenes) {
    assert.equal(scene.image.endsWith(".webp"), true, scene.id);
    assert.equal(scene.imageDisplayMode, "contain", scene.id);
    assert.equal(typeof scene.imageAlt, "string", scene.id);
    assert.equal(scene.imageAlt.length > 0, true, scene.id);
    await access(join(packRoot, scene.image));
  }
});

test("PACK-009 preserves PNG originals and uses the required naming convention", async () => {
  const imageDirectory = join(packRoot, "assets", "images");
  const originalsDirectory = join(imageDirectory, "originals");
  const webpImages = (await readdir(imageDirectory)).filter((name) => name.endsWith(".webp")).sort();
  const originalPngImages = (await readdir(originalsDirectory)).filter((name) => name.endsWith(".png")).sort();

  assert.deepEqual(webpImages, [
    "00-couverture-trouver-sa-juste-place.webp",
    "01-les-roles-que-nous-recevons.webp",
    "02-le-besoin-d-etre-valide.webp",
    "03-deposer-les-personnages.webp",
    "04-la-juste-distance.webp",
    "05-la-place-se-construit.webp",
    "06-les-gestes-qui-transforment.webp",
    "07-habiter-un-monde-commun.webp",
    "08-reecrire-son-recit.webp",
    "09-les-recits-vivants.webp",
    "10-devenir-presence.webp",
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

test("PACK-009 is registered as the ninth immersive work", async () => {
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
      "pack-012-celle-que-je-navais-pas-encore-rencontree",
    ],
  );
  const entry = registry.packs.find(({ id }) => id === "pack-009-trouver-sa-juste-place");
  assert.equal(entry.slug, "trouver-sa-juste-place");
  assert.equal(entry.manifest, "pack-009-trouver-sa-juste-place/pack.json");
});
