import assert from "node:assert/strict";
import test from "node:test";
import {
  PUBLIC_THRESHOLD_SKIP_HOME_INTRO_KEY,
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

  removeItem(key) {
    this.items.delete(key);
  }
}

class UnavailableStorage {
  getItem() {
    throw new Error("unavailable");
  }

  setItem() {
    throw new Error("unavailable");
  }

  removeItem() {
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
  assert.doesNotThrow(() => session.markHomeIntroSkippedOnce());
  assert.equal(session.consumeHomeIntroSkip(), false);
});

test("PublicThresholdSession marks the home intro skip only after the public threshold is crossed", () => {
  const storage = new MemoryStorage();
  const session = new PublicThresholdSession(storage);

  session.markHomeIntroSkippedOnce();
  assert.equal(storage.getItem(PUBLIC_THRESHOLD_SKIP_HOME_INTRO_KEY), null);

  session.markCrossed();
  session.markHomeIntroSkippedOnce();

  assert.equal(storage.getItem(PUBLIC_THRESHOLD_SKIP_HOME_INTRO_KEY), "pending");
});

test("PublicThresholdSession consumes the home intro skip once", () => {
  const storage = new MemoryStorage();
  const session = new PublicThresholdSession(storage);

  session.markCrossed();
  session.markHomeIntroSkippedOnce();

  assert.equal(session.consumeHomeIntroSkip(), true);
  assert.equal(storage.getItem(PUBLIC_THRESHOLD_SKIP_HOME_INTRO_KEY), null);
  assert.equal(session.consumeHomeIntroSkip(), false);
});
