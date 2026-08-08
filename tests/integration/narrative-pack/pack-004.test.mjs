import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-004-voie-du-milieu");

test("PACK-004 manifest declares eleven independent narrative scenes", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const result = validateNarrativePack(manifest);
  assert.equal(result.valid, true, result.errors.join(", "));
  assert.equal(manifest.format, "ine-narrative-pack");
  assert.equal(manifest.id, "pack-004");
  assert.equal(manifest.title, "La Voie du Milieu");
  assert.equal(manifest.subtitle, "Habiter les tensions plutôt que choisir un camp.");
  assert.equal(manifest.startScene, "scene-00");
  assert.equal(manifest.scenes.length, 11);
  assert.equal(new Set(manifest.scenes.map(({ id }) => id)).size, 11);
  assert.equal(JSON.stringify(manifest).includes("pack-002"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-003"), false);
});

test("PACK-004 scenes use optimized WebP images and accessible alt text", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/00-couverture-voie-du-milieu.webp");
  assert.equal(manifest.coverImageAlt.length > 0, true);

  for (const scene of manifest.scenes) {
    assert.equal(typeof scene.image, "string", scene.id);
    assert.equal(scene.image.endsWith(".webp"), true, scene.id);
    assert.equal(typeof scene.imageAlt, "string", scene.id);
    assert.equal(scene.imageAlt.length > 0, true, scene.id);
    await access(join(packRoot, scene.image));
  }
});

test("PACK-004 preserves PNG originals and uses the expected image naming convention", async () => {
  const imageDirectory = join(packRoot, "assets", "images");
  const originalsDirectory = join(imageDirectory, "originals");
  const webpImages = (await readdir(imageDirectory)).filter((name) => name.endsWith(".webp")).sort();
  const originalPngImages = (await readdir(originalsDirectory)).filter((name) => name.endsWith(".png")).sort();

  assert.deepEqual(webpImages, [
    "00-couverture-voie-du-milieu.webp",
    "01-le-seuil.webp",
    "02-monde-des-oppositions.webp",
    "03-recits-qui-enferment.webp",
    "04-entre-deux-recits-un-choix.webp",
    "05-la-voie-du-milieu.webp",
    "06-presence-au-dela-des-recits.webp",
    "07-le-choix-qui-faconne-le-monde.webp",
    "08-au-seuil-dun-monde-vivant.webp",
    "09-et-demain.webp",
    "10-les-recits-vivants-continuent.webp",
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

test("PACK-004 is registered as the fourth immersive work", async () => {
  const registry = await readProjectJson("packs", "index.json");
  assert.deepEqual(
    registry.packs.map(({ id }) => id),
    ["les-gardiens-des-recits-vivants", "pack-002", "pack-003", "pack-004", "pack-005", "pack-006", "pack-007", "pack-008", "pack-009-trouver-sa-juste-place", "pack-010-le-monde-commun", "pack-011-la-joie-lucide", "pack-012-celle-que-je-navais-pas-encore-rencontree",
      "pack-013-la-chaise"],
  );
  const entry = registry.packs.find(({ id }) => id === "pack-004");
  assert.equal(entry.slug, "voie-du-milieu");
  assert.equal(entry.manifest, "pack-004-voie-du-milieu/pack.json");
});
