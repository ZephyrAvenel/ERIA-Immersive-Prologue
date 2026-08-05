import assert from "node:assert/strict";
import test from "node:test";
import {
  renderPlayer,
  renderPlayerWithTransition,
  renderLivingCard,
  renderPolarity,
  renderPolarityClosure,
} from "../../../.test-build/packages/renderer/src/index.js";
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

function createPolarity() {
  return {
    id: "affirmation-don",
    title: "Entre affirmation et don",
    subtitle: "Une tension vivante.",
    image: "https://example.test/polarity.svg",
    imageAlt: "Deux mouvements reliés.",
    left: { title: "Affirmation", icon: "leaf", text: "Poser des limites." },
    right: { title: "Don", icon: "hands", text: "Accueillir l'autre." },
    quote: "Une relation vivante.",
    question: "Où est-elle présente ?",
    article: "https://example.test/article",
    previous: null,
    next: "memoire-avenir",
    actions: { article: "Explorer", previous: "Précédente", next: "Suivante", back: "Retour" },
  };
}

function createLivingCard() {
  return {
    id: "premier-pas",
    type: "living-card",
    title: "Carte du Premier Pas",
    subtitle: "Oser entrer dans le récit.",
    image: "https://example.test/card.svg",
    imageAlt: "Une graine lumineuse.",
    symbol: "graine",
    quote: "Tout récit vivant commence.",
    motto: "ÉCOUTER • RELIER • HABITER • TRANSMETTRE",
    metadata: [{ label: "Famille", value: "Atlas" }],
    previous: null,
    next: "equilibre-vivant",
    locale: { fr: {}, en: { title: "Card of the First Step" } },
  };
}

test("PolarityRenderer renders authored JSON content and accessible navigation", () =>
  withFakeDocument(() => {
    const target = new FakeElement("main");
    renderPolarity(target, {
      polarity: createPolarity(),
      fallbackImage: "https://example.test/fallback.svg",
      fallbackImageAlt: "Image de remplacement",
      landmarkLabel: "Deux pôles reliés",
      onNext() {},
      onBack() {},
    });

    assert.equal(findElement(target, ".polarity__title").textContent, "Entre affirmation et don");
    assert.equal(findElements(target, ".polarity__pole").length, 2);
    assert.equal(findElement(target, "blockquote").textContent, "Une relation vivante.");
    assert.equal(findElement(target, ".polarity__question").textContent, "Où est-elle présente ?");
    assert.equal(findElement(target, ".polarity__bridge").getAttribute("aria-label"), "Deux pôles reliés");
    assert.equal(findElement(target, "img").alt, "Deux mouvements reliés.");
    assert.equal(findElements(target, "button").length, 2);
    assert.equal(target.firstElementChild.focused, true);
  }));

test("PolarityRenderer replaces a failed illustration with the pack fallback", () =>
  withFakeDocument(() => {
    const target = new FakeElement("main");
    renderPolarity(target, {
      polarity: createPolarity(),
      fallbackImage: "https://example.test/fallback.svg",
      fallbackImageAlt: "Image contemplative de remplacement",
      landmarkLabel: "Deux pôles reliés",
      onBack() {},
    });
    const image = findElement(target, "img");
    image.dispatchEvent({ type: "error" });
    assert.equal(image.src, "https://example.test/fallback.svg");
    assert.equal(image.alt, "Image contemplative de remplacement");
    assert.equal(findElement(target, ".polarity__media").dataset.fallback, "true");
  }));

test("Renderer displays the authored PACK-002 closing illustration", () =>
  withFakeDocument(() => {
    const target = new FakeElement("main");
    renderPolarityClosure(target, {
      image: "https://example.test/11-cloture.webp",
      imageAlt: "Le récit continue avec toi.",
      backLabel: "Revenir au parcours",
      continueLabel: "Poursuivre votre exploration",
      continueHref: "https://example.test/bibliotheque/",
      onBack() {},
    });
    assert.equal(findElement(target, "img").src, "https://example.test/11-cloture.webp");
    assert.equal(findElement(target, "img").alt, "Le récit continue avec toi.");
    assert.equal(findElement(target, "button").textContent, "Revenir au parcours");
    assert.equal(findElement(target, "a").textContent, "Poursuivre votre exploration");
    assert.equal(findElement(target, "a").href, "https://example.test/bibliotheque/");
    assert.equal(target.firstElementChild.focused, true);
  }));

test("LivingCardRenderer renders authored JSON content and accessible navigation", () =>
  withFakeDocument(() => {
    const target = new FakeElement("main");
    renderLivingCard(target, {
      card: createLivingCard(),
      fallbackImage: "https://example.test/fallback.svg",
      fallbackImageAlt: "Image de remplacement",
      landmarkLabel: "Carte vivante",
      continueLabel: "Continuer",
      previousLabel: "Précédente",
      backLabel: "Retour",
      finishLabel: "Terminer",
      onContinue() {},
      onBack() {},
    });

    assert.equal(findElement(target, ".living-card__title").textContent, "Carte du Premier Pas");
    assert.equal(findElement(target, ".living-card__symbol").textContent, "graine");
    assert.equal(findElement(target, ".living-card__quote").textContent, "Tout récit vivant commence.");
    assert.equal(findElement(target, ".living-card__motto").textContent, "ÉCOUTER • RELIER • HABITER • TRANSMETTRE");
    assert.equal(findElement(target, ".living-card__content").getAttribute("aria-label"), "Carte vivante");
    assert.equal(findElement(target, "img").alt, "Une graine lumineuse.");
    assert.equal(findElements(target, "button").length, 2);
    assert.equal(target.firstElementChild.focused, true);
  }));

test("LivingCardRenderer replaces a failed illustration with the pack fallback", () =>
  withFakeDocument(() => {
    const target = new FakeElement("main");
    renderLivingCard(target, {
      card: createLivingCard(),
      fallbackImage: "https://example.test/fallback.svg",
      fallbackImageAlt: "Image symbolique de remplacement",
      landmarkLabel: "Carte vivante",
      continueLabel: "Continuer",
      previousLabel: "Précédente",
      backLabel: "Retour",
      finishLabel: "Terminer",
      onBack() {},
    });
    const image = findElement(target, "img");
    image.dispatchEvent({ type: "error" });
    assert.equal(image.src, "https://example.test/fallback.svg");
    assert.equal(image.alt, "Image symbolique de remplacement");
    assert.equal(findElement(target, ".living-card__media").dataset.fallback, "true");
  }));

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
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (controlled.animations.length >= count) return;
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  assert.fail(`Expected ${count} animations, received ${controlled.animations.length}`);
}

test("Renderer creates public scene content from trusted state", () =>
  withFakeDocument(() => {
    const target = new FakeElement("main");
    renderPlayer(target, createState());

    const player = findElement(target, ".player");
    const header = findElement(target, "header");
    assert.equal(player.dataset.engineTitle, "Engine Label");
    assert.equal(player.dataset.packId, "renderer-pack");
    assert.equal(header.getAttribute("aria-label"), "Pack Label");
    assert.equal(findElement(target, ".player__work-title").textContent, "Renderer Pack");
    assert.equal(findElement(target, ".scene__title").textContent, "Scene <Title>");
    assert.equal(findElement(target, ".scene__text").textContent, "Text with <strong>markup</strong> kept as text.");
  }));

test("Renderer exposes optional image-then-text layout state as data attributes", () =>
  withFakeDocument(() => {
    const target = new FakeElement("main");
    renderPlayer(target, createState({ layout: "image-then-text", layoutPhase: "image" }));

    const player = findElement(target, ".player");
    const scene = findElement(target, ".scene");
    assert.equal(player.dataset.layout, "image-then-text");
    assert.equal(player.dataset.layoutPhase, "image");
    assert.equal(scene.dataset.layoutPhase, "image");
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

    assert.equal(renderedText.includes("Engine Label"), false);
    assert.equal(renderedText.includes("Pack Label"), false);
    assert.ok(renderedText.includes("Renderer Pack"));
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

      await waitForAnimationCount(controlled, 1);
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

      await waitForAnimationCount(controlled, 2);
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

      await waitForAnimationCount(controlled, 2);
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

test("Renderer marks failed images and keeps narrative content available", async () =>
  withFakeDocument(async () => {
    const previousDefaults = FakeElement.imageDefaults;
    FakeElement.imageDefaults = {
      complete: true,
      naturalWidth: 0,
      naturalHeight: 0,
      decode: async () => {
        throw new Error("decode failed");
      },
    };
    const target = new FakeElement("main");
    const controlled = installControlledAnimations();
    try {
      renderPlayer(target, createState({ scene: { ...createState().scene, title: "Old" } }));
      const promise = renderPlayerWithTransition(target, createState({ scene: { ...createState().scene, title: "Broken image" } }), {
        transition: createTransition("fade"),
        direction: "forward",
        reduceMotion: false,
      });
      await waitForAnimationCount(controlled, 1);
      controlled.animations[0].resolve();
      await waitForAnimationCount(controlled, 2);
      controlled.animations[1].resolve();
      await promise;

      assert.equal(findElement(target, ".scene__title").textContent, "Broken image");
      assert.equal(findElement(target, ".scene__text").textContent, "Text with <strong>markup</strong> kept as text.");
      assert.equal(findElement(target, "img").dataset.imageState, "error");
      assert.equal(findElement(target, ".scene__media").dataset.imageState, "error");
      assert.equal(target.getAttribute("data-transition"), null);
    } finally {
      controlled.restore();
      FakeElement.imageDefaults = previousDefaults;
    }
  }));
