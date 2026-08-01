import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENE_TRANSITION,
  NarrativeEngine,
  detectPackFormat,
  getSceneTransition,
  getTransitionDirection,
  loadLivingCard,
  loadLivingCardPack,
  loadNarrativePack,
  loadPolarity,
  loadPolarityPack,
  normalizeSceneTransition,
} from "../../../.test-build/packages/core/src/index.js";
import { validateLivingCard, validateNarrativePack, validatePolarity } from "../../../.test-build/packages/validators/src/index.js";

function createPack() {
  return {
    format: "ine-narrative-pack",
    version: "1.0",
    id: "core-pack",
    title: "Core Pack",
    language: "fr",
    startScene: "middle",
    scenes: [
      { id: "start", title: "Start", text: "First." },
      { id: "middle", title: "Middle", text: "Second." },
      { id: "end", title: "End", text: "Third." },
    ],
  };
}

test("loadNarrativePack loads a valid manifest and resolves scene assets", async () => {
  const pack = {
    ...createPack(),
    startScene: "start",
    scenes: [{ id: "start", title: "Start", text: "First.", image: "assets/images/start.png" }],
  };
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => pack,
  });

  try {
    const loaded = await loadNarrativePack(
      new URL("https://example.test/packs/demo/pack.json"),
      validateNarrativePack,
    );
    assert.equal(loaded.title, "Core Pack");
    assert.equal(loaded.language, "fr");
    assert.equal(loaded.startScene, "start");
    assert.equal(loaded.scenes.length, 1);
    assert.equal(loaded.scenes[0].image, "https://example.test/packs/demo/assets/images/start.png");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("loadNarrativePack rejects failed requests with a stable error code", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404 });

  try {
    await assert.rejects(
      () => loadNarrativePack(new URL("https://example.test/missing.json"), validateNarrativePack),
      /INE_PACK_REQUEST_FAILED/,
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("loadNarrativePack rejects invalid manifests with a stable error code", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ invalid: true }),
  });

  try {
    await assert.rejects(
      () => loadNarrativePack(new URL("https://example.test/invalid.json"), validateNarrativePack),
      /INE_PACK_INVALID/,
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("polarity pack loader validates its manifest and resolves independent content assets", async () => {
  const responses = [
    { format: "ine-polarity-pack" },
    {
      format: "ine-polarity-pack",
      id: "pack-002",
      title: "Polarités Vivantes",
      subtitle: "Des tensions fécondes à habiter",
      description: "Un parcours contemplatif.",
      type: "contemplatif",
      version: "1.0.0",
      author: "Zéphyr Avenel",
      language: "fr",
      estimatedDuration: 12,
      entry: "01-affirmation-don",
      entryAction: "Entrer",
      articleUrl: "https://example.test/article",
      coverImage: "assets/00.webp",
      coverImageAlt: "Couverture",
      closingImage: "assets/11.webp",
      closingImageAlt: "Clôture",
      closingAction: "Achever",
      closingBackAction: "Revenir",
      polarities: [{ id: "01-affirmation-don", source: "polarities/01-affirmation-don.json" }],
      fallbackImage: "assets/fallback.svg",
      fallbackImageAlt: "Fallback",
      landmarkLabel: "Deux pôles",
    },
    {
      id: "01-affirmation-don",
      title: "Titre",
      subtitle: "Sous-titre",
      image: "assets/image.svg",
      imageAlt: "Image",
      left: { title: "Gauche", icon: "leaf", text: "Texte" },
      right: { title: "Droite", icon: "hands", text: "Texte" },
      quote: "Citation",
      question: "Question ?",
      article: "https://example.test",
      previous: null,
      next: null,
      actions: { article: "Article", previous: "Précédente", next: "Suivante", back: "Retour" },
    },
  ];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => responses.shift() });
  try {
    const source = new URL("https://example.test/packs/pack-002/pack.json");
    assert.equal(await detectPackFormat(source), "ine-polarity-pack");
    const pack = await loadPolarityPack(source);
    assert.equal(pack.polarities[0].source, "https://example.test/packs/pack-002/polarities/01-affirmation-don.json");
    assert.equal(pack.fallbackImage, "https://example.test/packs/pack-002/assets/fallback.svg");
    assert.equal(pack.coverImage, "https://example.test/packs/pack-002/assets/00.webp");
    assert.equal(pack.closingImage, "https://example.test/packs/pack-002/assets/11.webp");
    assert.equal(pack.articleUrl, "https://example.test/article");
    const polarity = await loadPolarity(new URL(pack.polarities[0].source), validatePolarity);
    assert.equal(polarity.image, "https://example.test/packs/pack-002/polarities/assets/image.svg");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("polarity pack loader requires the canonical manifest article URL", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      format: "ine-polarity-pack",
      id: "pack-without-article",
      title: "Pack",
      subtitle: "Sous-titre",
      description: "Description",
      type: "contemplatif",
      version: "1.0.0",
      author: "Auteur",
      language: "fr",
      estimatedDuration: 1,
      entry: "entry",
      entryAction: "Entrer",
      coverImage: "cover.webp",
      coverImageAlt: "Couverture",
      closingImage: "closing.webp",
      closingImageAlt: "Clôture",
      closingAction: "Achever",
      closingBackAction: "Revenir",
      polarities: [{ id: "entry", source: "entry.json" }],
      fallbackImage: "fallback.webp",
      fallbackImageAlt: "Fallback",
      landmarkLabel: "Parcours",
    }),
  });
  try {
    await assert.rejects(
      () => loadPolarityPack(new URL("https://example.test/pack.json")),
      /INE_POLARITY_PACK_INVALID/,
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("living card pack loader validates its manifest and resolves independent cards", async () => {
  const responses = [
    { format: "ine-living-card-pack" },
    {
      format: "ine-living-card-pack",
      id: "pack-003",
      title: "Atlas",
      subtitle: "Cartes symboliques.",
      description: "Un atlas.",
      type: "symbolique",
      version: "1.0.0",
      author: "Auteur",
      language: "fr",
      estimatedDuration: 8,
      entry: "premier-pas",
      entryAction: "Ouvrir",
      coverImage: "assets/cover.svg",
      coverImageAlt: "Couverture",
      fallbackImage: "assets/fallback.svg",
      fallbackImageAlt: "Fallback",
      landmarkLabel: "Carte vivante",
      actions: { continue: "Continuer", previous: "Précédente", back: "Retour", finish: "Finir" },
      cards: [{ id: "premier-pas", source: "cards/premier-pas.json" }],
    },
    {
      id: "premier-pas",
      type: "living-card",
      title: "Carte",
      subtitle: "Sous-titre",
      image: "../assets/card.svg",
      imageAlt: "Image",
      symbol: "graine",
      quote: "Citation",
      motto: "Devise",
      metadata: [{ label: "Famille", value: "Atlas" }],
      previous: null,
      next: null,
      locale: { fr: {}, en: { title: "Card" } },
    },
  ];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => responses.shift() });
  try {
    const source = new URL("https://example.test/packs/pack-003/pack.json");
    assert.equal(await detectPackFormat(source), "ine-living-card-pack");
    const pack = await loadLivingCardPack(source);
    assert.equal(pack.cards[0].source, "https://example.test/packs/pack-003/cards/premier-pas.json");
    assert.equal(pack.coverImage, "https://example.test/packs/pack-003/assets/cover.svg");
    assert.equal(pack.fallbackImage, "https://example.test/packs/pack-003/assets/fallback.svg");
    const card = await loadLivingCard(new URL(pack.cards[0].source), validateLivingCard);
    assert.equal(card.image, "https://example.test/packs/pack-003/assets/card.svg");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("NarrativeEngine selects the start scene and navigates deterministically", () => {
  const engine = new NarrativeEngine(createPack());

  assert.equal(engine.currentScene.id, "middle");
  assert.equal(engine.currentSceneIndex, 1);
  assert.equal(engine.sceneCount, 3);
  assert.equal(engine.progress, 2 / 3);
  assert.equal(engine.canGoPrevious, true);
  assert.equal(engine.canGoNext, true);

  engine.next();
  engine.next();
  assert.equal(engine.currentScene.id, "end");
  assert.equal(engine.currentSceneIndex, 2);
  assert.equal(engine.progress, 1);
  assert.equal(engine.canGoNext, false);

  engine.previous();
  engine.previous();
  engine.previous();
  assert.equal(engine.currentScene.id, "start");
  assert.equal(engine.currentSceneIndex, 0);
  assert.equal(engine.progress, 1 / 3);
  assert.equal(engine.canGoPrevious, false);
});

test("NarrativeEngine can resume from a stable scene id", () => {
  const engine = new NarrativeEngine(createPack());

  assert.equal(engine.findSceneIndex("end"), 2);
  assert.equal(engine.goToScene("end"), true);
  assert.equal(engine.currentScene.id, "end");
  assert.equal(engine.currentSceneIndex, 2);
  assert.equal(engine.goToScene("missing"), false);
  assert.equal(engine.currentScene.id, "end");
});

test("NarrativeEngine rejects a missing start scene", () => {
  assert.throws(
    () => new NarrativeEngine({ ...createPack(), startScene: "missing" }),
    /INE_START_SCENE_MISSING/,
  );
});

test("NarrativeEngine reports an incoherent navigation state", () => {
  const pack = createPack();
  const engine = new NarrativeEngine(pack);
  pack.scenes.length = 0;
  assert.throws(() => engine.currentScene, /INE_SCENE_STATE_INVALID/);
});

test("transition normalization keeps absent transitions immediate and deterministic", () => {
  assert.deepEqual(normalizeSceneTransition(), DEFAULT_SCENE_TRANSITION);
  assert.deepEqual(normalizeSceneTransition({ type: "none", durationMs: 3000, easing: "linear" }), {
    type: "none",
    durationMs: 0,
    easing: "linear",
  });
});

test("transition normalization supports all public transition types and default easing", () => {
  for (const type of ["fade", "crossfade", "slide"]) {
    assert.deepEqual(normalizeSceneTransition({ type }), {
      type,
      durationMs: 450,
      easing: "ease-in-out",
    });
  }
  assert.deepEqual(normalizeSceneTransition({ type: "fade", durationMs: 0, easing: "linear" }), {
    type: "fade",
    durationMs: 0,
    easing: "linear",
  });
  assert.deepEqual(normalizeSceneTransition({ type: "slide", durationMs: 3000, easing: "ease-out" }), {
    type: "slide",
    durationMs: 3000,
    easing: "ease-out",
  });
});

test("scene transitions override the pack default transition", () => {
  const pack = {
    ...createPack(),
    presentation: {
      defaultTransition: { type: "fade", durationMs: 450, easing: "ease-in-out" },
    },
    scenes: [
      { id: "start", title: "Start", text: "First." },
      {
        id: "middle",
        title: "Middle",
        text: "Second.",
        transition: { type: "crossfade", durationMs: 700, easing: "ease" },
      },
    ],
  };

  assert.deepEqual(getSceneTransition(pack, pack.scenes[0]), {
    type: "fade",
    durationMs: 450,
    easing: "ease-in-out",
  });
  assert.deepEqual(getSceneTransition(pack, pack.scenes[1]), {
    type: "crossfade",
    durationMs: 700,
    easing: "ease",
  });
});

test("NarrativeEngine exposes the transition used when entering a scene", () => {
  const pack = {
    ...createPack(),
    scenes: [
      { id: "start", title: "Start", text: "First." },
      { id: "middle", title: "Middle", text: "Second.", transition: { type: "slide", easing: "ease-in" } },
    ],
  };
  const engine = new NarrativeEngine(pack);

  assert.deepEqual(engine.transitionForSceneIndex(1), {
    type: "slide",
    durationMs: 450,
    easing: "ease-in",
  });
});

test("slide transition direction is derived from navigation indexes", () => {
  assert.equal(getTransitionDirection(0, 1), "forward");
  assert.equal(getTransitionDirection(2, 1), "backward");
  assert.equal(getTransitionDirection(1, 1), "none");
});
