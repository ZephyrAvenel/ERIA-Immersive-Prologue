import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validatePolarity } from "../../../.test-build/packages/validators/src/index.js";
import { readProjectJson } from "../../helpers/fixtures.mjs";

const packRoot = join("packs", "pack-002-polarites-vivantes");

test("PACK-002 manifest declares ten independent contemplative polarities", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.format, "ine-polarity-pack");
  assert.equal(manifest.id, "pack-002");
  assert.equal(manifest.type, "contemplatif");
  assert.equal(manifest.entry, "01-affirmation-don");
  assert.equal(
    manifest.articleUrl,
    "https://zephyr-avenel.blogspot.com/2026/07/les-tensions-fecondes-des-polarites.html?m=1",
  );
  assert.equal(manifest.polarities.length, 10);
  assert.equal(new Set(manifest.polarities.map(({ id }) => id)).size, 10);
  assert.equal(JSON.stringify(manifest).includes("demo-pack"), false);
});

test("all PACK-002 polarity JSON files validate and form a bounded path", async () => {
  const manifest = await readProjectJson(packRoot, "pack.json");
  const ids = new Set(manifest.polarities.map(({ id }) => id));
  const files = await readdir(join(packRoot, "polarities"));
  assert.equal(files.filter((name) => name.endsWith(".json")).length, 10);

  for (const [index, item] of manifest.polarities.entries()) {
    const polarity = await readProjectJson(packRoot, ...item.source.split("/"));
    const result = validatePolarity(polarity);
    assert.equal(result.valid, true, `${item.source}: ${result.errors.join(", ")}`);
    assert.equal(polarity.id, item.id);
    assert.equal(polarity.previous, index === 0 ? null : manifest.polarities[index - 1].id);
    assert.equal(polarity.next, index === 9 ? null : manifest.polarities[index + 1].id);
    if (polarity.previous) assert.equal(ids.has(polarity.previous), true);
    if (polarity.next) assert.equal(ids.has(polarity.next), true);
    assert.equal(polarity.article.startsWith("https://zephyr-avenel.blogspot.com/"), true);
    await access(join(packRoot, "polarities", polarity.image));
  }
});

test("PACK-002 contains twelve optimized WebP illustrations and immutable PNG originals", async () => {
  const imageDirectory = join(packRoot, "assets", "images");
  const originalsDirectory = join(imageDirectory, "originals");
  const images = (await readdir(imageDirectory)).filter((name) => name.endsWith(".webp"));
  const originals = (await readdir(originalsDirectory)).filter((name) => name.endsWith(".png"));
  assert.equal(images.length, 12);
  assert.equal(originals.length, 12);
  assert.deepEqual(
    images.map((name) => name.replace(".webp", "")),
    originals.map((name) => name.replace(".png", "")),
  );
  for (const image of images) {
    const bytes = await readFile(join(imageDirectory, image));
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", image);
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", image);
    assert.ok(bytes.length < 700_000, `${image} exceeds the performance budget`);
  }
  const manifest = await readProjectJson(packRoot, "pack.json");
  assert.equal(manifest.coverImage, "assets/images/00-couverture.webp");
  assert.equal(manifest.closingImage, "assets/images/11-cloture.webp");
  assert.equal(manifest.fallbackImage, manifest.coverImage);
});

test("pack registry discovers both packs without introducing cross-pack dependencies", async () => {
  const registry = await readProjectJson("packs", "index.json");
  assert.equal(registry.format, "ine-pack-registry");
  assert.equal(registry.version, "1.0");
  assert.equal(registry.home, "les-gardiens-des-recits-vivants");
  assert.deepEqual(
    registry.packs.map(({ id }) => id),
    ["les-gardiens-des-recits-vivants", "pack-002"],
  );
  assert.equal(registry.packs.every((entry) => !("title" in entry) && !("type" in entry)), true);
  for (const entry of registry.packs) {
    await access(join("packs", entry.manifest));
    const manifest = await readProjectJson("packs", ...entry.manifest.split("/"));
    assert.equal(manifest.id, entry.id);
    for (const field of ["title", "subtitle", "description", "coverImage", "coverImageAlt"]) {
      assert.equal(typeof manifest[field], "string", `${entry.id}.${field}`);
    }
  }

  const engineSources = await Promise.all([
    readFile("packages/core/src/index.ts", "utf8"),
    readFile("packages/renderer/src/index.ts", "utf8"),
    readFile("apps/player/src/main.ts", "utf8"),
  ]);
  const engineText = engineSources.join("\n");
  assert.equal(engineText.includes("Les Gardiens des Récits Vivants"), false);
  assert.equal(engineText.includes("Entre affirmation et don"), false);

  const pack002Files = [
    await readFile(join(packRoot, "pack.json"), "utf8"),
    ...(await Promise.all(
      (await readdir(join(packRoot, "polarities")))
        .filter((name) => name.endsWith(".json"))
        .map((name) => readFile(join(packRoot, "polarities", name), "utf8")),
    )),
  ].join("\n");
  assert.equal(pack002Files.includes("examples/demo-pack"), false);
  assert.equal(pack002Files.includes("scene-01"), false);
});
