import assert from "node:assert/strict";
import test from "node:test";
import {
  WORKSHOP_PROGRESS_SCHEMA_VERSION,
  WorkshopProgressStore,
  createWorkshopProgress,
  getWorkshopProgressStorageKey,
} from "../../../.test-build/apps/player/src/workshop-progress.js";

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

class ThrowingStorage {
  getItem() {
    throw new Error("get unavailable");
  }

  setItem() {
    throw new Error("set unavailable");
  }

  removeItem() {
    throw new Error("remove unavailable");
  }
}

const pages = [
  {
    id: "page-01",
    movementId: "movement-01",
    order: 1,
    title: "Entrer",
    blocks: [{ id: "intro", type: "text", text: "Lire." }],
  },
  {
    id: "page-02",
    movementId: "movement-01",
    order: 2,
    title: "Formuler",
    blocks: [{ id: "spark", type: "textarea", label: "Votre trace" }],
  },
  {
    id: "page-03",
    movementId: "movement-02",
    order: 3,
    title: "Choisir",
    blocks: [
      {
        id: "direction",
        type: "choice",
        label: "Direction",
        options: [{ id: "open", label: "Ouvrir" }],
      },
    ],
  },
  {
    id: "page-04",
    movementId: "movement-02",
    order: 4,
    title: "Retrouver",
    blocks: [
      { id: "spark-recall", type: "recall", sourceBlockId: "spark" },
      { id: "extra", type: "reveal", label: "Révéler", content: "Une note." },
      { id: "prompt", type: "promptCopy", label: "Prompt", text: "Copier ceci." },
    ],
  },
];

function createProgress(overrides = {}) {
  return createWorkshopProgress(
    {
      workshopId: "workshop-demo",
      workshopVersion: "1.0",
      pageId: "page-03",
      completed: false,
      responses: new Map([
        ["spark", "Une fenêtre éclairée"],
        ["direction", "open"],
        ["extra", true],
      ]),
      ...overrides,
    },
    () => "2026-08-19T12:00:00.000Z",
  );
}

test("WorkshopProgressStore saves and loads compatible workshop progress", () => {
  const storage = new MemoryStorage();
  const store = new WorkshopProgressStore(storage);
  const progress = createProgress();

  store.save(progress);

  assert.deepEqual(store.load("workshop-demo", "1.0", pages), progress);
  assert.equal(storage.getItem(getWorkshopProgressStorageKey("workshop-demo"))?.includes("page-03"), true);
});

test("WorkshopProgressStore isolates workshops by storage key", () => {
  const storage = new MemoryStorage();
  const store = new WorkshopProgressStore(storage);

  store.save(createProgress({ workshopId: "workshop-a", pageId: "page-02" }));
  store.save(createProgress({ workshopId: "workshop-b", pageId: "page-04", completed: true }));

  assert.equal(store.load("workshop-a", "1.0", pages)?.pageId, "page-02");
  assert.equal(store.load("workshop-b", "1.0", pages)?.pageId, "page-04");
  store.clear("workshop-a");
  assert.equal(store.load("workshop-a", "1.0", pages), null);
  assert.equal(store.load("workshop-b", "1.0", pages)?.completed, true);
});

test("WorkshopProgressStore rejects incompatible schema and workshop versions", () => {
  const storage = new MemoryStorage();
  const store = new WorkshopProgressStore(storage);
  const key = getWorkshopProgressStorageKey("workshop-demo");

  storage.setItem(key, JSON.stringify({ ...createProgress(), schemaVersion: WORKSHOP_PROGRESS_SCHEMA_VERSION + 1 }));
  assert.equal(store.load("workshop-demo", "1.0", pages), null);

  storage.setItem(key, JSON.stringify(createProgress({ workshopVersion: "2.0" })));
  assert.equal(store.load("workshop-demo", "1.0", pages), null);
});

test("WorkshopProgressStore ignores corrupt JSON, invalid structures, and unknown pages", () => {
  const storage = new MemoryStorage();
  const store = new WorkshopProgressStore(storage);
  const key = getWorkshopProgressStorageKey("workshop-demo");

  storage.setItem(key, "{");
  assert.equal(store.load("workshop-demo", "1.0", pages), null);

  storage.setItem(key, JSON.stringify({ ...createProgress(), completed: "false" }));
  assert.equal(store.load("workshop-demo", "1.0", pages), null);

  storage.setItem(key, JSON.stringify(createProgress({ pageId: "removed-page" })));
  assert.equal(store.load("workshop-demo", "1.0", pages), null);
});

test("WorkshopProgressStore keeps only safe response values for existing persistable blocks", () => {
  const storage = new MemoryStorage();
  const store = new WorkshopProgressStore(storage);
  const key = getWorkshopProgressStorageKey("workshop-demo");
  const progress = {
    ...createProgress(),
    responses: {
      spark: "<script>alert('x')</script>",
      direction: "open",
      extra: true,
      prompt: "must not be persisted",
      unknown: "ignored",
      intro: "text blocks are not responses",
      malformedReveal: "true",
    },
  };

  storage.setItem(key, JSON.stringify(progress));

  assert.deepEqual(store.load("workshop-demo", "1.0", pages)?.responses, {
    spark: "<script>alert('x')</script>",
    direction: "open",
    extra: true,
  });
});

test("WorkshopProgressStore remains non-blocking when storage is unavailable", () => {
  assert.equal(new WorkshopProgressStore(null).load("workshop-demo", "1.0", pages), null);

  const store = new WorkshopProgressStore(new ThrowingStorage());
  assert.equal(store.load("workshop-demo", "1.0", pages), null);
  assert.doesNotThrow(() => store.save(createProgress()));
  assert.doesNotThrow(() => store.clear("workshop-demo"));
});
