import assert from "node:assert/strict";
import test from "node:test";
import { renderPlayer } from "../../../.test-build/packages/renderer/src/index.js";
import { FakeElement, findElement, findElements, withFakeDocument } from "../../helpers/fake-dom.mjs";

function createState(overrides = {}) {
  return {
    pack: {
      format: "ine-narrative-pack",
      version: "1.0",
      id: "renderer-pack",
      title: "Renderer Pack",
      language: "en",
      startScene: "scene-1",
      scenes: [],
    },
    scene: {
      id: "scene-1",
      title: "Scene <Title>",
      text: "Text with <strong>markup</strong> kept as text.",
      image: "https://example.test/image.png",
      imageAlt: "Accessible image.",
    },
    sceneIndex: 1,
    sceneCount: 4,
    controls: new FakeElement("nav"),
    messages: {
      engineTitle: "Engine Label",
      packLabel: "Pack Label",
      progressLabel: "Timeline Label",
      progressText: "Step 2 of 4",
    },
    ...overrides,
  };
}

test("Renderer creates public scene content from trusted state", () =>
  withFakeDocument(() => {
    const target = new FakeElement("main");
    renderPlayer(target, createState());

    assert.equal(findElement(target, ".player__brand").textContent, "Engine Label");
    assert.equal(findElement(target, ".player__pack-label").textContent, "Pack Label");
    assert.equal(findElement(target, ".player__pack-title").textContent, "Renderer Pack");
    assert.equal(findElement(target, ".scene__title").textContent, "Scene <Title>");
    assert.equal(findElement(target, ".scene__text").textContent, "Text with <strong>markup</strong> kept as text.");
  }));

test("Renderer renders images with alternative text and contain as default display mode", () =>
  withFakeDocument(() => {
    const target = new FakeElement("main");
    renderPlayer(target, createState());

    const image = findElement(target, "img");
    assert.equal(image.src, "https://example.test/image.png");
    assert.equal(image.alt, "Accessible image.");
    assert.equal(image.dataset.displayMode, "contain");
  }));

test("Renderer applies explicit image display modes", () =>
  withFakeDocument(() => {
    for (const mode of ["contain", "cover", "fill", "immersive"]) {
      const target = new FakeElement("main");
      renderPlayer(target, createState({ scene: { ...createState().scene, imageDisplayMode: mode } }));
      assert.equal(findElement(target, "img").dataset.displayMode, mode);
    }
  }));

test("Renderer displays accessible narrative progress without a fragile progress bar", () =>
  withFakeDocument(() => {
    const target = new FakeElement("main");
    renderPlayer(target, createState());

    const progress = findElement(target, ".progress");
    assert.equal(progress.getAttribute("aria-label"), "Timeline Label");
    assert.equal(findElement(target, ".progress__text").textContent, "Step 2 of 4");
    assert.equal(findElements(target, ".progress__step").length, 4);
    assert.equal(findElements(target, ".progress__step--active").length, 2);
  }));

test("Renderer uses caller-provided locale labels instead of hard-coded UI strings", () =>
  withFakeDocument(() => {
    const target = new FakeElement("main");
    renderPlayer(target, createState());
    const collectText = (element) => [element.textContent, ...element.children.flatMap(collectText)].join(" ");
    const renderedText = collectText(target);

    assert.ok(renderedText.includes("Engine Label"));
    assert.ok(renderedText.includes("Pack Label"));
    assert.ok(renderedText.includes("Step 2 of 4"));
    assert.equal(renderedText.includes("Previous"), false);
    assert.equal(renderedText.includes("Progress"), false);
  }));
