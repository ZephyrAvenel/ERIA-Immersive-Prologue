import assert from "node:assert/strict";
import test from "node:test";
import { AssetManager } from "../../../.test-build/packages/core/src/index.js";

test("AssetManager resolves assets relative to the pack manifest", () => {
  const assets = new AssetManager(new URL("https://cdn.example.test/packs/story/pack.json"));

  assert.equal(assets.image("assets/images/scene.png"), "https://cdn.example.test/packs/story/assets/images/scene.png");
  assert.equal(assets.audio("assets/audio/theme.mp3"), "https://cdn.example.test/packs/story/assets/audio/theme.mp3");
  assert.equal(assets.video("assets/video/intro.mp4"), "https://cdn.example.test/packs/story/assets/video/intro.mp4");
  assert.equal(assets.icon("assets/icons/play.svg"), "https://cdn.example.test/packs/story/assets/icons/play.svg");
});

test("AssetManager preserves absolute resource URLs", () => {
  const assets = new AssetManager(new URL("https://example.test/pack.json"));
  assert.equal(assets.image("https://assets.example.test/image.png"), "https://assets.example.test/image.png");
});

test("AssetManager normalizes relative path segments", () => {
  const assets = new AssetManager(new URL("https://example.test/packs/moved/pack.json"));
  assert.equal(assets.resolve("./assets/images/../icons/icon.svg"), "https://example.test/packs/moved/assets/icons/icon.svg");
});

test("AssetManager does not depend on the Player location", () => {
  const firstLocation = new AssetManager(new URL("https://example.test/a/pack.json"));
  const movedLocation = new AssetManager(new URL("https://other.example.test/b/c/pack.json"));

  assert.equal(firstLocation.image("assets/images/scene.png"), "https://example.test/a/assets/images/scene.png");
  assert.equal(movedLocation.image("assets/images/scene.png"), "https://other.example.test/b/c/assets/images/scene.png");
});

test("AssetManager rejects invalid URL paths through URL parsing", () => {
  const assets = new AssetManager(new URL("https://example.test/pack.json"));
  assert.throws(() => assets.image("http://[invalid"), /Invalid URL/);
});
