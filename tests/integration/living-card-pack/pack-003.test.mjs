import assert from "node:assert/strict";
import { access, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateLivingCard } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-003-atlas-recits-vivants");

test("PACK-003 manifest declares eight independent living cards", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.format, "ine-living-card-pack");
  assert.equal(manifest.id, "pack-003");
  assert.equal(manifest.type, "symbolique");
  assert.equal(manifest.entry, "premier-pas");
  assert.equal(manifest.cards.length, 8);
  assert.equal(new Set(manifest.cards.map(({ id }) => id)).size, 8);
  assert.equal(JSON.stringify(manifest).includes("pack-002"), false);
  assert.equal(JSON.stringify(manifest).includes("demo-pack"), false);
});

test("all PACK-003 Living Card JSON files validate and form a bounded path", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const ids = new Set(manifest.cards.map(({ id }) => id));
  const files = await readdir(join(packRoot, "cards"));
  assert.equal(files.filter((name) => name.endsWith(".json")).length, 8);

  for (const [index, item] of manifest.cards.entries()) {
    const card = await readProjectJson(packRoot, ...item.source.split("/"));
    const result = validateLivingCard(card);
    assert.equal(result.valid, true, `${item.source}: ${result.errors.join(", ")}`);
    assert.equal(card.id, item.id);
    assert.equal(card.type, "living-card");
    assert.equal(card.previous, index === 0 ? null : manifest.cards[index - 1].id);
    assert.equal(card.next, index === 7 ? null : manifest.cards[index + 1].id);
    assert.equal(card.motto, "ÉCOUTER • RELIER • HABITER • TRANSMETTRE");
    assert.equal(typeof card.locale.fr, "object");
    assert.equal(typeof card.locale.en, "object");
    if (card.previous) assert.equal(ids.has(card.previous), true);
    if (card.next) assert.equal(ids.has(card.next), true);
    await access(join(packRoot, "cards", card.image));
  }
});

test("PACK-003 uses final WebP illustrations while preserving original PNG files", async () => {
  const imageDirectory = join(packRoot, "assets", "images");
  const originalsDirectory = join(imageDirectory, "originals");
  const webpImages = (await readdir(imageDirectory)).filter((name) => name.endsWith(".webp"));
  const originalPngImages = (await readdir(originalsDirectory)).filter((name) => name.endsWith(".png"));
  assert.deepEqual(webpImages.sort(), [
    "00-couverture-atlas-recits-vivants.webp",
    "01-premier-pas.webp",
    "02-equilibre-vivant.webp",
    "03-passage.webp",
    "04-miroir.webp",
    "05-conflit-createur.webp",
    "06-traversee.webp",
    "07-racines.webp",
    "08-monde-commun.webp",
  ]);
  assert.deepEqual(originalPngImages.sort(), [
    "00-couverture-atlas-recits-vivants.png",
    "01-premier-pas.png",
    "02-equilibre-vivant.png",
    "03-passage.png",
    "04-miroir.png",
    "05-conflit-createur.png",
    "06-traversee.png",
    "07-racines.png",
    "08-monde-commun.png",
  ]);
  for (const image of webpImages) {
    await access(join(imageDirectory, image));
  }
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/00-couverture-atlas-recits-vivants.webp");
  assert.equal(manifest.fallbackImage, manifest.coverImage);
});
