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
        description: "Écrire avec l’IA sans lui abandonner sa voix.",
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
