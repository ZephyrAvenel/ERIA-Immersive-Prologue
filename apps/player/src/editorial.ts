import registry from "./editorial-registry.json" with { type: "json" };

export type EditorialLanguage = "fr" | "en";
export type EditorialFamilyId = "narrative-packs" | "living-review" | "augmented-workshops";
export type EditorialStatus = "planned" | "published";

const requiredEditorialFamilies: readonly EditorialFamilyId[] = [
  "narrative-packs",
  "living-review",
  "augmented-workshops",
];

export interface EditorialLabels {
  readonly orientation: string;
  readonly title: string;
  readonly description: string;
}

interface LocalizedEditorialLabels {
  readonly fr: EditorialLabels;
  readonly en: EditorialLabels;
}

export interface EditorialFamily {
  readonly id: EditorialFamilyId;
  readonly route: string;
  readonly labels: LocalizedEditorialLabels;
}

interface AugmentedWorkshopBase {
  readonly id: string;
  readonly family: "augmented-workshops";
  readonly status: EditorialStatus;
  readonly labels: LocalizedEditorialLabels;
}

export interface PlannedAugmentedWorkshop extends AugmentedWorkshopBase {
  readonly status: "planned";
}

export interface PublishedAugmentedWorkshop extends AugmentedWorkshopBase {
  readonly status: "published";
  readonly slug: string;
  readonly manifest: string;
  readonly coverImage: string;
  readonly coverImageAlt: string;
}

export type AugmentedWorkshop = PlannedAugmentedWorkshop | PublishedAugmentedWorkshop;

export interface EditorialRegistry {
  readonly format: "ine-editorial-registry";
  readonly version: "1.0";
  readonly families: readonly EditorialFamily[];
  readonly workshops: readonly AugmentedWorkshop[];
}

export interface LocalizedEditorialFamily {
  readonly id: EditorialFamilyId;
  readonly route: string;
  readonly orientation: string;
  readonly title: string;
  readonly description: string;
}

export interface LocalizedAugmentedWorkshop {
  readonly id: string;
  readonly family: "augmented-workshops";
  readonly status: EditorialStatus;
  readonly slug?: string;
  readonly manifest?: string;
  readonly coverImage?: string;
  readonly coverImageAlt?: string;
  readonly orientation: string;
  readonly title: string;
  readonly description: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isRouteSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isInternalPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !/^[a-z][a-z0-9+.-]*:/i.test(value) &&
    !value.startsWith("/") &&
    !value.includes("..") &&
    !value.includes("?") &&
    !value.includes("#")
  );
}

function isWorkshopManifestPath(value: unknown): value is string {
  return isInternalPath(value) && value.endsWith("/pack.json");
}

function hasLabels(value: unknown): value is LocalizedEditorialLabels {
  if (!isRecord(value)) return false;
  return ["fr", "en"].every((language) => {
    const labels = value[language];
    return (
      isRecord(labels) &&
      nonEmptyString(labels.orientation) &&
      nonEmptyString(labels.title) &&
      nonEmptyString(labels.description)
    );
  });
}

export function validateEditorialRegistry(value: unknown): EditorialRegistry {
  if (
    !isRecord(value) ||
    value.format !== "ine-editorial-registry" ||
    value.version !== "1.0" ||
    !Array.isArray(value.families) ||
    !Array.isArray(value.workshops)
  ) {
    throw new Error("INE_EDITORIAL_REGISTRY_INVALID");
  }

  const families = value.families;
  if (
    families.length !== requiredEditorialFamilies.length ||
    !families.every(
      (family) =>
        isRecord(family) &&
        requiredEditorialFamilies.includes(family.id as EditorialFamilyId) &&
        nonEmptyString(family.route) &&
        hasLabels(family.labels),
    )
  ) {
    throw new Error("INE_EDITORIAL_FAMILIES_INVALID");
  }

  const familyIds = new Set(families.map((family) => (family as EditorialFamily).id));
  if (familyIds.size !== families.length) throw new Error("INE_EDITORIAL_FAMILY_DUPLICATE");
  if (!requiredEditorialFamilies.every((familyId) => familyIds.has(familyId))) {
    throw new Error("INE_EDITORIAL_REQUIRED_FAMILY_MISSING");
  }
  if (!requiredEditorialFamilies.every((familyId, index) => (families[index] as EditorialFamily).id === familyId)) {
    throw new Error("INE_EDITORIAL_FAMILY_ORDER_INVALID");
  }

  const workshops = value.workshops;
  if (
    workshops.length !== 4 ||
    !workshops.every((workshop) => {
      if (
        !isRecord(workshop) ||
        !nonEmptyString(workshop.id) ||
        workshop.family !== "augmented-workshops" ||
        !hasLabels(workshop.labels)
      ) {
        return false;
      }

      if (workshop.status === "planned") {
        return (
          !("slug" in workshop) &&
          !("manifest" in workshop) &&
          !("coverImage" in workshop) &&
          !("coverImageAlt" in workshop)
        );
      }

      if (workshop.status === "published") {
        return (
          isRouteSlug(workshop.slug) &&
          isWorkshopManifestPath(workshop.manifest) &&
          isInternalPath(workshop.coverImage) &&
          nonEmptyString(workshop.coverImageAlt)
        );
      }

      return false;
    })
  ) {
    throw new Error("INE_EDITORIAL_WORKSHOPS_INVALID");
  }

  const workshopIds = new Set(workshops.map((workshop) => (workshop as AugmentedWorkshop).id));
  if (workshopIds.size !== workshops.length) throw new Error("INE_EDITORIAL_WORKSHOP_DUPLICATE");

  return value as unknown as EditorialRegistry;
}

export function resolveEditorialLanguage(language: string): EditorialLanguage {
  return language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export function localizedFamily(
  family: EditorialFamily,
  language: string,
): LocalizedEditorialFamily {
  const labels = family.labels[resolveEditorialLanguage(language)];
  return {
    id: family.id,
    route: family.route,
    ...labels,
  };
}

export function localizedWorkshop(
  workshop: AugmentedWorkshop,
  language: string,
): LocalizedAugmentedWorkshop {
  const labels = workshop.labels[resolveEditorialLanguage(language)];
  return {
    id: workshop.id,
    family: workshop.family,
    status: workshop.status,
    ...(workshop.status === "published"
      ? {
          slug: workshop.slug,
          manifest: workshop.manifest,
          coverImage: workshop.coverImage,
          coverImageAlt: workshop.coverImageAlt,
        }
      : {}),
    ...labels,
  };
}

export const editorialRegistry = validateEditorialRegistry(registry);

export function editorialFamilies(language: string): readonly LocalizedEditorialFamily[] {
  return editorialRegistry.families.map((family) => localizedFamily(family, language));
}

export function augmentedWorkshops(language: string): readonly LocalizedAugmentedWorkshop[] {
  return editorialRegistry.workshops.map((workshop) => localizedWorkshop(workshop, language));
}

export function publishedAugmentedWorkshops(): readonly PublishedAugmentedWorkshop[] {
  return editorialRegistry.workshops.filter(
    (workshop): workshop is PublishedAugmentedWorkshop => workshop.status === "published",
  );
}

export function findPublishedAugmentedWorkshopBySlug(slug: string): PublishedAugmentedWorkshop | undefined {
  return publishedAugmentedWorkshops().find((workshop) => workshop.slug === slug);
}
