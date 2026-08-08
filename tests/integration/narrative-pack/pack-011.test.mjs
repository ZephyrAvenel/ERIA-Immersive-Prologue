import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-011-la-joie-lucide");

test("PACK-011 manifest declares twelve image-then-text entries", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const result = validateNarrativePack(manifest);
  assert.equal(result.valid, true, result.errors.join(", "));
  assert.equal(manifest.format, "ine-narrative-pack");
  assert.equal(manifest.id, "pack-011-la-joie-lucide");
  assert.equal(manifest.title, "La Joie lucide");
  assert.equal(manifest.subtitle, "Voir la houle. Ne pas manquer les dauphins.");
  assert.equal(manifest.layout, "image-then-text");
  assert.equal(manifest.startScene, "scene-00");
  assert.equal(manifest.scenes.length, 12);
  assert.equal(new Set(manifest.scenes.map(({ id }) => id)).size, 12);
  assert.equal(manifest.scenes.at(1).title, "La Houle");
  assert.equal(manifest.scenes.at(-1).title, "Le Nouveau Récit");
  assert.equal(manifest.scenes.slice(1).every(({ text }) => text.includes("LE SEUIL")), true);
});

test("PACK-011 uses optimized WebP images for every Contempler/Lire step", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/00-couverture-la-joie-lucide.webp");
  assert.equal(manifest.coverImageAlt.length > 0, true);

  const finalScene = manifest.scenes.find(({ id }) => id === "scene-11");
  assert.equal(finalScene.title, "Le Nouveau Récit");
  assert.equal(finalScene.image, "assets/images/11-le-nouveau-recit.webp");
  assert.equal(finalScene.imageAlt.length > 0, true);

  for (const scene of manifest.scenes) {
    assert.equal(scene.image.endsWith(".webp"), true, scene.id);
    assert.equal(scene.imageDisplayMode, "contain", scene.id);
    assert.equal(typeof scene.imageAlt, "string", scene.id);
    assert.equal(scene.imageAlt.length > 0, true, scene.id);
    await access(join(packRoot, scene.image));
  }
});

test("PACK-011 preserves PNG originals and uses the project naming convention", async () => {
  const imageDirectory = join(packRoot, "assets", "images");
  const originalsDirectory = join(imageDirectory, "originals");
  const webpImages = (await readdir(imageDirectory)).filter((name) => name.endsWith(".webp")).sort();
  const originalPngImages = (await readdir(originalsDirectory)).filter((name) => name.endsWith(".png")).sort();

  assert.deepEqual(webpImages, [
    "00-couverture-la-joie-lucide.webp",
    "01-la-houle.webp",
    "02-le-droit-a-la-joie.webp",
    "03-la-fausse-lumiere.webp",
    "04-le-regard-capture.webp",
    "05-les-deux-verites.webp",
    "06-les-dauphins-dans-la-houle.webp",
    "07-la-frontiere-sensible.webp",
    "08-la-joie-indocile.webp",
    "09-la-joie-qui-circule.webp",
    "10-la-joie-lucide.webp",
    "11-le-nouveau-recit.webp",
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

test("PACK-011 is registered as the eleventh immersive work", async () => {
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
  const entry = registry.packs.find(({ id }) => id === "pack-011-la-joie-lucide");
  assert.equal(entry.slug, "la-joie-lucide");
  assert.equal(entry.manifest, "pack-011-la-joie-lucide/pack.json");
});
