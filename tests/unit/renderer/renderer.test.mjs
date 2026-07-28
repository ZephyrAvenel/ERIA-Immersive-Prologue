import assert from "node:assert/strict";
import test from "node:test";
import { renderPlayer, renderPlayerWithTransition } from "../../../.test-build/packages/renderer/src/index.js";
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

function createTransition(type, overrides = {}) {
  return {
    type,
    durationMs: type === "none" ? 0 : 450,
    easing: "ease-in-out",
    ...overrides,
  };
}

function installControlledAnimations() {
  const animations = [];
  const previousAnimate = FakeElement.prototype.animate;
  FakeElement.prototype.animate = function animate(keyframes, options) {
    let resolve;
    let reject;
    const finished = new Promise((resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    });
    animations.push({ element: this, keyframes, options, resolve, reject });
    return { finished };
  };
  return {
    animations,
    restore() {
      if (previousAnimate) FakeElement.prototype.animate = previousAnimate;
      else delete FakeElement.prototype.animate;
    },
  };
}

async function waitForAnimationCount(controlled, count) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (controlled.animations.length >= count) return;
    await Promise.resolve();
  }
  assert.fail(`Expected ${count} animations, received ${controlled.animations.length}`);
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

test("Renderer renders immediately when transition type is none", async () =>
  withFakeDocument(async () => {
    const target = new FakeElement("main");
    renderPlayer(target, createState({ scene: { ...createState().scene, title: "Old" } }));

    await renderPlayerWithTransition(target, createState({ scene: { ...createState().scene, title: "New" } }), {
      transition: createTransition("none"),
      direction: "forward",
      reduceMotion: false,
    });

    assert.equal(findElement(target, ".scene__title").textContent, "New");
    assert.equal(target.getAttribute("data-transition"), null);
  }));

test("Renderer bypasses animated transitions when reduced motion is requested", async () =>
  withFakeDocument(async () => {
    const target = new FakeElement("main");
    const controlled = installControlledAnimations();
    try {
      renderPlayer(target, createState({ scene: { ...createState().scene, title: "Old" } }));
      await renderPlayerWithTransition(target, createState({ scene: { ...createState().scene, title: "Reduced" } }), {
        transition: createTransition("slide"),
        direction: "forward",
        reduceMotion: true,
      });

      assert.equal(findElement(target, ".scene__title").textContent, "Reduced");
      assert.equal(controlled.animations.length, 0);
    } finally {
      controlled.restore();
    }
  }));

test("Renderer applies fade transition and cleans transient state", async () =>
  withFakeDocument(async () => {
    const target = new FakeElement("main");
    const controlled = installControlledAnimations();
    try {
      renderPlayer(target, createState({ scene: { ...createState().scene, title: "Old" } }));
      const promise = renderPlayerWithTransition(
        target,
        createState({ scene: { ...createState().scene, title: "New" } }),
        {
          transition: createTransition("fade"),
          direction: "forward",
          reduceMotion: false,
        },
      );

      assert.equal(target.getAttribute("data-transition"), "fade");
      assert.equal(controlled.animations[0].options.duration, 450);
      assert.equal(controlled.animations[0].options.easing, "ease-in-out");
      controlled.animations[0].resolve();
      await waitForAnimationCount(controlled, 2);
      controlled.animations[1].resolve();
      await promise;

      assert.equal(findElement(target, ".scene__title").textContent, "New");
      assert.equal(target.getAttribute("data-transition"), null);
      assert.equal(target.classList.contains("player-transition-stage"), false);
    } finally {
      controlled.restore();
    }
  }));

test("Renderer removes old content after crossfade", async () =>
  withFakeDocument(async () => {
    const target = new FakeElement("main");
    const controlled = installControlledAnimations();
    try {
      renderPlayer(target, createState({ scene: { ...createState().scene, title: "Old" } }));
      const promise = renderPlayerWithTransition(
        target,
        createState({ scene: { ...createState().scene, title: "Crossfade" } }),
        {
          transition: createTransition("crossfade"),
          direction: "forward",
          reduceMotion: false,
        },
      );

      assert.equal(findElements(target, ".player").length, 2);
      assert.equal(
        findElements(target, ".player").filter((element) => element.getAttribute("aria-hidden") === "true").length,
        1,
      );
      controlled.animations.forEach((animation) => animation.resolve());
      await promise;

      assert.equal(findElements(target, ".player").length, 1);
      assert.equal(findElement(target, ".scene__title").textContent, "Crossfade");
      assert.equal(
        findElements(target, ".player").filter((element) => element.getAttribute("aria-hidden") === "true").length,
        0,
      );
    } finally {
      controlled.restore();
    }
  }));

test("Renderer applies deterministic slide directions", async () =>
  withFakeDocument(async () => {
    const target = new FakeElement("main");
    const controlled = installControlledAnimations();
    try {
      renderPlayer(target, createState({ scene: { ...createState().scene, title: "Old" } }));
      const promise = renderPlayerWithTransition(
        target,
        createState({ scene: { ...createState().scene, title: "Slide" } }),
        {
          transition: createTransition("slide"),
          direction: "backward",
          reduceMotion: false,
        },
      );

      assert.equal(controlled.animations[0].keyframes[1].transform, "translateX(4rem)");
      assert.equal(controlled.animations[1].keyframes[0].transform, "translateX(-4rem)");
      controlled.animations.forEach((animation) => animation.resolve());
      await promise;
      assert.equal(findElement(target, ".scene__title").textContent, "Slide");
    } finally {
      controlled.restore();
    }
  }));

test("Renderer falls back to immediate rendering when animation fails", async () =>
  withFakeDocument(async () => {
    const target = new FakeElement("main");
    const previousAnimate = FakeElement.prototype.animate;
    FakeElement.prototype.animate = () => {
      throw new Error("animation failed");
    };
    try {
      renderPlayer(target, createState({ scene: { ...createState().scene, title: "Old" } }));
      await renderPlayerWithTransition(target, createState({ scene: { ...createState().scene, title: "Fallback" } }), {
        transition: createTransition("fade"),
        direction: "forward",
        reduceMotion: false,
      });

      assert.equal(findElement(target, ".scene__title").textContent, "Fallback");
      assert.equal(target.getAttribute("data-transition"), null);
    } finally {
      if (previousAnimate) FakeElement.prototype.animate = previousAnimate;
      else delete FakeElement.prototype.animate;
    }
  }));
