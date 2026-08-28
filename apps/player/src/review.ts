import registry from "./review-registry.json" with { type: "json" };

export type ReviewIssueStatus = "published" | "planned";

export interface ReviewIssue {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly subtitle?: string;
  readonly status: ReviewIssueStatus;
  readonly coverImage?: string;
  readonly coverImageAlt: string;
  readonly url: string;
  readonly language: string;
  readonly publishedAt?: string;
}

export interface ReviewRegistry {
  readonly format: "living-review-registry";
  readonly version: "1.0";
  readonly issues: readonly ReviewIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isHttpUrl(value: unknown): value is string {
  if (!nonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPublishedDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateReviewRegistry(value: unknown): ReviewRegistry {
  if (
    !isRecord(value) ||
    value.format !== "living-review-registry" ||
    value.version !== "1.0" ||
    !Array.isArray(value.issues)
  ) {
    throw new Error("INE_REVIEW_REGISTRY_INVALID");
  }

  if (
    value.issues.length === 0 ||
    !value.issues.every((issue) => {
      if (
        !isRecord(issue) ||
        !nonEmptyString(issue.id) ||
        typeof issue.number !== "number" ||
        !Number.isInteger(issue.number) ||
        issue.number <= 0 ||
        !nonEmptyString(issue.title) ||
        (issue.status !== "published" && issue.status !== "planned") ||
        !nonEmptyString(issue.coverImageAlt) ||
        !isHttpUrl(issue.url) ||
        !nonEmptyString(issue.language)
      ) {
        return false;
      }

      if ("subtitle" in issue && issue.subtitle !== undefined && !nonEmptyString(issue.subtitle)) return false;
      if ("coverImage" in issue && issue.coverImage !== undefined && !isHttpUrl(issue.coverImage)) return false;
      if ("publishedAt" in issue && issue.publishedAt !== undefined && !isPublishedDate(issue.publishedAt)) {
        return false;
      }

      return true;
    })
  ) {
    throw new Error("INE_REVIEW_ISSUES_INVALID");
  }

  const issueIds = new Set(value.issues.map((issue) => (issue as ReviewIssue).id));
  if (issueIds.size !== value.issues.length) throw new Error("INE_REVIEW_ISSUE_DUPLICATE");

  const issueNumbers = new Set(value.issues.map((issue) => (issue as ReviewIssue).number));
  if (issueNumbers.size !== value.issues.length) throw new Error("INE_REVIEW_ISSUE_NUMBER_DUPLICATE");

  return value as unknown as ReviewRegistry;
}

export const reviewRegistry = validateReviewRegistry(registry);

export function publishedReviewIssues(): readonly ReviewIssue[] {
  return reviewRegistry.issues.filter((issue) => issue.status === "published");
}
