import assert from "node:assert/strict";
import test from "node:test";
import {
  augmentedWorkshops,
  editorialFamilies,
  editorialRegistry,
  findPublishedAugmentedWorkshopBySlug,
  publishedAugmentedWorkshops,
  validateEditorialRegistry,
} from "../../../.test-build/apps/player/src/editorial.js";

test("editorial registry declares the three content families in editorial order", () => {
  const families = editorialFamilies("fr");
  assert.deepEqual(
    families.map(({ id, orientation, title, description, route }) => ({
      id,
      orientation,
      title,
      description,
      route,
    })),
    [
      {
        id: "narrative-packs",
        orientation: "VIVRE",
        title: "Packs narratifs",
        description: "Des expériences narratives à traverser.",
        route: "/bibliotheque/",
      },
      {
        id: "living-review",
        orientation: "PENSER",
        title: "Récits Vivants · La Revue",
        description: "Des questions à explorer pour déplacer notre manière de voir.",
        route: "/revue/",
      },
      {
        id: "augmented-workshops",
        orientation: "CRÉER",
        title: "Ateliers augmentés",
        description: "Des formations créatives pour apprendre à créer avec l’IA.",
        route: "/ateliers/",
      },
    ],
  );
});

test("editorial registry localizes the living review family in English", () => {
  const families = editorialFamilies("en");
  assert.deepEqual(
    families.map(({ id, orientation, title, description, route }) => ({
      id,
      orientation,
      title,
      description,
      route,
    })),
    [
      {
        id: "narrative-packs",
        orientation: "LIVE",
        title: "Narrative Packs",
        description: "Narrative experiences to journey through.",
        route: "/bibliotheque/",
      },
      {
        id: "living-review",
        orientation: "THINK",
        title: "Living Stories · The Review",
        description: "Questions to explore and shift the way we see.",
        route: "/revue/",
      },
      {
        id: "augmented-workshops",
        orientation: "CREATE",
        title: "Augmented workshops",
        description: "Creative learning paths for learning to create with AI.",
        route: "/ateliers/",
      },
    ],
  );
});

test("editorial registry declares the published augmented workshops", () => {
  const workshops = augmentedWorkshops("fr");
  assert.deepEqual(
    workshops.map(({ orientation, title, description, status, slug, manifest, coverImage, coverImageAlt }) => ({
      orientation,
      title,
      description,
      status,
      slug,
      manifest,
      coverImage,
      coverImageAlt,
    })),
    [
      {
        orientation: "ÉCRIRE",
        title: "Écriture augmentée",
        description: "Un atelier d’écriture en 7 mouvements pour apprendre à dialoguer avec l’IA sans lui abandonner le geste d’auteur.",
        status: "published",
        slug: "ecriture-augmentee",
        manifest: "packs/workshop-001-ecriture-augmentee/pack.json",
        coverImage: "packs/workshop-001-ecriture-augmentee/assets/images/00-couverture-ecriture-augmentee.webp",
        coverImageAlt:
          "Couverture verticale de l'atelier Écriture augmentée montrant un carnet ouvert, une plume et des lettres lumineuses près d'une fenêtre.",
      },
      {
        orientation: "RELIER",
        title: "Cartographie augmentée",
        description: "Rendre visibles les relations avec l’IA.",
        status: "published",
        slug: "cartographie-augmentee",
        manifest: "packs/workshop-002-cartographie-augmentee/pack.json",
        coverImage: "packs/workshop-002-cartographie-augmentee/assets/images/00-couverture-cartographie-augmentee.png",
        coverImageAlt:
          "Cartographie augmentée — couverture du pack montrant une carte narrative lumineuse avec idées, liens, territoires et relations, dans l’univers visuel des Récits Vivants.",
      },
      {
        orientation: "VOIR",
        title: "Art augmenté",
        description: "Créer avec l’IA sans renoncer à son regard.",
        status: "published",
        slug: "art-augmente",
        manifest: "packs/workshop-003-art-augmente/pack.json",
        coverImage: "packs/workshop-003-art-augmente/assets/images/00-couverture-art-augmente.png",
        coverImageAlt:
          "Couverture d’Art augmenté — un atelier visuel nocturne où plusieurs images et variations sont comparées autour d’une image centrale lumineuse.",
      },
      {
        orientation: "CLARIFIER",
        title: "Clarification augmentée",
        description: "Voir plus précisément sans réduire la complexité.",
        status: "published",
        slug: "clarification-augmentee",
        manifest: "packs/workshop-004-clarification-augmentee/pack.json",
        coverImage: "packs/workshop-004-clarification-augmentee/assets/images/00-couverture-clarification-augmentee.png",
        coverImageAlt:
          "Couverture de Clarification augmentée — une constellation de fragments, images et notes reliés autour d’un noyau lumineux qui rend l’ensemble plus lisible sans effacer sa complexité.",
      },
      {
        orientation: "COMPOSER",
        title: "Créer un Récit Vivant avec l’IA",
        description: "Faire dialoguer écriture, image et cartographie.",
        status: "planned",
        slug: undefined,
        manifest: undefined,
        coverImage: undefined,
        coverImageAlt: undefined,
      },
    ],
  );
});

test("editorial registry resolves only published workshops by canonical slug", () => {
  assert.deepEqual(
    publishedAugmentedWorkshops().map(({ id, slug, manifest }) => ({ id, slug, manifest })),
    [
      {
        id: "ecriture-augmentee",
        slug: "ecriture-augmentee",
        manifest: "packs/workshop-001-ecriture-augmentee/pack.json",
      },
      {
        id: "cartographie-augmentee",
        slug: "cartographie-augmentee",
        manifest: "packs/workshop-002-cartographie-augmentee/pack.json",
      },
      {
        id: "art-augmente",
        slug: "art-augmente",
        manifest: "packs/workshop-003-art-augmente/pack.json",
      },
      {
        id: "clarification-augmentee",
        slug: "clarification-augmentee",
        manifest: "packs/workshop-004-clarification-augmentee/pack.json",
      },
    ],
  );

  const writingWorkshop = findPublishedAugmentedWorkshopBySlug("ecriture-augmentee");
  assert.equal(writingWorkshop?.id, "ecriture-augmentee");
  assert.equal(writingWorkshop?.manifest, "packs/workshop-001-ecriture-augmentee/pack.json");
  const mappingWorkshop = findPublishedAugmentedWorkshopBySlug("cartographie-augmentee");
  assert.equal(mappingWorkshop?.id, "cartographie-augmentee");
  assert.equal(mappingWorkshop?.manifest, "packs/workshop-002-cartographie-augmentee/pack.json");
  const artWorkshop = findPublishedAugmentedWorkshopBySlug("art-augmente");
  assert.equal(artWorkshop?.id, "art-augmente");
  assert.equal(artWorkshop?.manifest, "packs/workshop-003-art-augmente/pack.json");
  const clarificationWorkshop = findPublishedAugmentedWorkshopBySlug("clarification-augmentee");
  assert.equal(clarificationWorkshop?.id, "clarification-augmentee");
  assert.equal(clarificationWorkshop?.manifest, "packs/workshop-004-clarification-augmentee/pack.json");
  assert.equal(findPublishedAugmentedWorkshopBySlug("slug-inconnu"), undefined);
});

test("editorial registry keeps planned workshops without public routes", () => {
  const planned = editorialRegistry.workshops.filter((workshop) => workshop.status === "planned");
  assert.deepEqual(
    planned.map((workshop) => workshop.id),
    ["composer-recit-vivant-ia"],
  );
  for (const workshop of planned) {
    assert.equal("slug" in workshop, false);
    assert.equal("manifest" in workshop, false);
    assert.equal("coverImage" in workshop, false);
    assert.equal("coverImageAlt" in workshop, false);
  }
});

test("editorial registry rejects duplicate or missing family declarations", () => {
  assert.throws(
    () => validateEditorialRegistry({ ...editorialRegistry, families: [editorialRegistry.families[0]] }),
    /INE_EDITORIAL_FAMILIES_INVALID/,
  );
  assert.throws(
    () =>
      validateEditorialRegistry({
        ...editorialRegistry,
        families: [editorialRegistry.families[0], editorialRegistry.families[0], editorialRegistry.families[2]],
      }),
    /INE_EDITORIAL_FAMILY_DUPLICATE/,
  );
});

test("editorial registry rejects families declared out of order", () => {
  const registry = structuredClone(editorialRegistry);
  registry.families = [registry.families[1], registry.families[0], registry.families[2]];
  assert.throws(() => validateEditorialRegistry(registry), /INE_EDITORIAL_FAMILY_ORDER_INVALID/);
});

test("editorial registry accepts a complete published workshop contract", () => {
  const registry = structuredClone(editorialRegistry);
  registry.workshops[0] = {
    ...registry.workshops[0],
    status: "published",
    slug: "ecriture-augmentee",
    manifest: "packs/workshop-001-ecriture-augmentee/pack.json",
    coverImage: "packs/workshop-001-ecriture-augmentee/assets/images/00-couverture-ecriture-augmentee.webp",
    coverImageAlt: "Couverture du workshop Écriture augmentée.",
  };

  const validated = validateEditorialRegistry(registry);
  assert.equal(validated.workshops[0].status, "published");
  assert.equal(validated.workshops[0].slug, "ecriture-augmentee");
});

test("editorial registry requires publication metadata only for published workshops", () => {
  assert.doesNotThrow(() => validateEditorialRegistry(editorialRegistry));

  for (const field of ["slug", "manifest", "coverImage", "coverImageAlt"]) {
    const registry = structuredClone(editorialRegistry);
    registry.workshops[0] = {
      ...registry.workshops[0],
      status: "published",
      slug: "ecriture-augmentee",
      manifest: "packs/workshop-001-ecriture-augmentee/pack.json",
      coverImage: "packs/workshop-001-ecriture-augmentee/assets/images/00-couverture-ecriture-augmentee.webp",
      coverImageAlt: "Couverture du workshop Écriture augmentée.",
    };
    delete registry.workshops[0][field];
    assert.throws(() => validateEditorialRegistry(registry), /INE_EDITORIAL_WORKSHOPS_INVALID/, field);
  }
});

test("editorial registry rejects invalid workshop publication states", () => {
  for (const status of ["public", "ready", "draft", "active"]) {
    const registry = structuredClone(editorialRegistry);
    registry.workshops[0] = { ...registry.workshops[0], status };
    assert.throws(() => validateEditorialRegistry(registry), /INE_EDITORIAL_WORKSHOPS_INVALID/, status);
  }

  for (const [field, value] of [
    ["slug", ""],
    ["slug", "https://example.test/ecriture-augmentee"],
    ["slug", "ecriture-augmentee?preview=1"],
    ["manifest", ""],
    ["manifest", "https://example.test/pack.json"],
    ["manifest", "packs/workshop-001-ecriture-augmentee/pack.json?preview=1"],
    ["coverImage", ""],
    ["coverImage", "/packs/workshop-001-ecriture-augmentee/assets/images/00-couverture-ecriture-augmentee.webp"],
    ["coverImage", "packs/workshop-001-ecriture-augmentee/assets/images/00-couverture-ecriture-augmentee.webp#cover"],
    ["coverImageAlt", ""],
  ]) {
    const registry = structuredClone(editorialRegistry);
    registry.workshops[0] = {
      ...registry.workshops[0],
      status: "published",
      slug: "ecriture-augmentee",
      manifest: "packs/workshop-001-ecriture-augmentee/pack.json",
      coverImage: "packs/workshop-001-ecriture-augmentee/assets/images/00-couverture-ecriture-augmentee.webp",
      coverImageAlt: "Couverture du workshop Écriture augmentée.",
      [field]: value,
    };
    assert.throws(() => validateEditorialRegistry(registry), /INE_EDITORIAL_WORKSHOPS_INVALID/, `${field}:${value}`);
  }

  const plannedWithPublicationMetadata = structuredClone(editorialRegistry);
  plannedWithPublicationMetadata.workshops[4] = {
    ...plannedWithPublicationMetadata.workshops[4],
    slug: "composer-recit-vivant-ia",
  };
  assert.throws(
    () => validateEditorialRegistry(plannedWithPublicationMetadata),
    /INE_EDITORIAL_WORKSHOPS_INVALID/,
  );
});
