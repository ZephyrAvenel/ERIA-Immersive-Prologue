import assert from "node:assert/strict";
import test from "node:test";
import {
  PUBLIC_THRESHOLD_SESSION_KEY,
  PublicThresholdSession,
} from "../../../.test-build/apps/player/src/threshold-session.js";

class MemoryStorage {
  items = new Map();

  getItem(key) {
    return this.items.get(key) ?? null;
  }

  setItem(key, value) {
    this.items.set(key, value);
  }
}

class UnavailableStorage {
  getItem() {
    throw new Error("unavailable");
  }

  setItem() {
    throw new Error("unavailable");
  }
}

test("PublicThresholdSession starts unvisited and marks the threshold as crossed", () => {
  const storage = new MemoryStorage();
  const session = new PublicThresholdSession(storage);

  assert.equal(session.hasCrossed(), false);
  session.markCrossed();

  assert.equal(storage.getItem(PUBLIC_THRESHOLD_SESSION_KEY), "crossed");
  assert.equal(session.hasCrossed(), true);
});

test("PublicThresholdSession is non-blocking when sessionStorage is unavailable", () => {
  const session = new PublicThresholdSession(new UnavailableStorage());

  assert.equal(session.hasCrossed(), false);
  assert.doesNotThrow(() => session.markCrossed());
});
