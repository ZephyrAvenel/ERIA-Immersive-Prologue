import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-005-recits-qui-revelent-ou-enferment");

test("PACK-005 manifest declares twelve independent narrative steps", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const result = validateNarrativePack(manifest);
  assert.equal(result.valid, true, result.errors.join(", "));
  assert.equal(manifest.format, "ine-narrative-pack");
  assert.equal(manifest.id, "pack-005");
  assert.equal(manifest.title, "Les récits qui révèlent… ou qui enferment");
  assert.equal(manifest.subtitle, "Le pouvoir des attentes sur nos vies");
  assert.equal(manifest.startScene, "scene-00");
  assert.equal(manifest.scenes.length, 12);
  assert.equal(new Set(manifest.scenes.map(({ id }) => id)).size, 12);
  assert.equal(JSON.stringify(manifest).includes("pack-001"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-002"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-003"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-004"), false);
});

test("PACK-005 uses optimized WebP images including the scene 2 dedicated illustration", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/00-couverture-recits-qui-revelent-ou-enferment.webp");
  assert.equal(manifest.coverImageAlt.length > 0, true);

  const attentesInvisibles = manifest.scenes.find(({ id }) => id === "scene-02");
  assert.equal(attentesInvisibles.title, "Les attentes invisibles");
  assert.equal(attentesInvisibles.image, "assets/images/02-les-attentes-invisibles.webp");
  assert.equal(attentesInvisibles.imageAlt.length > 0, true);

  for (const scene of manifest.scenes.filter((entry) => entry.image)) {
    assert.equal(scene.image.endsWith(".webp"), true, scene.id);
    assert.equal(typeof scene.imageAlt, "string", scene.id);
    assert.equal(scene.imageAlt.length > 0, true, scene.id);
    await access(join(packRoot, scene.image));
  }
});

test("PACK-005 preserves PNG originals and uses the expected image naming convention", async () => {
  const imageDirectory = join(packRoot, "assets", "images");
  const originalsDirectory = join(imageDirectory, "originals");
  const webpImages = (await readdir(imageDirectory)).filter((name) => name.endsWith(".webp")).sort();
  const originalPngImages = (await readdir(originalsDirectory)).filter((name) => name.endsWith(".png")).sort();

  assert.deepEqual(webpImages, [
    "00-couverture-alt-pack-005.webp",
    "00-couverture-recits-qui-revelent-ou-enferment.webp",
    "01-le-premier-regard.webp",
    "02-les-attentes-invisibles.webp",
    "03-une-experience-celebre.webp",
    "04-les-chemins-qui-souvrent.webp",
    "05-lorsque-le-recit-devient-une-cage.webp",
    "06-les-recits-empeches.webp",
    "07-les-recits-vivants.webp",
    "08-le-recit-que-je-porte-sur-moi-meme.webp",
    "09-les-passeurs-de-recits.webp",
    "10-une-responsabilite-partagee.webp",
    "11-quel-recit-faisons-nous-grandir.webp",
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

test("PACK-005 is registered as the fifth immersive work", async () => {
  const registry = await readProjectJson("packs", "index.json");
  assert.deepEqual(
    registry.packs.map(({ id }) => id),
    ["les-gardiens-des-recits-vivants", "pack-002", "pack-003", "pack-004", "pack-005", "pack-006", "pack-007", "pack-008", "pack-009-trouver-sa-juste-place", "pack-010-le-monde-commun"],
  );
  const entry = registry.packs.find(({ id }) => id === "pack-005");
  assert.equal(entry.slug, "recits-qui-revelent-ou-enferment");
  assert.equal(entry.manifest, "pack-005-recits-qui-revelent-ou-enferment/pack.json");
});
