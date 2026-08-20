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
      ["page-19", 19, "ecriture", "Faire lire sans faire écrire"],
      ["page-20", 20, "ecriture", "Revenir au texte"],
      ["page-21", 21, "transformation", "Ce que l'écriture a déplacé"],
      ["page-22", 22, "transformation", "Mettre la transformation à l'épreuve"],
      ["page-23", 23, "transformation", "Ce qui demeure, ce qui a changé"],
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

  const pageFour = pack.pages[3];
  assert.equal(pageFour.id, "page-04");
  assert.equal(pageFour.title, "Ne pas demander trop t\u00f4t");
  assert.equal(pageFour.movementId, "intention");
  assert.deepEqual(pageFour.blocks.map((block) => block.type), ["text", "recall", "text", "reveal", "text"]);
  const pageFourRecalls = pageFour.blocks.filter((block) => block.type === "recall");
  assert.equal(pageFourRecalls.length, 1);
  assert.equal(pageFourRecalls[0].id, "rappel-etincelle-avant-divergence");
  assert.equal(pageFourRecalls[0].sourceBlockId, "etincelle");
  assert.equal(pageFourRecalls[0].label, "Votre \u00e9tincelle");
  const pageFourReveals = pageFour.blocks.filter((block) => block.type === "reveal");
  assert.equal(pageFourReveals.length, 1);
  assert.equal(pageFourReveals[0].id, "demander-trop-tot-reveal");
  assert.equal(pageFourReveals[0].label, "Ce qui se passe lorsque nous demandons trop t\u00f4t");
  assert.equal(pageFour.blocks.some((block) => ["textarea", "choice", "promptCopy"].includes(block.type)), false);

  const pageFive = pack.pages[4];
  assert.equal(pageFive.id, "page-05");
  assert.equal(pageFive.title, "Ouvrir les possibles");
  assert.equal(pageFive.movementId, "divergence");
  assert.deepEqual(pageFive.blocks.map((block) => block.type), ["text", "recall", "text", "promptCopy", "text"]);
  const pageFiveRecalls = pageFive.blocks.filter((block) => block.type === "recall");
  assert.equal(pageFiveRecalls.length, 1);
  assert.equal(pageFiveRecalls[0].id, "rappel-etincelle-divergence");
  assert.equal(pageFiveRecalls[0].sourceBlockId, "etincelle");
  assert.equal(pageFiveRecalls[0].label, "Votre point de d\u00e9part");
  const pageFivePrompts = pageFive.blocks.filter((block) => block.type === "promptCopy");
  assert.equal(pageFivePrompts.length, 1);
  assert.equal(pageFivePrompts[0].id, "prompt-ouvrir-possibles");
  assert.equal(pageFivePrompts[0].label, "Ouvrir plusieurs directions");
  assert.equal(pageFivePrompts[0].text.includes("[COLLEZ ICI VOTRE \u00c9TINCELLE]"), true);
  assert.equal(pageFivePrompts[0].text.includes("Ne choisis pas la meilleure direction."), true);
  assert.equal(pageFivePrompts[0].text.includes("Ne d\u00e9veloppe aucune histoire compl\u00e8te."), true);
  assert.equal(pageFivePrompts[0].text.includes("Propose 6 directions"), true);
  assert.equal(pageFive.blocks.some((block) => ["textarea", "choice", "reveal"].includes(block.type)), false);

  const pageSix = pack.pages[5];
  assert.equal(pageSix.id, "page-06");
  assert.equal(pageSix.title, "Une id\u00e9e, plusieurs directions");
  assert.equal(pageSix.movementId, "divergence");
  assert.deepEqual(pageSix.blocks.map((block) => block.type), [
    "text",
    "recall",
    "text",
    "promptCopy",
    "text",
    "textarea",
    "text",
  ]);
  const pageSixRecalls = pageSix.blocks.filter((block) => block.type === "recall");
  assert.equal(pageSixRecalls.length, 1);
  assert.equal(pageSixRecalls[0].id, "rappel-etincelle-directions");
  assert.equal(pageSixRecalls[0].sourceBlockId, "etincelle");
  const pageSixPrompts = pageSix.blocks.filter((block) => block.type === "promptCopy");
  assert.equal(pageSixPrompts.length, 1);
  assert.equal(pageSixPrompts[0].id, "prompt-directions-contrastees");
  assert.equal(pageSixPrompts[0].label, "\u00c9loigner les directions");
  assert.equal(pageSixPrompts[0].text.includes("[COLLEZ ICI VOTRE \u00c9TINCELLE]"), true);
  assert.equal(pageSixPrompts[0].text.includes("Ne d\u00e9veloppe aucune histoire compl\u00e8te."), true);
  assert.equal(pageSixPrompts[0].text.includes("Ne choisis pas la meilleure direction."), true);
  assert.equal(pageSixPrompts[0].text.includes("Ne classe pas les propositions."), true);
  const pageSixTextareas = pageSix.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageSixTextareas.length, 1);
  assert.equal(pageSixTextareas[0].id, "directions-brutes");
  assert.equal(pageSixTextareas[0].label, "Quelques directions \u00e0 garder sous les yeux");
  assert.equal(pageSixTextareas[0].placeholder.includes("avec vos propres mots"), true);
  assert.equal(pageSix.blocks.some((block) => ["choice", "reveal"].includes(block.type)), false);

  const pageSeven = pack.pages[6];
  assert.equal(pageSeven.id, "page-07");
  assert.equal(pageSeven.title, "Faire varier");
  assert.equal(pageSeven.movementId, "divergence");
  assert.deepEqual(pageSeven.blocks.map((block) => block.type), [
    "text",
    "recall",
    "text",
    "choice",
    "promptCopy",
    "text",
    "textarea",
    "text",
  ]);
  const pageSevenRecalls = pageSeven.blocks.filter((block) => block.type === "recall");
  assert.equal(pageSevenRecalls.length, 1);
  assert.equal(pageSevenRecalls[0].id, "rappel-directions-variation");
  assert.equal(pageSevenRecalls[0].sourceBlockId, "directions-brutes");
  const pageSevenChoices = pageSeven.blocks.filter((block) => block.type === "choice");
  assert.equal(pageSevenChoices.length, 1);
  assert.equal(pageSevenChoices[0].id, "variation-parametre");
  assert.equal(pageSevenChoices[0].options.length, 7);
  const pageSevenPrompts = pageSeven.blocks.filter((block) => block.type === "promptCopy");
  assert.equal(pageSevenPrompts.length, 1);
  assert.equal(pageSevenPrompts[0].id, "prompt-faire-varier");
  assert.equal(pageSevenPrompts[0].text.includes("[COLLEZ ICI UNE DIRECTION QUE VOUS VOULEZ EXPLORER]"), true);
  assert.equal(pageSevenPrompts[0].text.includes("[INDIQUEZ ICI LE PARAM\u00c8TRE QUE VOUS VOULEZ FAIRE VARIER]"), true);
  assert.equal(pageSevenPrompts[0].text.includes("Ne d\u00e9veloppe aucune histoire compl\u00e8te."), true);
  assert.equal(pageSevenPrompts[0].text.includes("Ne choisis pas la meilleure variation."), true);
  assert.equal(pageSevenPrompts[0].text.includes("Ne classe pas les propositions."), true);
  assert.equal(pageSevenPrompts[0].text.includes("Ne fusionne pas les variations."), true);
  const pageSevenTextareas = pageSeven.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageSevenTextareas.length, 1);
  assert.equal(pageSevenTextareas[0].id, "variation-retenue");
  assert.equal(pageSevenTextareas[0].placeholder.includes("avec vos propres mots"), true);
  assert.equal(pageSeven.blocks.some((block) => block.type === "reveal"), false);

  const pageEight = pack.pages[7];
  assert.equal(pageEight.id, "page-08");
  assert.equal(pageEight.title, "Diverger sans se perdre");
  assert.equal(pageEight.movementId, "divergence");
  assert.deepEqual(pageEight.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "recall",
    "text",
    "textarea",
    "text",
  ]);
  const pageEightRecalls = pageEight.blocks.filter((block) => block.type === "recall");
  assert.equal(pageEightRecalls.length, 3);
  assert.deepEqual(
    pageEightRecalls.map((block) => block.sourceBlockId),
    ["etincelle", "directions-brutes", "variation-retenue"],
  );
  assert.deepEqual(
    pageEightRecalls.map((block) => block.id),
    ["rappel-etincelle-boussole", "rappel-directions-boussole", "rappel-variation-boussole"],
  );
  const pageEightTextareas = pageEight.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageEightTextareas.length, 1);
  assert.equal(pageEightTextareas[0].id, "boussole");
  assert.equal(pageEightTextareas[0].label, "Ce que vous ne voulez pas perdre");
  assert.equal(pageEight.blocks.some((block) => ["choice", "reveal", "promptCopy"].includes(block.type)), false);
  assert.equal(pack.pages[7].movementId, "divergence");
  assert.equal(pack.pages[8].movementId, "exploration");

  const pageNine = pack.pages[8];
  assert.equal(pageNine.id, "page-09");
  assert.equal(pageNine.title, "Entrer dans une possibilit\u00e9");
  assert.equal(pageNine.movementId, "exploration");
  assert.deepEqual(pageNine.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "textarea",
    "text",
    "reveal",
  ]);
  const pageNineRecalls = pageNine.blocks.filter((block) => block.type === "recall");
  assert.equal(pageNineRecalls.length, 2);
  assert.deepEqual(
    pageNineRecalls.map((block) => block.sourceBlockId),
    ["directions-brutes", "boussole"],
  );
  assert.deepEqual(
    pageNineRecalls.map((block) => block.id),
    ["rappel-directions-exploration", "rappel-boussole-exploration"],
  );
  const pageNineTextareas = pageNine.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageNineTextareas.length, 1);
  assert.equal(pageNineTextareas[0].id, "piste-provisoire");
  assert.equal(pageNineTextareas[0].label, "La possibilit\u00e9 que vous allez explorer");
  assert.equal(pageNineTextareas[0].placeholder.includes("avec vos propres mots"), true);
  const pageNineReveals = pageNine.blocks.filter((block) => block.type === "reveal");
  assert.equal(pageNineReveals.length, 1);
  assert.equal(pageNineReveals[0].id, "exploration-provisoire-reveal");
  assert.equal(pageNine.blocks.some((block) => ["choice", "promptCopy"].includes(block.type)), false);
  assert.equal(pack.pages[9].movementId, "exploration");
  assert.equal(pack.pages[9].blocks.some((block) => block.type === "promptCopy"), true);

  const pageTen = pack.pages[9];
  assert.equal(pageTen.id, "page-10");
  assert.equal(pageTen.title, "D\u00e9placer le regard");
  assert.equal(pageTen.movementId, "exploration");
  assert.deepEqual(pageTen.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "promptCopy",
    "text",
    "textarea",
    "text",
  ]);
  const pageTenRecalls = pageTen.blocks.filter((block) => block.type === "recall");
  assert.equal(pageTenRecalls.length, 2);
  assert.deepEqual(
    pageTenRecalls.map((block) => block.id),
    ["rappel-piste-regard", "rappel-boussole-regard"],
  );
  assert.deepEqual(
    pageTenRecalls.map((block) => block.sourceBlockId),
    ["piste-provisoire", "boussole"],
  );
  const pageTenPrompts = pageTen.blocks.filter((block) => block.type === "promptCopy");
  assert.equal(pageTenPrompts.length, 1);
  assert.equal(pageTenPrompts[0].id, "prompt-deplacer-regard");
  assert.equal(pageTenPrompts[0].label, "D\u00e9placer le regard");
  assert.equal(pageTenPrompts[0].text.includes("[COLLEZ ICI VOTRE PISTE PROVISOIRE]"), true);
  assert.equal(pageTenPrompts[0].text.includes("[COLLEZ ICI VOTRE BOUSSOLE \u2014 FACULTATIF]"), true);
  assert.equal(pageTenPrompts[0].text.includes("Ne poursuis pas l'histoire."), true);
  assert.equal(pageTenPrompts[0].text.includes("N'\u00e9cris pas de sc\u00e8ne."), true);
  assert.equal(pageTenPrompts[0].text.includes("Ne r\u00e9\u00e9cris pas ma proposition."), true);
  assert.equal(pageTenPrompts[0].text.includes("Ne d\u00e9cide pas quelle position est la meilleure."), true);
  const pageTenTextareas = pageTen.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageTenTextareas.length, 1);
  assert.equal(pageTenTextareas[0].id, "regard-deplace");
  assert.equal(pageTenTextareas[0].label, "Ce que ce d\u00e9placement vous a permis de voir");
  assert.equal(pageTenTextareas[0].placeholder.includes("Avec vos propres mots"), true);
  assert.equal(pageTen.blocks.some((block) => ["choice", "reveal"].includes(block.type)), false);

  const pageEleven = pack.pages[10];
  assert.equal(pageEleven.id, "page-11");
  assert.equal(pageEleven.title, "Et si ?");
  assert.equal(pageEleven.movementId, "exploration");
  assert.deepEqual(pageEleven.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "promptCopy",
    "text",
    "textarea",
    "text",
  ]);
  const pageElevenRecalls = pageEleven.blocks.filter((block) => block.type === "recall");
  assert.equal(pageElevenRecalls.length, 2);
  assert.deepEqual(
    pageElevenRecalls.map((block) => block.id),
    ["rappel-piste-hypothese", "rappel-regard-hypothese"],
  );
  assert.deepEqual(
    pageElevenRecalls.map((block) => block.sourceBlockId),
    ["piste-provisoire", "regard-deplace"],
  );
  const pageElevenPrompts = pageEleven.blocks.filter((block) => block.type === "promptCopy");
  assert.equal(pageElevenPrompts.length, 1);
  assert.equal(pageElevenPrompts[0].id, "prompt-et-si");
  assert.equal(pageElevenPrompts[0].label, "Faire varier une condition");
  assert.equal(pageElevenPrompts[0].text.includes("[COLLEZ ICI VOTRE PISTE PROVISOIRE]"), true);
  assert.equal(
    pageElevenPrompts[0].text.includes(
      "[COLLEZ ICI CE QUE LE D\u00c9PLACEMENT DU REGARD VOUS A FAIT VOIR \u2014 FACULTATIF]",
    ),
    true,
  );
  assert.equal(pageElevenPrompts[0].text.includes("Propose 6 hypoth\u00e8ses"), true);
  assert.equal(pageElevenPrompts[0].text.includes("une seule condition significative"), true);
  assert.equal(pageElevenPrompts[0].text.includes("Ne cherche pas le rebondissement pour lui-m\u00eame."), true);
  assert.equal(pageElevenPrompts[0].text.includes("N'\u00e9cris pas de sc\u00e8ne."), true);
  assert.equal(pageElevenPrompts[0].text.includes("Ne poursuis pas le r\u00e9cit."), true);
  assert.equal(pageElevenPrompts[0].text.includes("Ne produis pas de synopsis."), true);
  assert.equal(pageElevenPrompts[0].text.includes("Ne choisis pas l'hypoth\u00e8se \u00e0 ma place."), true);
  const pageElevenTextareas = pageEleven.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageElevenTextareas.length, 1);
  assert.equal(pageElevenTextareas[0].id, "hypothese-forte");
  assert.equal(pageElevenTextareas[0].label, "L'hypoth\u00e8se qui ouvre quelque chose");
  assert.equal(pageElevenTextareas[0].placeholder.includes("Avec vos propres mots"), true);
  assert.equal(pageEleven.blocks.some((block) => ["choice", "reveal"].includes(block.type)), false);
  assert.equal(pack.pages[9].movementId, "exploration");
  assert.equal(pack.pages[10].movementId, "exploration");
  assert.equal(pack.pages[11].movementId, "exploration");

  const pageTwelve = pack.pages[11];
  assert.equal(pageTwelve.id, "page-12");
  assert.equal(pageTwelve.title, "Faire appara\u00eetre l'inattendu");
  assert.equal(pageTwelve.movementId, "exploration");
  assert.deepEqual(pageTwelve.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "promptCopy",
    "text",
    "choice",
    "textarea",
    "text",
  ]);
  const pageTwelveRecalls = pageTwelve.blocks.filter((block) => block.type === "recall");
  assert.equal(pageTwelveRecalls.length, 2);
  assert.deepEqual(
    pageTwelveRecalls.map((block) => block.id),
    ["rappel-piste-inattendu", "rappel-hypothese-inattendu"],
  );
  assert.deepEqual(
    pageTwelveRecalls.map((block) => block.sourceBlockId),
    ["piste-provisoire", "hypothese-forte"],
  );
  const pageTwelvePrompts = pageTwelve.blocks.filter((block) => block.type === "promptCopy");
  assert.equal(pageTwelvePrompts.length, 1);
  assert.equal(pageTwelvePrompts[0].id, "prompt-faire-apparaitre-inattendu");
  assert.equal(pageTwelvePrompts[0].label, "Chercher un angle mort");
  assert.equal(pageTwelvePrompts[0].text.includes("[COLLEZ ICI VOTRE PISTE PROVISOIRE]"), true);
  assert.equal(pageTwelvePrompts[0].text.includes("[COLLEZ ICI VOTRE HYPOTH\u00c8SE \u2014 FACULTATIF]"), true);
  assert.equal(pageTwelvePrompts[0].text.includes("Propose 6 \u00e9l\u00e9ments inattendus"), true);
  assert.equal(pageTwelvePrompts[0].text.includes("reli\u00e9 \u00e0 la mati\u00e8re existante"), true);
  assert.equal(pageTwelvePrompts[0].text.includes("Ne cherche pas le spectaculaire."), true);
  assert.equal(pageTwelvePrompts[0].text.includes("N'ajoute pas un twist uniquement pour surprendre."), true);
  assert.equal(pageTwelvePrompts[0].text.includes("N'\u00e9cris pas de sc\u00e8ne."), true);
  assert.equal(pageTwelvePrompts[0].text.includes("Ne continue pas l'histoire."), true);
  assert.equal(pageTwelvePrompts[0].text.includes("Ne produis pas de synopsis."), true);
  assert.equal(pageTwelvePrompts[0].text.includes("Ne r\u00e9\u00e9cris pas ma proposition."), true);
  assert.equal(pageTwelvePrompts[0].text.includes("Ne r\u00e9sous pas mon hypoth\u00e8se."), true);
  assert.equal(pageTwelvePrompts[0].text.includes("Ne classe pas les propositions."), true);
  assert.equal(pageTwelvePrompts[0].text.includes("Ne choisis pas \u00e0 ma place."), true);
  const pageTwelveChoices = pageTwelve.blocks.filter((block) => block.type === "choice");
  assert.equal(pageTwelveChoices.length, 1);
  assert.equal(pageTwelveChoices[0].id, "inattendu-reaction");
  assert.equal(pageTwelveChoices[0].label, "Face \u00e0 ce qui est apparu, quelque chose\u2026");
  assert.deepEqual(
    pageTwelveChoices[0].options.map((option) => option.label),
    [
      "M'ouvre une possibilit\u00e9 que je n'avais pas vue",
      "D\u00e9place ma mani\u00e8re de comprendre la piste",
      "R\u00e9v\u00e8le une tension ou une question importante",
      "Me surprend, mais ne semble pas m'appartenir",
      "Ne demande pas \u00e0 \u00eatre conserv\u00e9",
    ],
  );
  const pageTwelveTextareas = pageTwelve.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageTwelveTextareas.length, 1);
  assert.equal(pageTwelveTextareas[0].id, "inattendu-retenu");
  assert.equal(pageTwelveTextareas[0].label, "Ce que vous voulez garder sous les yeux");
  assert.equal(pageTwelveTextareas[0].placeholder.includes("Avec vos propres mots"), true);
  assert.equal(pageTwelve.blocks.some((block) => block.type === "reveal"), false);
  assert.equal(pack.pages[10].movementId, "exploration");
  assert.equal(pack.pages[11].movementId, "exploration");
  assert.equal(pack.pages[12].movementId, "discernement");
  assert.equal(pack.pages[12].title, "Tout ce qui est possible n'est pas juste");

  const pageThirteen = pack.pages[12];
  assert.equal(pageThirteen.id, "page-13");
  assert.equal(pageThirteen.title, "Tout ce qui est possible n'est pas juste");
  assert.equal(pageThirteen.movementId, "discernement");
  assert.deepEqual(pageThirteen.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "recall",
    "text",
    "reveal",
    "text",
  ]);
  const pageThirteenRecalls = pageThirteen.blocks.filter((block) => block.type === "recall");
  assert.equal(pageThirteenRecalls.length, 3);
  assert.deepEqual(
    pageThirteenRecalls.map((block) => block.id),
    [
      "rappel-boussole-discernement",
      "rappel-hypothese-discernement",
      "rappel-inattendu-discernement",
    ],
  );
  assert.deepEqual(
    pageThirteenRecalls.map((block) => block.sourceBlockId),
    ["boussole", "hypothese-forte", "inattendu-retenu"],
  );
  assert.deepEqual(
    pageThirteenRecalls.map((block) => block.label),
    [
      "Ce que vous ne vouliez pas perdre",
      "Une hypoth\u00e8se qui a d\u00e9plac\u00e9 quelque chose",
      "Ce que vous avez gard\u00e9 sous les yeux",
    ],
  );
  const pageThirteenReveals = pageThirteen.blocks.filter((block) => block.type === "reveal");
  assert.equal(pageThirteenReveals.length, 1);
  assert.equal(pageThirteenReveals[0].id, "juste-ne-veut-pas-dire-meilleur");
  assert.equal(pageThirteenReveals[0].label, "\u00ab Juste \u00bb ne veut pas dire \u00ab meilleur \u00bb");
  assert.equal(pageThirteen.blocks.some((block) => ["textarea", "choice", "promptCopy"].includes(block.type)), false);
  assert.equal(pageThirteen.blocks.some((block) => block.id === "choix-assume"), false);
  assert.equal(pageThirteen.blocks.some((block) => block.id === "voix-recherchee"), false);
  assert.equal(pack.pages[11].movementId, "exploration");
  assert.equal(pack.pages[12].movementId, "discernement");
  assert.equal(pack.pages[13].movementId, "discernement");
  assert.equal(pack.pages[13].title, "Reconna\u00eetre ce qui r\u00e9sonne");

  const pageFourteen = pack.pages[13];
  assert.equal(pageFourteen.id, "page-14");
  assert.equal(pageFourteen.title, "Reconna\u00eetre ce qui r\u00e9sonne");
  assert.equal(pageFourteen.movementId, "discernement");
  assert.deepEqual(pageFourteen.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "recall",
    "text",
    "choice",
    "textarea",
    "text",
  ]);
  const pageFourteenRecalls = pageFourteen.blocks.filter((block) => block.type === "recall");
  assert.equal(pageFourteenRecalls.length, 3);
  assert.deepEqual(
    pageFourteenRecalls.map((block) => block.id),
    ["rappel-boussole-resonance", "rappel-piste-resonance", "rappel-inattendu-resonance"],
  );
  assert.deepEqual(
    pageFourteenRecalls.map((block) => block.sourceBlockId),
    ["boussole", "piste-provisoire", "inattendu-retenu"],
  );
  const pageFourteenChoices = pageFourteen.blocks.filter((block) => block.type === "choice");
  assert.equal(pageFourteenChoices.length, 1);
  assert.equal(pageFourteenChoices[0].id, "resonance-signe");
  assert.equal(pageFourteenChoices[0].label, "Quand quelque chose r\u00e9sonne, qu'est-ce qui vous le fait sentir ?");
  assert.equal(pageFourteenChoices[0].options.length, 6);
  assert.equal(
    pageFourteenChoices[0].options.some((option) => option.label === "Cela me donne envie d'\u00e9crire moi-m\u00eame"),
    true,
  );
  assert.equal(
    pageFourteenChoices[0].options.some((option) => option.label === "Je ne sais pas encore"),
    true,
  );
  const pageFourteenTextareas = pageFourteen.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageFourteenTextareas.length, 1);
  assert.equal(pageFourteenTextareas[0].id, "criteres-resonance");
  assert.equal(pageFourteenTextareas[0].label, "Ce qui vous aide \u00e0 reconna\u00eetre ce qui compte");
  assert.equal(pageFourteenTextareas[0].placeholder.includes("Avec vos propres mots"), true);
  assert.equal(pageFourteen.blocks.some((block) => ["promptCopy", "reveal"].includes(block.type)), false);
  assert.equal(pack.pages[12].movementId, "discernement");
  assert.equal(pack.pages[13].movementId, "discernement");
  assert.equal(pack.pages[14].movementId, "discernement");

  const pageFifteen = pack.pages[14];
  assert.equal(pageFifteen.id, "page-15");
  assert.equal(pageFifteen.title, "Choisir et renoncer");
  assert.equal(pageFifteen.movementId, "discernement");
  assert.deepEqual(pageFifteen.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "recall",
    "text",
    "choice",
    "textarea",
    "textarea",
    "text",
  ]);
  const pageFifteenRecalls = pageFifteen.blocks.filter((block) => block.type === "recall");
  assert.equal(pageFifteenRecalls.length, 3);
  assert.deepEqual(
    pageFifteenRecalls.map((block) => block.id),
    ["rappel-boussole-choix", "rappel-piste-choix", "rappel-criteres-choix"],
  );
  assert.deepEqual(
    pageFifteenRecalls.map((block) => block.sourceBlockId),
    ["boussole", "piste-provisoire", "criteres-resonance"],
  );
  const pageFifteenChoices = pageFifteen.blocks.filter((block) => block.type === "choice");
  assert.equal(pageFifteenChoices.length, 1);
  assert.equal(pageFifteenChoices[0].id, "choix-geste");
  assert.equal(pageFifteenChoices[0].label, "\u00c0 cet instant, votre d\u00e9cision ressemble plut\u00f4t \u00e0\u2026");
  assert.equal(pageFifteenChoices[0].options.length, 6);
  assert.equal(
    pageFifteenChoices[0].options.some(
      (option) => option.label === "Je ne sais pas encore, mais je peux choisir provisoirement",
    ),
    true,
  );
  const pageFifteenTextareas = pageFifteen.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageFifteenTextareas.length, 2);
  assert.deepEqual(
    pageFifteenTextareas.map((block) => block.id),
    ["choix-assume", "renoncement-assume"],
  );
  assert.equal(pageFifteenTextareas[0].label, "La direction que vous choisissez de poursuivre");
  assert.equal(pageFifteenTextareas[1].label, "Ce que vous acceptez de laisser de c\u00f4t\u00e9");
  assert.equal(pageFifteen.blocks.some((block) => ["promptCopy", "reveal"].includes(block.type)), false);

  const pageSixteen = pack.pages[15];
  assert.equal(pageSixteen.id, "page-16");
  assert.equal(pageSixteen.title, "Retrouver sa voix");
  assert.equal(pageSixteen.movementId, "discernement");
  assert.deepEqual(pageSixteen.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "recall",
    "text",
    "choice",
    "textarea",
    "reveal",
    "text",
  ]);
  const pageSixteenRecalls = pageSixteen.blocks.filter((block) => block.type === "recall");
  assert.equal(pageSixteenRecalls.length, 3);
  assert.deepEqual(
    pageSixteenRecalls.map((block) => block.id),
    ["rappel-boussole-voix", "rappel-criteres-voix", "rappel-choix-voix"],
  );
  assert.deepEqual(
    pageSixteenRecalls.map((block) => block.sourceBlockId),
    ["boussole", "criteres-resonance", "choix-assume"],
  );
  const pageSixteenChoices = pageSixteen.blocks.filter((block) => block.type === "choice");
  assert.equal(pageSixteenChoices.length, 1);
  assert.equal(pageSixteenChoices[0].id, "voix-signe");
  assert.equal(pageSixteenChoices[0].options.length, 7);
  assert.equal(
    pageSixteenChoices[0].options.some(
      (option) => option.label === "Une mani\u00e8re particuli\u00e8re de regarder la situation",
    ),
    true,
  );
  assert.equal(
    pageSixteenChoices[0].options.some(
      (option) =>
        option.label === "Je ne sais pas encore, mais je sens qu'il y a quelque chose \u00e0 chercher",
    ),
    true,
  );
  const pageSixteenTextareas = pageSixteen.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageSixteenTextareas.length, 1);
  assert.equal(pageSixteenTextareas[0].id, "voix-recherchee");
  assert.equal(pageSixteenTextareas[0].label, "Ce que vous voulez entendre dans votre texte");
  const pageSixteenReveals = pageSixteen.blocks.filter((block) => block.type === "reveal");
  assert.equal(pageSixteenReveals.length, 1);
  assert.equal(pageSixteenReveals[0].id, "voix-signature-reveal");
  assert.equal(pageSixteenReveals[0].label, "La voix n'est pas une signature \u00e0 fabriquer");
  assert.equal(typeof pageSixteenReveals[0].content, "string");
  assert.equal(pageSixteen.blocks.some((block) => block.type === "promptCopy"), false);
  assert.equal(pack.pages[15].movementId, "discernement");
  assert.equal(pack.pages[16].movementId, "ecriture");

  const pageSeventeen = pack.pages[16];
  assert.equal(pageSeventeen.id, "page-17");
  assert.equal(pageSeventeen.title, "Reprendre la main");
  assert.equal(pageSeventeen.movementId, "ecriture");
  assert.deepEqual(pageSeventeen.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "textarea",
    "text",
    "reveal",
    "text",
  ]);
  const pageSeventeenRecalls = pageSeventeen.blocks.filter((block) => block.type === "recall");
  assert.equal(pageSeventeenRecalls.length, 2);
  assert.deepEqual(
    pageSeventeenRecalls.map((block) => block.id),
    ["rappel-choix-ecriture", "rappel-voix-ecriture"],
  );
  assert.deepEqual(
    pageSeventeenRecalls.map((block) => block.sourceBlockId),
    ["choix-assume", "voix-recherchee"],
  );
  const pageSeventeenTextareas = pageSeventeen.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageSeventeenTextareas.length, 1);
  assert.equal(pageSeventeenTextareas[0].id, "matiere-premiere");
  assert.equal(pageSeventeenTextareas[0].label, "Commencez avec vos mots");
  const pageSeventeenReveals = pageSeventeen.blocks.filter((block) => block.type === "reveal");
  assert.equal(pageSeventeenReveals.length, 1);
  assert.equal(pageSeventeenReveals[0].id, "ecriture-ia-efface-reveal");
  assert.equal(pageSeventeenReveals[0].label, "Pourquoi ne pas demander \u00e0 l'IA d'\u00e9crire maintenant ?");
  assert.equal(typeof pageSeventeenReveals[0].content, "string");
  assert.equal(pageSeventeen.blocks.some((block) => ["choice", "promptCopy"].includes(block.type)), false);
  assert.equal(pack.pages[16].movementId, "ecriture");
  assert.equal(pack.pages[17].movementId, "ecriture");

  const pageEighteen = pack.pages[17];
  assert.equal(pageEighteen.id, "page-18");
  assert.equal(pageEighteen.title, "Composer");
  assert.equal(pageEighteen.movementId, "ecriture");
  assert.deepEqual(pageEighteen.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "textarea",
    "text",
    "reveal",
    "text",
  ]);
  const pageEighteenRecalls = pageEighteen.blocks.filter((block) => block.type === "recall");
  assert.equal(pageEighteenRecalls.length, 2);
  assert.deepEqual(
    pageEighteenRecalls.map((block) => block.id),
    ["rappel-matiere-composition", "rappel-voix-composition"],
  );
  assert.deepEqual(
    pageEighteenRecalls.map((block) => block.sourceBlockId),
    ["matiere-premiere", "voix-recherchee"],
  );
  const pageEighteenTextareas = pageEighteen.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageEighteenTextareas.length, 1);
  assert.equal(pageEighteenTextareas[0].id, "premiere-forme");
  assert.equal(pageEighteenTextareas[0].label, "Donnez une premi\u00e8re forme \u00e0 votre mati\u00e8re");
  const pageEighteenReveals = pageEighteen.blocks.filter((block) => block.type === "reveal");
  assert.equal(pageEighteenReveals.length, 1);
  assert.equal(pageEighteenReveals[0].id, "composer-pas-corriger-reveal");
  assert.equal(pageEighteenReveals[0].label, "Composer n'est pas encore corriger");
  assert.equal(typeof pageEighteenReveals[0].content, "string");
  assert.equal(pageEighteen.blocks.some((block) => ["choice", "promptCopy"].includes(block.type)), false);
  assert.equal(pack.pages[16].movementId, "ecriture");
  assert.equal(pack.pages[17].movementId, "ecriture");
  assert.equal(pack.pages[18].movementId, "ecriture");
  assert.equal(pack.pages[19].movementId, "ecriture");

  const pageNineteen = pack.pages[18];
  assert.equal(pageNineteen.id, "page-19");
  assert.equal(pageNineteen.title, "Faire lire sans faire \u00e9crire");
  assert.equal(pageNineteen.movementId, "ecriture");
  assert.deepEqual(pageNineteen.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "promptCopy",
    "text",
    "textarea",
    "text",
  ]);
  const pageNineteenRecalls = pageNineteen.blocks.filter((block) => block.type === "recall");
  assert.equal(pageNineteenRecalls.length, 2);
  assert.deepEqual(
    pageNineteenRecalls.map((block) => block.id),
    ["rappel-premiere-forme-lecture", "rappel-voix-lecture"],
  );
  assert.deepEqual(
    pageNineteenRecalls.map((block) => block.sourceBlockId),
    ["premiere-forme", "voix-recherchee"],
  );
  const pageNineteenPromptCopies = pageNineteen.blocks.filter((block) => block.type === "promptCopy");
  assert.equal(pageNineteenPromptCopies.length, 1);
  assert.equal(pageNineteenPromptCopies[0].id, "prompt-lire-sans-ecrire");
  assert.equal(pageNineteenPromptCopies[0].label, "Demander une lecture, pas une r\u00e9\u00e9criture");
  assert.equal(pageNineteenPromptCopies[0].text.includes("[COLLEZ ICI VOTRE PREMI\u00c8RE FORME]"), true);
  assert.equal(
    pageNineteenPromptCopies[0].text.includes(
      "[COLLEZ ICI CE QUE VOUS VOULEZ PR\u00c9SERVER DANS VOTRE VOIX \u2014 FACULTATIF]",
    ),
    true,
  );
  assert.equal(pageNineteenPromptCopies[0].text.includes("Lis-le plut\u00f4t comme un regard ext\u00e9rieur attentif."), true);
  assert.equal(pageNineteenPromptCopies[0].text.includes("Je ne te demande pas de r\u00e9\u00e9crire ce texte."), true);
  assert.equal(pageNineteenPromptCopies[0].text.includes("Ne le corrige pas."), true);
  assert.equal(pageNineteenPromptCopies[0].text.includes("Ne l'am\u00e9liore pas."), true);
  assert.equal(pageNineteenPromptCopies[0].text.includes("Ne le continue pas."), true);
  assert.equal(pageNineteenPromptCopies[0].text.includes("Ne propose pas une nouvelle version."), true);
  assert.equal(pageNineteenPromptCopies[0].text.includes("Ne d\u00e9cide pas ce que je dois conserver ou supprimer."), true);
  assert.equal(
    pageNineteenPromptCopies[0].text.includes("Appuie tes observations sur ce qui est r\u00e9ellement pr\u00e9sent dans le texte."),
    true,
  );
  assert.equal(pageNineteenPromptCopies[0].text.includes("trois questions que ce texte pourrait me poser"), true);
  const pageNineteenTextareas = pageNineteen.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageNineteenTextareas.length, 1);
  assert.equal(pageNineteenTextareas[0].id, "lecture-retenue");
  assert.equal(pageNineteenTextareas[0].label, "Ce que cette lecture vous a permis de voir");
  assert.equal(pageNineteen.blocks.some((block) => ["choice", "reveal"].includes(block.type)), false);
  assert.equal(pack.pages[18].movementId, "ecriture");
  assert.equal(pack.pages[19].movementId, "ecriture");

  const pageTwenty = pack.pages[19];
  assert.equal(pageTwenty.id, "page-20");
  assert.equal(pageTwenty.title, "Revenir au texte");
  assert.equal(pageTwenty.movementId, "ecriture");
  assert.deepEqual(pageTwenty.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "choice",
    "textarea",
    "textarea",
    "text",
    "reveal",
    "text",
  ]);
  const pageTwentyRecalls = pageTwenty.blocks.filter((block) => block.type === "recall");
  assert.equal(pageTwentyRecalls.length, 2);
  assert.deepEqual(
    pageTwentyRecalls.map((block) => block.id),
    ["rappel-premiere-forme-retour", "rappel-lecture-retour"],
  );
  assert.deepEqual(
    pageTwentyRecalls.map((block) => block.sourceBlockId),
    ["premiere-forme", "lecture-retenue"],
  );
  const pageTwentyChoices = pageTwenty.blocks.filter((block) => block.type === "choice");
  assert.equal(pageTwentyChoices.length, 1);
  assert.equal(pageTwentyChoices[0].id, "retour-texte-geste");
  assert.equal(pageTwentyChoices[0].label, "En revenant \u00e0 votre texte, que souhaitez-vous faire ?");
  assert.equal(pageTwentyChoices[0].options.length, 7);
  assert.equal(
    pageTwentyChoices[0].options.some(
      (option) => option.label === "Je veux pr\u00e9server certains passages exactement comme ils sont",
    ),
    true,
  );
  assert.equal(
    pageTwentyChoices[0].options.some(
      (option) =>
        option.label === "Je ne sais pas encore : je vais recommencer \u00e0 \u00e9crire et voir ce qui se d\u00e9place",
    ),
    true,
  );
  const pageTwentyTextareas = pageTwenty.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageTwentyTextareas.length, 2);
  assert.deepEqual(
    pageTwentyTextareas.map((block) => block.id),
    ["reprise-decidee", "texte-repris"],
  );
  assert.equal(pageTwentyTextareas[0].label, "Ce que vous choisissez de reprendre");
  assert.equal(pageTwentyTextareas[1].label, "Reprenez votre texte");
  const pageTwentyReveals = pageTwenty.blocks.filter((block) => block.type === "reveal");
  assert.equal(pageTwentyReveals.length, 1);
  assert.equal(pageTwentyReveals[0].id, "revenir-texte-reveal");
  assert.equal(pageTwentyReveals[0].label, "Vous n'\u00eates pas oblig\u00e9 de suivre une bonne remarque");
  assert.equal(typeof pageTwentyReveals[0].content, "string");
  assert.equal(pageTwenty.blocks.some((block) => block.type === "promptCopy"), false);
  assert.equal(pack.pages[18].title, "Faire lire sans faire \u00e9crire");
  assert.equal(pack.pages[20].title, "Ce que l'\u00e9criture a d\u00e9plac\u00e9");
  assert.equal(pack.pages[19].movementId, "ecriture");
  assert.equal(pack.pages[20].movementId, "transformation");

  const pageTwentyOne = pack.pages[20];
  assert.equal(pageTwentyOne.id, "page-21");
  assert.equal(pageTwentyOne.title, "Ce que l'\u00e9criture a d\u00e9plac\u00e9");
  assert.equal(pageTwentyOne.movementId, "transformation");
  assert.deepEqual(pageTwentyOne.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "choice",
    "textarea",
    "text",
    "reveal",
    "text",
  ]);
  const pageTwentyOneRecalls = pageTwentyOne.blocks.filter((block) => block.type === "recall");
  assert.equal(pageTwentyOneRecalls.length, 2);
  assert.deepEqual(
    pageTwentyOneRecalls.map((block) => block.id),
    ["rappel-boussole-transformation", "rappel-texte-repris-transformation"],
  );
  assert.deepEqual(
    pageTwentyOneRecalls.map((block) => block.sourceBlockId),
    ["boussole", "texte-repris"],
  );
  const pageTwentyOneChoices = pageTwentyOne.blocks.filter((block) => block.type === "choice");
  assert.equal(pageTwentyOneChoices.length, 1);
  assert.equal(pageTwentyOneChoices[0].id, "transformation-lieu");
  assert.equal(
    pageTwentyOneChoices[0].label,
    "Si quelque chose s'est d\u00e9plac\u00e9, o\u00f9 le percevez-vous surtout ?",
  );
  assert.equal(pageTwentyOneChoices[0].options.length, 8);
  assert.equal(
    pageTwentyOneChoices[0].options.some(
      (option) => option.label === "Dans ma mani\u00e8re d'utiliser \u2014 ou de ne pas utiliser \u2014 l'IA",
    ),
    true,
  );
  assert.equal(
    pageTwentyOneChoices[0].options.some(
      (option) => option.label === "Je ne per\u00e7ois pas encore de d\u00e9placement particulier",
    ),
    true,
  );
  const pageTwentyOneTextareas = pageTwentyOne.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageTwentyOneTextareas.length, 1);
  assert.equal(pageTwentyOneTextareas[0].id, "deplacement-percu");
  assert.equal(pageTwentyOneTextareas[0].label, "Ce qui a peut-\u00eatre chang\u00e9");
  const pageTwentyOneReveals = pageTwentyOne.blocks.filter((block) => block.type === "reveal");
  assert.equal(pageTwentyOneReveals.length, 1);
  assert.equal(pageTwentyOneReveals[0].id, "transformation-pas-progres-reveal");
  assert.equal(pageTwentyOneReveals[0].label, "Transformer ne veut pas dire progresser");
  assert.equal(typeof pageTwentyOneReveals[0].content, "string");
  assert.equal(pageTwentyOne.blocks.some((block) => block.type === "promptCopy"), false);
  assert.equal(pack.pages[19].title, "Revenir au texte");
  assert.equal(pack.pages[21].title, "Mettre la transformation \u00e0 l'\u00e9preuve");
  assert.equal(pack.pages[21].movementId, "transformation");
  assert.equal(pack.pages[21].blocks.some((block) => block.type === "promptCopy"), true);

  const pageTwentyTwo = pack.pages[21];
  assert.equal(pageTwentyTwo.id, "page-22");
  assert.equal(pageTwentyTwo.title, "Mettre la transformation \u00e0 l'\u00e9preuve");
  assert.equal(pageTwentyTwo.movementId, "transformation");
  assert.deepEqual(pageTwentyTwo.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "promptCopy",
    "text",
    "choice",
    "textarea",
    "text",
  ]);
  const pageTwentyTwoRecalls = pageTwentyTwo.blocks.filter((block) => block.type === "recall");
  assert.equal(pageTwentyTwoRecalls.length, 2);
  assert.deepEqual(
    pageTwentyTwoRecalls.map((block) => block.id),
    ["rappel-deplacement-epreuve", "rappel-boussole-epreuve"],
  );
  assert.deepEqual(
    pageTwentyTwoRecalls.map((block) => block.sourceBlockId),
    ["deplacement-percu", "boussole"],
  );
  const pageTwentyTwoPromptCopies = pageTwentyTwo.blocks.filter((block) => block.type === "promptCopy");
  assert.equal(pageTwentyTwoPromptCopies.length, 1);
  assert.equal(pageTwentyTwoPromptCopies[0].id, "prompt-mettre-transformation-epreuve");
  assert.equal(pageTwentyTwoPromptCopies[0].label, "Mettre un d\u00e9placement \u00e0 l'\u00e9preuve");
  assert.equal(
    pageTwentyTwoPromptCopies[0].text.includes("[COLLEZ ICI CE QUI VOUS SEMBLE AVOIR CHANG\u00c9 \u2014 OU CE QUI DEMEURE]"),
    true,
  );
  assert.equal(
    pageTwentyTwoPromptCopies[0].text.includes(
      "[COLLEZ ICI CE QUE VOUS NE VOULEZ PAS PERDRE \u2014 FACULTATIF]",
    ),
    true,
  );
  for (const expectedPromptFragment of [
    "formule 3 questions qui pourraient r\u00e9v\u00e9ler ce que ce d\u00e9placement rend possible",
    "formule 3 questions qui pourraient r\u00e9v\u00e9ler ce qu'il risque de simplifier, masquer ou faire perdre",
    "indique une tension \u00e9ventuelle",
    "reste impossible \u00e0 d\u00e9terminer sans mon propre jugement d'auteur",
    "Ne r\u00e9\u00e9cris pas mon texte.",
    "Ne le corrige pas.",
    "Ne l'am\u00e9liore pas.",
    "Ne le continue pas.",
    "Ne propose pas une nouvelle version.",
    "Ne d\u00e9cide pas \u00e0 ma place",
    "Ne classe aucune possibilit\u00e9.",
    "Ne cherche pas la meilleure version du texte.",
  ]) {
    assert.equal(pageTwentyTwoPromptCopies[0].text.includes(expectedPromptFragment), true);
  }
  const pageTwentyTwoChoices = pageTwentyTwo.blocks.filter((block) => block.type === "choice");
  assert.equal(pageTwentyTwoChoices.length, 1);
  assert.equal(pageTwentyTwoChoices[0].id, "epreuve-reaction");
  assert.equal(pageTwentyTwoChoices[0].label, "Apr\u00e8s cette mise \u00e0 l'\u00e9preuve, que remarquez-vous ?");
  assert.equal(pageTwentyTwoChoices[0].options.length, 7);
  assert.equal(
    pageTwentyTwoChoices[0].options.some(
      (option) => option.label === "Je n'ai pas utilis\u00e9 l'IA et j'ai fait ce travail de questionnement moi-m\u00eame",
    ),
    true,
  );
  const pageTwentyTwoTextareas = pageTwentyTwo.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageTwentyTwoTextareas.length, 1);
  assert.equal(pageTwentyTwoTextareas[0].id, "epreuve-retenue");
  assert.equal(pageTwentyTwoTextareas[0].label, "Ce que vous retenez de cette mise \u00e0 l'\u00e9preuve");
  assert.equal(pageTwentyTwo.blocks.some((block) => block.type === "reveal"), false);
  assert.equal(pack.pages.slice(22).some((page) => page.blocks.some((block) => block.type === "promptCopy")), false);
  const pageTwentyThree = pack.pages[22];
  assert.equal(pageTwentyThree.id, "page-23");
  assert.equal(pageTwentyThree.title, "Ce qui demeure, ce qui a chang\u00e9");
  assert.equal(pageTwentyThree.movementId, "transformation");
  assert.deepEqual(pageTwentyThree.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "choice",
    "textarea",
    "reveal",
    "text",
  ]);
  const pageTwentyThreeRecalls = pageTwentyThree.blocks.filter((block) => block.type === "recall");
  assert.equal(pageTwentyThreeRecalls.length, 2);
  assert.deepEqual(
    pageTwentyThreeRecalls.map((block) => block.id),
    ["rappel-boussole-demeurer", "rappel-epreuve-demeurer"],
  );
  assert.deepEqual(
    pageTwentyThreeRecalls.map((block) => block.sourceBlockId),
    ["boussole", "epreuve-retenue"],
  );
  const pageTwentyThreeChoices = pageTwentyThree.blocks.filter((block) => block.type === "choice");
  assert.equal(pageTwentyThreeChoices.length, 1);
  assert.equal(pageTwentyThreeChoices[0].id, "transformation-percue");
  assert.equal(
    pageTwentyThreeChoices[0].label,
    "En regardant le chemin parcouru, qu'est-ce qui vous semble le plus juste aujourd'hui ?",
  );
  assert.equal(pageTwentyThreeChoices[0].options.length, 7);
  assert.equal(
    pageTwentyThreeChoices[0].options.some(
      (option) => option.label === "Ma relation \u00e0 l'IA est devenue plus consciente",
    ),
    true,
  );
  assert.equal(
    pageTwentyThreeChoices[0].options.some(
      (option) => option.label === "Je ne per\u00e7ois pas encore clairement ce qui a chang\u00e9",
    ),
    true,
  );
  const pageTwentyThreeTextareas = pageTwentyThree.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageTwentyThreeTextareas.length, 1);
  assert.equal(pageTwentyThreeTextareas[0].id, "version-a-moi");
  assert.equal(pageTwentyThreeTextareas[0].label, "Ce que vous reconnaissez maintenant");
  const pageTwentyThreeReveals = pageTwentyThree.blocks.filter((block) => block.type === "reveal");
  assert.equal(pageTwentyThreeReveals.length, 1);
  assert.equal(pageTwentyThreeReveals[0].id, "transformation-demeurer-reveal");
  assert.equal(pageTwentyThreeReveals[0].label, "Tout n'a pas besoin de changer");
  assert.equal(typeof pageTwentyThreeReveals[0].content, "string");
  assert.equal(pageTwentyThree.blocks.some((block) => block.type === "promptCopy"), false);
  assert.equal(pack.pages.slice(22).some((page) => page.blocks.some((block) => block.type === "promptCopy")), false);
  const pageTwentyFour = pack.pages[23];
  assert.equal(pageTwentyFour.id, "page-24");
  assert.equal(pageTwentyFour.title, "Savoir s'arr\u00eater");
  assert.equal(pageTwentyFour.movementId, "transformation");
  assert.deepEqual(pageTwentyFour.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "text",
    "choice",
    "textarea",
    "reveal",
    "text",
  ]);
  const pageTwentyFourRecalls = pageTwentyFour.blocks.filter((block) => block.type === "recall");
  assert.equal(pageTwentyFourRecalls.length, 2);
  assert.deepEqual(
    pageTwentyFourRecalls.map((block) => block.id),
    ["rappel-version-arret", "rappel-boussole-arret"],
  );
  assert.deepEqual(
    pageTwentyFourRecalls.map((block) => block.sourceBlockId),
    ["version-a-moi", "boussole"],
  );
  const pageTwentyFourChoices = pageTwentyFour.blocks.filter((block) => block.type === "choice");
  assert.equal(pageTwentyFourChoices.length, 1);
  assert.equal(pageTwentyFourChoices[0].id, "arret-signe");
  assert.equal(
    pageTwentyFourChoices[0].label,
    "Qu'est-ce qui pourrait vous indiquer qu'il est temps de vous arr\u00eater, pour maintenant ?",
  );
  assert.equal(pageTwentyFourChoices[0].options.length, 7);
  assert.equal(
    pageTwentyFourChoices[0].options.some(
      (option) => option.label === "Continuer commencerait surtout \u00e0 lisser ce qui reste vivant",
    ),
    true,
  );
  assert.equal(
    pageTwentyFourChoices[0].options.some(
      (option) => option.label === "Je ne sais pas encore reconna\u00eetre ce moment",
    ),
    true,
  );
  const pageTwentyFourTextareas = pageTwentyFour.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageTwentyFourTextareas.length, 1);
  assert.equal(pageTwentyFourTextareas[0].id, "critere-arret");
  assert.equal(pageTwentyFourTextareas[0].label, "Ce qui vous dira que vous pouvez vous arr\u00eater");
  const pageTwentyFourReveals = pageTwentyFour.blocks.filter((block) => block.type === "reveal");
  assert.equal(pageTwentyFourReveals.length, 1);
  assert.equal(pageTwentyFourReveals[0].id, "arret-inachevement-reveal");
  assert.equal(pageTwentyFourReveals[0].label, "Un texte peut \u00eatre achev\u00e9 sans \u00eatre \u00e9puis\u00e9");
  assert.equal(typeof pageTwentyFourReveals[0].content, "string");
  assert.equal(pageTwentyFour.blocks.some((block) => block.type === "promptCopy"), false);

  const pageTwentyFive = pack.pages[24];
  const pageTwentySix = pack.pages[25];
  assert.equal(pageTwentyFive.id, "page-25");
  assert.equal(pageTwentyFive.title, "Votre r\u00e9cit");
  assert.equal(pageTwentyFive.movementId, "creation");
  assert.deepEqual(pageTwentyFive.blocks.map((block) => block.type), [
    "text",
    "recall",
    "recall",
    "recall",
    "choice",
    "textarea",
    "reveal",
    "text",
  ]);
  const pageTwentyFiveRecalls = pageTwentyFive.blocks.filter((block) => block.type === "recall");
  assert.equal(pageTwentyFiveRecalls.length, 3);
  assert.deepEqual(
    pageTwentyFiveRecalls.map((block) => block.sourceBlockId),
    ["etincelle", "choix-assume", "version-a-moi"],
  );
  assert.deepEqual(
    pageTwentyFiveRecalls.map((block) => block.label),
    ["Au commencement", "La direction que vous avez choisie", "Ce qui est devenu v\u00f4tre"],
  );
  const pageTwentyFiveChoices = pageTwentyFive.blocks.filter((block) => block.type === "choice");
  assert.equal(pageTwentyFiveChoices.length, 1);
  assert.equal(pageTwentyFiveChoices[0].id, "recit-reconnaissance");
  assert.equal(
    pageTwentyFiveChoices[0].label,
    "En regardant ce chemin, qu'est-ce qui vous frappe le plus ?",
  );
  assert.equal(pageTwentyFiveChoices[0].options.length, 7);
  assert.equal(
    pageTwentyFiveChoices[0].options.some(
      (option) => option.label === "Le texte reste ouvert, mais il m'appartient davantage",
    ),
    true,
  );
  assert.equal(
    pageTwentyFiveChoices[0].options.some(
      (option) => option.label === "Je ne sais pas encore comment regarder ce chemin",
    ),
    true,
  );
  const pageTwentyFiveTextareas = pageTwentyFive.blocks.filter((block) => block.type === "textarea");
  assert.equal(pageTwentyFiveTextareas.length, 1);
  assert.equal(pageTwentyFiveTextareas[0].id, "recit-reconnu");
  assert.equal(pageTwentyFiveTextareas[0].label, "Ce que vous voyez maintenant");
  const pageTwentyFiveReveals = pageTwentyFive.blocks.filter((block) => block.type === "reveal");
  assert.equal(pageTwentyFiveReveals.length, 1);
  assert.equal(pageTwentyFiveReveals[0].id, "recit-appartenance-reveal");
  assert.equal(pageTwentyFiveReveals[0].label, "Un r\u00e9cit n'appartient pas \u00e0 celui qui a tout pr\u00e9vu");
  assert.equal(typeof pageTwentyFiveReveals[0].content, "string");
  assert.equal(pageTwentyFive.blocks.some((block) => block.type === "promptCopy"), false);

  assert.equal(pageTwentySix.id, "page-26");
  assert.equal(pageTwentySix.title, "Continuer sans l'atelier");
  assert.equal(pageTwentySix.movementId, "creation");
  assert.equal(
    pageTwentyFive.blocks.some((block) => block.type === "recall" && block.sourceBlockId === "version-a-moi"),
    true,
  );
  assert.equal(
    pageTwentySix.blocks.some((block) => block.type === "recall" && block.sourceBlockId === "version-a-moi"),
    true,
  );
  assert.equal(
    pageTwentySix.blocks.some((block) => block.type === "recall" && block.sourceBlockId === "critere-arret"),
    true,
  );

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
    "inattendu-retenu",
    "criteres-resonance",
    "choix-assume",
    "voix-recherchee",
    "matiere-premiere",
    "premiere-forme",
    "lecture-retenue",
    "reprise-decidee",
    "texte-repris",
    "deplacement-percu",
    "epreuve-retenue",
    "version-a-moi",
    "critere-arret",
    "recit-reconnu",
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
