import assert from "node:assert/strict";
import test from "node:test";
import {
  publishedReviewIssues,
  reviewRegistry,
  validateReviewRegistry,
} from "../../../.test-build/apps/player/src/review.js";

test("review registry exposes the three published issues", () => {
  assert.equal(reviewRegistry.format, "living-review-registry");
  assert.equal(reviewRegistry.version, "1.0");
  assert.deepEqual(
    publishedReviewIssues().map(({ id, number, title, status, url, language }) => ({
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

test("review registry validates issue metadata without requiring duplicated covers", () => {
  assert.doesNotThrow(() => validateReviewRegistry(reviewRegistry));
  assert.equal(reviewRegistry.issues[0].coverImage?.endsWith("/rv-n01-cover.webp"), true);
  assert.equal("coverImage" in reviewRegistry.issues[1], false);
  assert.equal("coverImage" in reviewRegistry.issues[2], false);
});

test("review registry rejects invalid issue URLs and duplicates", () => {
  const invalidUrl = structuredClone(reviewRegistry);
  invalidUrl.issues[0] = {
    ...invalidUrl.issues[0],
    url: "Numero-1.html",
  };
  assert.throws(() => validateReviewRegistry(invalidUrl), /INE_REVIEW_ISSUES_INVALID/);

  const duplicateNumber = structuredClone(reviewRegistry);
  duplicateNumber.issues[1] = {
    ...duplicateNumber.issues[1],
    number: duplicateNumber.issues[0].number,
  };
  assert.throws(() => validateReviewRegistry(duplicateNumber), /INE_REVIEW_ISSUE_NUMBER_DUPLICATE/);
});
