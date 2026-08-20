import assert from "node:assert/strict";
import test from "node:test";
import {
  augmentedWorkshops,
  editorialFamilies,
  editorialRegistry,
  validateEditorialRegistry,
} from "../../../.test-build/apps/player/src/editorial.js";

test("editorial registry declares the two content families", () => {
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
        id: "augmented-workshops",
        orientation: "CRÉER",
        title: "Ateliers augmentés",
        description: "Des formations créatives pour apprendre à créer avec l’IA.",
        route: "/ateliers/",
      },
    ],
  );
});

test("editorial registry declares planned augmented workshops only", () => {
  const workshops = augmentedWorkshops("fr");
  assert.deepEqual(
    workshops.map(({ orientation, title, description, status }) => ({
      orientation,
      title,
      description,
      status,
    })),
    [
      {
        orientation: "ÉCRIRE",
        title: "Écriture augmentée",
        description: "Un atelier d’écriture en 7 mouvements pour apprendre à dialoguer avec l’IA sans lui abandonner le geste d’auteur.",
        status: "planned",
      },
      {
        orientation: "VOIR",
        title: "Art augmenté",
        description: "Créer avec l’IA sans renoncer à son regard.",
        status: "planned",
      },
      {
        orientation: "RELIER",
        title: "Cartographie augmentée",
        description: "Rendre visibles les relations avec l’IA.",
        status: "planned",
      },
      {
        orientation: "COMPOSER",
        title: "Créer un Récit Vivant avec l’IA",
        description: "Faire dialoguer écriture, image et cartographie.",
        status: "planned",
      },
    ],
  );
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
        families: [editorialRegistry.families[0], editorialRegistry.families[0]],
      }),
    /INE_EDITORIAL_FAMILY_DUPLICATE/,
  );
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
  plannedWithPublicationMetadata.workshops[0] = {
    ...plannedWithPublicationMetadata.workshops[0],
    slug: "ecriture-augmentee",
  };
  assert.throws(
    () => validateEditorialRegistry(plannedWithPublicationMetadata),
    /INE_EDITORIAL_WORKSHOPS_INVALID/,
  );
});
