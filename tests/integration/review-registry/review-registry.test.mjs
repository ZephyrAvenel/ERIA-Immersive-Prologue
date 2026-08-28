import assert from "node:assert/strict";
import test from "node:test";
import { readProjectJson } from "../../helpers/fixtures.mjs";

test("living review registry declares the published external issues", async () => {
  const registry = await readProjectJson("apps", "player", "src", "review-registry.json");
  assert.equal(registry.format, "living-review-registry");
  assert.equal(registry.version, "1.0");
  assert.deepEqual(
    registry.issues.map(({ id, number, title, status, url, language }) => ({
      id,
      number,
      title,
      status,
      url,
      language,
    })),
    [
      {
        id: "rv-review-001",
        number: 1,
        title: "Habiter le désaccord",
        status: "published",
        url: "https://zephyravenel.github.io/Recits-Vivants-Revue/Numero-1.html",
        language: "fr",
      },
      {
        id: "rv-review-002",
        number: 2,
        title: "La carte n’est pas le territoire",
        status: "published",
        url: "https://zephyravenel.github.io/Recits-Vivants-Revue/Numero-2.html",
        language: "fr",
      },
      {
        id: "rv-review-003",
        number: 3,
        title: "Ce qui nous échappe",
        status: "published",
        url: "https://zephyravenel.github.io/Recits-Vivants-Revue/Numero-3.html",
        language: "fr",
      },
    ],
  );
});

test("living review registry remains a threshold and does not duplicate issue HTML", async () => {
  const registry = await readProjectJson("apps", "player", "src", "review-registry.json");
  const publishedIssues = registry.issues.filter(({ status }) => status === "published");
  assert.equal(publishedIssues.length, 3);
  assert.equal(
    publishedIssues.every(({ url }) => new URL(url).hostname === "zephyravenel.github.io"),
    true,
  );
  assert.equal(
    publishedIssues.every(({ url }) => url.includes("/Recits-Vivants-Revue/Numero-")),
    true,
  );
});
