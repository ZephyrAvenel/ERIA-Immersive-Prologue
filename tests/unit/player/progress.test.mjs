import assert from "node:assert/strict";
import test from "node:test";
import {
  READING_PROGRESS_SCHEMA_VERSION,
  ReadingProgressStore,
  createReadingProgress,
  getReadingProgressStorageKey,
  resolveProgressSceneIndex,
} from "../../../.test-build/apps/player/src/progress.js";

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

class UnavailableStorage {
  getItem() {
    throw new Error("storage unavailable");
  }

  setItem() {
    throw new Error("storage unavailable");
  }

  removeItem() {
    throw new Error("storage unavailable");
  }
}

function createStoredProgress(overrides = {}) {
  return {
    schemaVersion: READING_PROGRESS_SCHEMA_VERSION,
    packId: "pack-a",
    packVersion: "1.0",
    sceneId: "scene-04",
    sceneIndex: 3,
    updatedAt: "2026-07-29T10:00:00.000Z",
    completed: false,
    ...overrides,
  };
}

test("ReadingProgressStore returns null when no progress exists", () => {
  const store = new ReadingProgressStore(new MemoryStorage());

  assert.equal(store.load("pack-a"), null);
});

test("ReadingProgressStore saves and loads valid progress by pack id", () => {
  const storage = new MemoryStorage();
  const store = new ReadingProgressStore(storage);
  const progress = createStoredProgress();

  store.save(progress);

  assert.deepEqual(store.load("pack-a"), progress);
  assert.equal(store.load("pack-b"), null);
  assert.equal(storage.getItem(getReadingProgressStorageKey("pack-a"))?.includes("scene-04"), true);
});

test("ReadingProgressStore ignores corrupt or structurally invalid JSON", () => {
  const storage = new MemoryStorage();
  const store = new ReadingProgressStore(storage);
  storage.setItem(getReadingProgressStorageKey("pack-a"), "{");

  assert.equal(store.load("pack-a"), null);

  storage.setItem(
    getReadingProgressStorageKey("pack-a"),
    JSON.stringify(createStoredProgress({ sceneIndex: -1 })),
  );
  assert.equal(store.load("pack-a"), null);
});

test("ReadingProgressStore stays non-blocking when storage is unavailable", () => {
  const store = new ReadingProgressStore(new UnavailableStorage());

  assert.equal(store.load("pack-a"), null);
  assert.doesNotThrow(() => store.save(createStoredProgress()));
  assert.doesNotThrow(() => store.clear("pack-a"));
});

test("ReadingProgressStore isolates multiple packs and clears only the requested key", () => {
  const storage = new MemoryStorage();
  const store = new ReadingProgressStore(storage);

  store.save(createStoredProgress({ packId: "pack-a", sceneId: "scene-02", sceneIndex: 1 }));
  store.save(createStoredProgress({ packId: "pack-b", sceneId: "scene-06", sceneIndex: 5 }));
  store.clear("pack-a");

  assert.equal(store.load("pack-a"), null);
  assert.equal(store.load("pack-b")?.sceneId, "scene-06");
});

test("resolveProgressSceneIndex falls back when a stored scene was removed", () => {
  const progress = createStoredProgress({ sceneId: "removed-scene", sceneIndex: 3 });

  assert.equal(resolveProgressSceneIndex(progress, [{ id: "scene-01" }, { id: "scene-02" }]), null);
});

test("resolveProgressSceneIndex trusts sceneId over a stale stored index", () => {
  const progress = createStoredProgress({ sceneId: "scene-04", sceneIndex: 0 });

  assert.equal(
    resolveProgressSceneIndex(progress, [
      { id: "scene-01" },
      { id: "scene-02" },
      { id: "scene-03" },
      { id: "scene-04" },
    ]),
    3,
  );
});

test("createReadingProgress marks completed readings deterministically", () => {
  assert.deepEqual(
    createReadingProgress(
      {
        packId: "pack-a",
        packVersion: "1.0",
        sceneId: "scene-08",
        sceneIndex: 7,
        completed: true,
      },
      () => "2026-07-29T12:00:00.000Z",
    ),
    createStoredProgress({
      sceneId: "scene-08",
      sceneIndex: 7,
      updatedAt: "2026-07-29T12:00:00.000Z",
      completed: true,
    }),
  );
});
