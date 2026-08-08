import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-013-la-chaise");
const expectedPackIds = [
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
];

const expectedWebpImages = [
  "00-couverture-la-chaise.webp",
  "01-la-table.webp",
  "02-une-place-parmi-les-autres.webp",
  "03-la-chaise-que-l-on-nous-donne.webp",
  "04-rester-debout.webp",
  "05-demander-une-chaise.webp",
  "06-la-chaise-assignee.webp",
  "07-se-retrecir.webp",
  "08-voir-le-dessous.webp",
  "09-la-chaise-vide.webp",
  "10-se-lever.webp",
  "11-entre-les-tables.webp",
  "12-la-table-reciproque.webp",
  "13-construire-la-table.webp",
  "14-la-chaise-libre.webp",
];

test("PACK-013 manifest declares fifteen image-then-text entries", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const result = validateNarrativePack(manifest);
  assert.equal(result.valid, true, result.errors.join(", "));
  assert.equal(manifest.format, "ine-narrative-pack");
  assert.equal(manifest.id, "pack-013-la-chaise");
  assert.equal(manifest.title, "La Chaise");
  assert.equal(manifest.subtitle, "Quelle place une relation nous donne-t-elle vraiment ?");
  assert.equal(manifest.layout, "image-then-text");
  assert.equal(manifest.startScene, "scene-00");
  assert.equal(manifest.scenes.length, 15);
  assert.equal(new Set(manifest.scenes.map(({ id }) => id)).size, 15);
  assert.equal(manifest.scenes.at(1).title, "La Table \u2014 Entrer");
  assert.equal(manifest.scenes.at(8).title, "Voir le dessous \u2014 Observer");
  assert.equal(manifest.scenes.at(12).title, "La table r\u00e9ciproque \u2014 Rencontrer");
  assert.equal(manifest.scenes.at(13).title, "Construire la table \u2014 Co-cr\u00e9er");
  assert.equal(manifest.scenes.at(-1).title, "La chaise libre \u2014 Habiter");
  assert.equal(manifest.scenes.at(-1).text.includes("Il reste une chaise."), true);
});

test("PACK-013 uses optimized WebP images and preserves contain mode", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/00-couverture-la-chaise.webp");
  assert.equal(manifest.coverImageAlt.length > 0, true);

  for (const scene of manifest.scenes) {
    assert.equal(scene.image.endsWith(".webp"), true, scene.id);
    assert.equal(scene.imageDisplayMode, "contain", scene.id);
    assert.equal(typeof scene.imageAlt, "string", scene.id);
    assert.equal(scene.imageAlt.length > 0, true, scene.id);
    await access(join(packRoot, scene.image));
  }
});

test("PACK-013 preserves fifteen PNG originals and follows the mission mapping", async () => {
  const imageDirectory = join(packRoot, "assets", "images");
  const originalsDirectory = join(imageDirectory, "originals");
  const webpImages = (await readdir(imageDirectory)).filter((name) => name.endsWith(".webp")).sort();
  const originalPngImages = (await readdir(originalsDirectory)).filter((name) => name.endsWith(".png")).sort();

  assert.deepEqual(webpImages, [...expectedWebpImages].sort());
  assert.deepEqual(
    originalPngImages.map((name) => name.replace(".png", ".webp")).sort(),
    webpImages,
  );

  for (const image of webpImages) {
    const bytes = await readFile(join(imageDirectory, image));
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", image);
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", image);
    assert.ok(bytes.length < 700_000, image + " exceeds the performance budget");
  }
});

test("PACK-013 exposes the Le Dessous external resource without replacing internal progression", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const undersideScene = manifest.scenes.find(({ id }) => id === "scene-08");
  assert.equal(undersideScene.title, "Voir le dessous \u2014 Observer");
  assert.equal(undersideScene.links.length, 1);
  assert.equal(undersideScene.links[0].label, "Explorer \u00ab Le Dessous \u00bb");
  assert.equal(undersideScene.links[0].href, "https://zephyr-avenel.blogspot.com/2026/08/le-dessous.html");
});

test("PACK-013 is registered as the thirteenth immersive work", async () => {
  const registry = await readProjectJson("packs", "index.json");
  assert.deepEqual(registry.packs.map(({ id }) => id), expectedPackIds);
  const entry = registry.packs.find(({ id }) => id === "pack-013-la-chaise");
  assert.equal(entry.slug, "la-chaise");
  assert.equal(entry.manifest, "pack-013-la-chaise/pack.json");
});
