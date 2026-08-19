import assert from "node:assert/strict";
import test from "node:test";
import {
  loadWorkshopPack,
  WorkshopEngine,
} from "../../../.test-build/packages/core/src/index.js";
import {
  WorkshopProgressStore,
  createWorkshopProgress,
} from "../../../.test-build/apps/player/src/workshop-progress.js";
import { validateWorkshopPack } from "../../../.test-build/packages/validators/src/index.js";
import { readJsonFixture, readProjectJson } from "../../helpers/fixtures.mjs";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

test("technical workshop fixture is valid, declarative, and navigable", async () => {
  const fixture = await readJsonFixture("workshop/valid", "minimal.json");
  const result = validateWorkshopPack(fixture);
  assert.deepEqual(result, { valid: true, errors: [] });
  assert.equal(fixture.format, "ine-workshop-pack");
  assert.equal(fixture.movements.length, 2);
  assert.equal(fixture.pages.length, 2);
  assert.equal(fixture.pages.some((page) => page.blocks.some((block) => block.type === "promptCopy")), true);
  assert.equal(JSON.stringify(fixture).includes("apiKey"), false);
  assert.equal(JSON.stringify(fixture).includes("endpoint"), false);
  assert.equal(JSON.stringify(fixture).includes("chatbot"), false);

  const engine = new WorkshopEngine(fixture);
  assert.equal(engine.currentPage.id, "page-01");
  engine.next();
  assert.equal(engine.currentPage.id, "page-02");
});

test("workshop schema remains independent from the narrative pack schema", async () => {
  const workshopSchema = await readProjectJson("schemas", "workshop-pack.schema.json");
  const narrativeSchema = await readProjectJson("schemas", "narrative-pack.schema.json");
  assert.equal(workshopSchema.properties.format.const, "ine-workshop-pack");
  assert.equal(narrativeSchema.properties.format.const, "ine-narrative-pack");
  assert.equal(workshopSchema.properties.pages.items.$ref, "#/$defs/page");
  assert.equal(narrativeSchema.properties.scenes.items.$ref, "#/$defs/scene");
});

test("workshop loader keeps the pack local and declarative", async () => {
  const fixture = await readJsonFixture("workshop/valid", "minimal.json");
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => fixture });

  try {
    const loaded = await loadWorkshopPack(
      new URL("https://example.test/ateliers/ecriture-augmentee/pack.json"),
      validateWorkshopPack,
    );
    assert.equal(loaded.id, "ecriture-augmentee");
    assert.equal(loaded.pages[1].blocks.find((block) => block.type === "promptCopy").text.includes("Ne choisis pas à ma place."), true);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("technical workshop demo covers the minimal runtime traversal", async () => {
  const demo = await readProjectJson("examples", "workshop-demo", "pack.json");
  const result = validateWorkshopPack(demo);
  assert.deepEqual(result, { valid: true, errors: [] });
  assert.equal(demo.id, "workshop-demo");
  assert.equal(demo.movements.length, 2);
  assert.equal(demo.pages.length, 4);
  assert.equal(demo.startPage, "page-01");
  assert.equal(demo.pages[2].movementId, "explorer");
  assert.deepEqual(
    demo.pages.flatMap((page) => page.blocks.map((block) => block.type)),
    ["text", "text", "textarea", "text", "choice", "promptCopy", "text", "recall", "reveal"],
  );
  assert.equal(demo.pages[1].blocks[1].id, "technical-note");
  assert.equal(demo.pages[2].blocks[1].options.length, 3);
  assert.equal(demo.pages[2].blocks[2].type, "promptCopy");
  assert.equal(demo.pages[3].blocks[1].sourceBlockId, "technical-note");

  const engine = new WorkshopEngine(demo);
  assert.equal(engine.currentPage.id, "page-01");
  assert.equal(engine.currentPageIndex, 0);
  engine.next();
  assert.equal(engine.currentPage.id, "page-02");
  engine.next();
  assert.equal(engine.currentPage.id, "page-03");
  assert.equal(engine.currentPage.movementId, "explorer");
  engine.next();
  assert.equal(engine.currentPage.id, "page-04");
  assert.equal(engine.canGoNext, false);
  engine.next();
  assert.equal(engine.currentPage.id, "page-04");
  engine.previous();
  assert.equal(engine.currentPage.id, "page-03");
});

test("workshop progress restores local responses into a new traversal instance", async () => {
  const demo = await readProjectJson("examples", "workshop-demo", "pack.json");
  const storage = new MemoryStorage();
  const store = new WorkshopProgressStore(storage);
  const firstEngine = new WorkshopEngine(demo);
  const responses = new Map();

  firstEngine.next();
  responses.set("technical-note", "Une trace restaurée");
  firstEngine.next();
  responses.set("technical-choice", "reveler");
  firstEngine.next();
  responses.set("technical-reveal", true);
  store.save(createWorkshopProgress({
    workshopId: demo.id,
    workshopVersion: demo.version,
    pageId: firstEngine.currentPage.id,
    completed: !firstEngine.canGoNext,
    responses,
  }));

  const restored = store.load(demo.id, demo.version, demo.pages);
  const secondEngine = new WorkshopEngine(demo);
  const restoredResponses = new Map(Object.entries(restored.responses));
  secondEngine.goToPage(restored.pageId);

  assert.equal(secondEngine.currentPage.id, "page-04");
  assert.equal(restored.completed, true);
  assert.equal(restoredResponses.get("technical-note"), "Une trace restaurée");
  assert.equal(restoredResponses.get("technical-choice"), "reveler");
  assert.equal(restoredResponses.get("technical-reveal"), true);
  assert.equal(
    restoredResponses.get(demo.pages[3].blocks.find((block) => block.type === "recall").sourceBlockId),
    "Une trace restaurée",
  );

  store.clear(demo.id);
  assert.equal(store.load(demo.id, demo.version, demo.pages), null);
});

test("augmented writing workshop structural draft is valid and unpublished", async () => {
  const pack = await readProjectJson("packs", "workshop-001-ecriture-augmentee", "pack.json");
  const result = validateWorkshopPack(pack);
  assert.deepEqual(result, { valid: true, errors: [] });
  assert.equal(pack.format, "ine-workshop-pack");
  assert.equal(pack.id, "ecriture-augmentee");
  assert.equal(pack.slug, "ecriture-augmentee");
  assert.equal(pack.version, "1.0");
  assert.equal(pack.language, "fr");
  assert.equal(pack.startPage, "page-01");
  assert.equal(pack.movements.length, 7);
  assert.equal(pack.pages.length, 26);

  assert.deepEqual(
    pack.movements.map((movement) => [movement.id, movement.order, movement.title]),
    [
      ["intention", 1, "INTENTION"],
      ["divergence", 2, "DIVERGENCE"],
      ["exploration", 3, "EXPLORATION"],
      ["discernement", 4, "DISCERNEMENT"],
      ["ecriture", 5, "ÉCRITURE"],
      ["transformation", 6, "TRANSFORMATION"],
      ["creation", 7, "CRÉATION"],
    ],
  );

  assert.deepEqual(
    pack.pages.map((page) => [page.id, page.order, page.movementId, page.title]),
    [
      ["page-01", 1, "intention", "Le seuil de l'écriture"],
      ["page-02", 2, "intention", "Ce qui cherche à être écrit"],
      ["page-03", 3, "intention", "Votre étincelle"],
      ["page-04", 4, "intention", "Ne pas demander trop tôt"],
      ["page-05", 5, "divergence", "Ouvrir les possibles"],
      ["page-06", 6, "divergence", "Une idée, plusieurs directions"],
      ["page-07", 7, "divergence", "Faire varier"],
      ["page-08", 8, "divergence", "Diverger sans se perdre"],
      ["page-09", 9, "exploration", "Entrer dans une possibilité"],
      ["page-10", 10, "exploration", "Déplacer le regard"],
      ["page-11", 11, "exploration", "Et si ?"],
      ["page-12", 12, "exploration", "Faire apparaître l'inattendu"],
      ["page-13", 13, "discernement", "Tout ce qui est possible n'est pas juste"],
      ["page-14", 14, "discernement", "Reconnaître ce qui résonne"],
      ["page-15", 15, "discernement", "Choisir et renoncer"],
      ["page-16", 16, "discernement", "Retrouver sa voix"],
      ["page-17", 17, "ecriture", "Reprendre la main"],
      ["page-18", 18, "ecriture", "Composer"],
      ["page-19", 19, "ecriture", "Écrire ensemble sans déléguer"],
      ["page-20", 20, "ecriture", "Laisser une place à l'auteur"],
      ["page-21", 21, "transformation", "Le texte n'est pas terminé"],
      ["page-22", 22, "transformation", "Transformer plutôt que corriger"],
      ["page-23", 23, "transformation", "Faire sien"],
      ["page-24", 24, "transformation", "Savoir s'arrêter"],
      ["page-25", 25, "creation", "Votre récit"],
      ["page-26", 26, "creation", "Continuer sans l'atelier"],
    ],
  );

  const pagesByMovement = Object.fromEntries(
    pack.movements.map((movement) => [
      movement.id,
      pack.pages.filter((page) => page.movementId === movement.id).map((page) => page.id),
    ]),
  );
  assert.deepEqual(pagesByMovement, {
    intention: ["page-01", "page-02", "page-03", "page-04"],
    divergence: ["page-05", "page-06", "page-07", "page-08"],
    exploration: ["page-09", "page-10", "page-11", "page-12"],
    discernement: ["page-13", "page-14", "page-15", "page-16"],
    ecriture: ["page-17", "page-18", "page-19", "page-20"],
    transformation: ["page-21", "page-22", "page-23", "page-24"],
    creation: ["page-25", "page-26"],
  });

  const pageOne = pack.pages[0];
  assert.equal(pageOne.id, "page-01");
  assert.equal(pageOne.title, "Le seuil de l'écriture");
  assert.equal(pageOne.movementId, "intention");
  assert.deepEqual(pageOne.blocks.map((block) => block.type), ["text", "text", "text", "reveal", "text"]);
  assert.equal(pageOne.blocks.filter((block) => block.type === "reveal").length, 1);
  assert.equal(
    pageOne.blocks.some((block) => ["textarea", "choice", "promptCopy", "recall"].includes(block.type)),
    false,
  );

  const pageTwo = pack.pages[1];
  assert.equal(pageTwo.id, "page-02");
  assert.equal(pageTwo.title, "Ce qui cherche \u00e0 \u00eatre \u00e9crit");
  assert.equal(pageTwo.movementId, "intention");
  assert.deepEqual(pageTwo.blocks.map((block) => block.type), ["text", "text", "choice", "text", "textarea", "text"]);
  const pageTwoChoices = pageTwo.blocks.filter((block) => block.type === "choice");
  assert.equal(pageTwoChoices.length, 1);
  assert.equal(pageTwoChoices[0].id, "forme-impulsion");
  assert.equal(pageTwoChoices[0].options.length, 7);
  assert.equal(
    pageTwoChoices[0].options.some((option) => option.label === "Quelque chose que je ne sais pas encore nommer"),
    true,
  );
  const pageTwoTextareas = pageTwo.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageTwoTextareas.length, 1);
  assert.equal(pageTwoTextareas[0].id, "impulsion-initiale");
  assert.equal(pageTwoTextareas[0].label, "Ce qui revient");
  assert.equal(
    pageTwoTextareas[0].placeholder,
    "Une image, quelques mots, une sensation, une situation, une question\u2026",
  );
  assert.equal(pageTwo.blocks.some((block) => ["reveal", "promptCopy", "recall"].includes(block.type)), false);

  const pageThree = pack.pages[2];
  assert.equal(pageThree.id, "page-03");
  assert.equal(pageThree.title, "Votre \u00e9tincelle");
  assert.equal(pageThree.movementId, "intention");
  assert.deepEqual(pageThree.blocks.map((block) => block.type), ["text", "recall", "text", "textarea", "text"]);
  const pageThreeRecalls = pageThree.blocks.filter((block) => block.type === "recall");
  assert.equal(pageThreeRecalls.length, 1);
  assert.equal(pageThreeRecalls[0].id, "rappel-impulsion-etincelle");
  assert.equal(pageThreeRecalls[0].sourceBlockId, "impulsion-initiale");
  assert.equal(pageThreeRecalls[0].label, "Votre premi\u00e8re trace");
  assert.equal(
    pageThreeRecalls[0].emptyText,
    "Vous n'avez encore rien not\u00e9 ici. Vous pouvez revenir \u00e0 la page pr\u00e9c\u00e9dente, ou poursuivre avec ce qui vous vient maintenant.",
  );
  const pageThreeTextareas = pageThree.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageThreeTextareas.length, 1);
  assert.equal(pageThreeTextareas[0].id, "etincelle");
  assert.equal(pageThreeTextareas[0].label, "Votre \u00e9tincelle");
  assert.equal(pageThreeTextareas[0].placeholder, "Quelques mots suffisent. Ce qui vous donne envie de continuer\u2026");
  assert.equal(pageThree.blocks.some((block) => ["choice", "reveal", "promptCopy"].includes(block.type)), false);

  const blockIds = pack.pages.flatMap((page) => page.blocks.map((block) => block.id));
  assert.equal(new Set(blockIds).size, blockIds.length);
  for (const traceId of [
    "impulsion-initiale",
    "etincelle",
    "directions-brutes",
    "variation-retenue",
    "boussole",
    "piste-provisoire",
    "hypothese-forte",
    "choix-assume",
    "voix-recherchee",
    "premiere-forme",
    "version-a-moi",
    "critere-arret",
  ]) {
    assert.equal(blockIds.includes(traceId), true, `${traceId} should exist as a structural trace`);
  }

  const supportedTypes = new Set(["text", "textarea", "choice", "reveal", "promptCopy", "recall"]);
  assert.equal(pack.pages.every((page) => page.blocks.every((block) => supportedTypes.has(block.type))), true);

  const recallSources = pack.pages
    .flatMap((page) => page.blocks)
    .filter((block) => block.type === "recall")
    .map((block) => block.sourceBlockId);
  assert.equal(recallSources.every((sourceBlockId) => blockIds.includes(sourceBlockId)), true);
  assert.equal(recallSources.includes("etincelle"), true);
  assert.equal(recallSources.includes("boussole"), true);
  assert.equal(recallSources.includes("voix-recherchee"), true);
  assert.equal(recallSources.includes("premiere-forme"), true);
  assert.equal(recallSources.includes("version-a-moi"), true);

  assert.deepEqual(
    pack.pages
      .filter((page) => page.blocks.some((block) => block.type === "promptCopy"))
      .map((page) => page.id),
    ["page-05", "page-06", "page-07", "page-10", "page-11", "page-12", "page-19", "page-22"],
  );

  const serialized = JSON.stringify(pack).toLowerCase();
  for (const forbidden of ["apikey", "api_key", "endpoint", "streaming", "openaikey"]) {
    assert.equal(serialized.includes(forbidden), false, `pack should not contain ${forbidden}`);
  }
  assert.equal(pack.pages.some((page) => page.blocks.some((block) => block.type === "chatbot")), false);

  const registry = await readProjectJson("apps", "player", "src", "editorial-registry.json");
  const writingWorkshop = registry.workshops.find((workshop) => workshop.id === "ecriture-augmentee");
  assert.equal(writingWorkshop.status, "planned");

  const engine = new WorkshopEngine(pack);
  assert.equal(engine.currentPage.id, "page-01");
  for (let index = 1; index < pack.pages.length; index += 1) engine.next();
  assert.equal(engine.currentPage.id, "page-26");
  assert.equal(engine.canGoNext, false);

  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => pack });
  try {
    const loaded = await loadWorkshopPack(
      new URL("https://example.test/packs/workshop-001-ecriture-augmentee/pack.json"),
      validateWorkshopPack,
    );
    assert.equal(loaded.id, "ecriture-augmentee");
    assert.equal(loaded.pages.length, 26);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
