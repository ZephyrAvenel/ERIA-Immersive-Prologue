import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-007-jouer-pour-devenir");

test("PACK-007 manifest declares fourteen independent narrative steps", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const result = validateNarrativePack(manifest);
  assert.equal(result.valid, true, result.errors.join(", "));
  assert.equal(manifest.format, "ine-narrative-pack");
  assert.equal(manifest.id, "pack-007");
  assert.equal(manifest.title, "Jouer pour devenir");
  assert.equal(manifest.subtitle, "Quand le jeu ouvre des chemins que l’enseignement seul ne peut pas révéler.");
  assert.equal(manifest.startScene, "scene-00");
  assert.equal(manifest.scenes.length, 14);
  assert.equal(new Set(manifest.scenes.map(({ id }) => id)).size, 14);
  assert.equal(JSON.stringify(manifest).includes("pack-001"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-002"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-003"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-004"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-005"), false);
  assert.equal(JSON.stringify(manifest).includes("pack-006"), false);
});

test("PACK-007 uses optimized WebP images for every narrative step", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/00-couverture-jouer-pour-devenir.webp");
  assert.equal(manifest.coverImageAlt.length > 0, true);

  const finalScene = manifest.scenes.find(({ id }) => id === "scene-13");
  assert.equal(finalScene.title, "Le jeu continue avec vous");
  assert.equal(finalScene.image, "assets/images/13-le-jeu-continue-avec-vous.webp");
  assert.equal(finalScene.imageAlt.length > 0, true);

  for (const scene of manifest.scenes) {
    assert.equal(scene.image.endsWith(".webp"), true, scene.id);
    assert.equal(typeof scene.imageAlt, "string", scene.id);
    assert.equal(scene.imageAlt.length > 0, true, scene.id);
    await access(join(packRoot, scene.image));
  }
});

test("PACK-007 preserves PNG originals and uses the expected image naming convention", async () => {
  const imageDirectory = join(packRoot, "assets", "images");
  const originalsDirectory = join(imageDirectory, "originals");
  const webpImages = (await readdir(imageDirectory)).filter((name) => name.endsWith(".webp")).sort();
  const originalPngImages = (await readdir(originalsDirectory)).filter((name) => name.endsWith(".png")).sort();

  assert.deepEqual(webpImages, [
    "00-couverture-jouer-pour-devenir.webp",
    "01-premier-terrain-exploration.webp",
    "02-imagination-transforme-realite.webp",
    "03-droit-dessayer.webp",
    "04-jouer-avec-les-autres.webp",
    "05-recits-que-nous-construisons.webp",
    "06-recits-empeches.webp",
    "07-retrouver-le-jeu-age-adulte.webp",
    "08-jeu-comme-ecologie-du-vivant.webp",
    "09-apprendre-explorer-creer-devenir.webp",
    "10-jeu-tisse-liens-entre-temps.webp",
    "11-continuer-a-jouer.webp",
    "12-et-apres.webp",
    "13-le-jeu-continue-avec-vous.webp",
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

test("PACK-007 is registered as the seventh immersive work", async () => {
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
      "pack-013-la-chaise",
    ],
  );
  const entry = registry.packs.find(({ id }) => id === "pack-007");
  assert.equal(entry.slug, "jouer-pour-devenir");
  assert.equal(entry.manifest, "pack-007-jouer-pour-devenir/pack.json");
});
