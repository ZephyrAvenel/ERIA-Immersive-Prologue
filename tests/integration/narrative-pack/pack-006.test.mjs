import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-006-la-metamorphose");

test("PACK-006 manifest declares thirteen independent narrative steps", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const result = validateNarrativePack(manifest);
  assert.equal(result.valid, true, result.errors.join(", "));
  assert.equal(manifest.format, "ine-narrative-pack");
  assert.equal(manifest.id, "pack-006");
  assert.equal(manifest.title, "La Métamorphose");
  assert.equal(manifest.subtitle, "Quand devenir soi ressemble, aux yeux des autres, à devenir quelqu’un d’autre.");
  assert.equal(manifest.startScene, "scene-00");
  assert.equal(manifest.scenes.length, 13);
  assert.equal(new Set(manifest.scenes.map(({ id }) => id)).size, 13);
  assert.equal(JSON.stringify(manifest).includes("pack-001"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-002"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-003"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-004"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-005"), false);
});

test("PACK-006 uses optimized WebP images and preserves the image gap documented for scene 6", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/00-couverture-la-metamorphose.webp");
  assert.equal(manifest.coverImageAlt.length > 0, true);

  const missingSourceImageScene = manifest.scenes.find(({ id }) => id === "scene-06");
  assert.equal(missingSourceImageScene.title, "Tu as changé.");
  assert.equal("image" in missingSourceImageScene, false);
  assert.equal("imageAlt" in missingSourceImageScene, false);

  for (const scene of manifest.scenes.filter((entry) => entry.image)) {
    assert.equal(scene.image.endsWith(".webp"), true, scene.id);
    assert.equal(typeof scene.imageAlt, "string", scene.id);
    assert.equal(scene.imageAlt.length > 0, true, scene.id);
    await access(join(packRoot, scene.image));
  }
});

test("PACK-006 preserves PNG originals and uses the expected image naming convention", async () => {
  const imageDirectory = join(packRoot, "assets", "images");
  const originalsDirectory = join(imageDirectory, "originals");
  const webpImages = (await readdir(imageDirectory)).filter((name) => name.endsWith(".webp")).sort();
  const originalPngImages = (await readdir(originalsDirectory)).filter((name) => name.endsWith(".png")).sort();

  assert.deepEqual(webpImages, [
    "00-couverture-la-metamorphose.webp",
    "01-le-monde-des-chenilles.webp",
    "02-les-regards-qui-nous-definissent.webp",
    "03-l-appel-interieur.webp",
    "04-entrer-dans-le-cocon.webp",
    "05-resister-a-l-ancien-recit.webp",
    "07-les-ailes-invisibles.webp",
    "08-les-relations-qui-evoluent.webp",
    "09-devenir-pleinement-soi.webp",
    "10-veiller-ensemble-sur-les-recits-vivants.webp",
    "11-epilogue-le-voyage-continue.webp",
    "12-cloture-un-cycle-des-infinis-possibles.webp",
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

test("PACK-006 is registered as the sixth immersive work", async () => {
  const registry = await readProjectJson("packs", "index.json");
  assert.deepEqual(
    registry.packs.map(({ id }) => id),
    ["les-gardiens-des-recits-vivants", "pack-002", "pack-003", "pack-004", "pack-005", "pack-006"],
  );
  const entry = registry.packs.find(({ id }) => id === "pack-006");
  assert.equal(entry.slug, "la-metamorphose");
  assert.equal(entry.manifest, "pack-006-la-metamorphose/pack.json");
});
