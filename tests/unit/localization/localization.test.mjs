import assert from "node:assert/strict";
import test from "node:test";
import { interpolate, locales, resolveLocale } from "../../../.test-build/apps/player/src/localization.js";

test("localization selects French and English from a pack language", () => {
  assert.equal(resolveLocale("fr").previous, "Précédent");
  assert.equal(resolveLocale("fr-FR").next, "Suivant");
  assert.equal(resolveLocale("en").previous, "Previous");
});

test("localization falls back to English for an unsupported language", () => {
  assert.equal(resolveLocale("ja").language, "en");
});

test("locales expose the same required keys", () => {
  assert.deepEqual(Object.keys(locales.fr).sort(), Object.keys(locales.en).sort());
});

test("French locale contains no English navigation strings", () => {
  const french = Object.values(locales.fr).join(" ");
  assert.equal(french.includes("Previous"), false);
  assert.equal(french.includes("Next"), false);
  assert.equal(french.includes("Unable to load"), false);
});

test("interpolate replaces named values deterministically", () => {
  assert.equal(interpolate("Scène {current} / {total}", { current: 3, total: 8 }), "Scène 3 / 8");
});
