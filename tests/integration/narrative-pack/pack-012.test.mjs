import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateNarrativePack } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-012-celle-que-je-navais-pas-encore-rencontree");
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
];

const expectedWebpImages = [
  "pack-012-cover.webp",
  "pack-012-01-vie-deja-ecrite.webp",
  "pack-012-02-fenetre-autre-vie.webp",
  "pack-012-03-fascination.webp",
  "pack-012-04-deplacement.webp",
  "pack-012-05-perdre-ancien-nom.webp",
  "pack-012-06-autre-peau.webp",
  "pack-012-07-traverser-inconnu.webp",
  "pack-012-08-autre-miroir.webp",
  "pack-012-09-ne-pas-devenir-autre.webp",
  "pack-012-10-revenir-autrement.webp",
  "pack-012-11-habiter-propre-recit.webp",
  "pack-012-closing.webp",
];

test("PACK-012 manifest declares thirteen image-then-text entries", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const result = validateNarrativePack(manifest);
  assert.equal(result.valid, true, result.errors.join(", "));
  assert.equal(manifest.format, "ine-narrative-pack");
  assert.equal(manifest.id, "pack-012-celle-que-je-navais-pas-encore-rencontree");
  assert.equal(manifest.title, "Celle que je n’avais pas encore rencontrée");
  assert.equal(manifest.subtitle, "Un récit vivant");
  assert.equal(manifest.layout, "image-then-text");
  assert.equal(manifest.startScene, "scene-00");
  assert.equal(manifest.scenes.length, 13);
  assert.equal(new Set(manifest.scenes.map(({ id }) => id)).size, 13);
  assert.equal(manifest.scenes.at(1).title, "La vie déjà écrite");
  assert.equal(manifest.scenes.at(9).title, "Ne pas devenir l’autre");
  assert.equal(manifest.scenes.at(-1).title, "Clôture — Épilogue");
  assert.equal(manifest.scenes.at(-1).text.includes("Il existe des rencontres"), true);
});

test("PACK-012 uses optimized WebP images for every Contempler/Lire step", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/pack-012-cover.webp");
  assert.equal(manifest.coverImageAlt.length > 0, true);

  const finalScene = manifest.scenes.find(({ id }) => id === "scene-12");
  assert.equal(finalScene.title, "Clôture — Épilogue");
  assert.equal(finalScene.image, "assets/images/pack-012-closing.webp");
  assert.equal(finalScene.imageAlt.length > 0, true);

  for (const scene of manifest.scenes) {
    assert.equal(scene.image.endsWith(".webp"), true, scene.id);
    assert.equal(scene.imageDisplayMode, "contain", scene.id);
    assert.equal(typeof scene.imageAlt, "string", scene.id);
    assert.equal(scene.imageAlt.length > 0, true, scene.id);
    await access(join(packRoot, scene.image));
  }
});

test("PACK-012 preserves thirteen PNG originals and follows the mission mapping", async () => {
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

test("PACK-012 is registered as the twelfth immersive work", async () => {
  const registry = await readProjectJson("packs", "index.json");
  assert.deepEqual(registry.packs.map(({ id }) => id), expectedPackIds);
  const entry = registry.packs.find(({ id }) => id === "pack-012-celle-que-je-navais-pas-encore-rencontree");
  assert.equal(entry.slug, "celle-que-je-navais-pas-encore-rencontree");
  assert.equal(entry.manifest, "pack-012-celle-que-je-navais-pas-encore-rencontree/pack.json");
});
