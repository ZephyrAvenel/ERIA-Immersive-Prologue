import assert from "node:assert/strict";
import test from "node:test";
import {
  WORKSHOP_IMPORT_MAX_BYTES,
  createWorkshopMarkdown,
  inspectWorkshopImport,
  serializeWorkshopExport,
  workshopExportFilename,
} from "../../../.test-build/apps/player/src/workshop-portability.js";

const pack = {
  format: "ine-workshop-pack",
  id: "workshop-demo",
  slug: "workshop-demo",
  version: "1.0",
  language: "fr",
  title: "Atelier démonstration",
  subtitle: "Tester",
  startPage: "page-01",
  movements: [{ id: "movement-01", order: 1, title: "Commencer" }],
  pages: [
    { id: "page-01", movementId: "movement-01", order: 1, title: "Entrer", blocks: [{ id: "note", type: "textarea", label: "Votre note" }] },
    { id: "page-02", movementId: "movement-01", order: 2, title: "Choisir", blocks: [{ id: "choice", type: "choice", label: "Votre choix", options: [{ id: "open", label: "Ouvrir" }] }, { id: "reveal", type: "reveal", label: "Révéler", content: "Texte" }] },
  ],
};

const progress = {
  schemaVersion: 1,
  workshopId: "workshop-demo",
  workshopVersion: "1.0",
  pageId: "page-02",
  updatedAt: "2026-10-29T10:25:00.000Z",
  completed: true,
  responses: { note: "# Titre\n```\n<texte>", choice: "open", reveal: true },
};

test("workshop portability serializes a strict JSON export and restores its preview", () => {
  const json = serializeWorkshopExport(pack, progress, () => "2026-10-29T10:30:00.000Z");
  const result = inspectWorkshopImport(json, pack);
  assert.equal(result.valid, true);
  assert.equal(result.preview.pageIndex, 1);
  assert.equal(result.preview.responseCount, 3);
  assert.equal(workshopExportFilename(pack, "json", "2026-10-29T10:30:00.000Z"), "recits-vivants-workshop-demo-parcours-2026-10-29.json");
});

test("workshop portability produces a readable Markdown without interpreting participant text", () => {
  const markdown = createWorkshopMarkdown(pack, progress, "2026-10-29T10:30:00.000Z");
  assert.match(markdown, /# Atelier démonstration — parcours personnel/);
  assert.match(markdown, /# Titre/);
  assert.match(markdown, /#### Votre note/);
  assert.match(markdown, /\*\*Votre choix :\*\* Ouvrir/);
  assert.match(markdown, /Section révélée/);
});

test("workshop portability refuses corrupt, foreign, incompatible, and invalid choice imports", () => {
  assert.deepEqual(inspectWorkshopImport("{", pack), { valid: false, reason: "invalid" });
  const base = JSON.parse(serializeWorkshopExport(pack, progress, () => "2026-10-29T10:30:00.000Z"));
  base.workshop.id = "other";
  assert.deepEqual(inspectWorkshopImport(JSON.stringify(base), pack), { valid: false, reason: "workshop" });
  base.workshop.id = pack.id;
  base.workshop.manifestVersion = "2.0";
  assert.deepEqual(inspectWorkshopImport(JSON.stringify(base), pack), { valid: false, reason: "version" });
  base.workshop.manifestVersion = pack.version;
  base.progress.responses.choice = "missing";
  assert.deepEqual(inspectWorkshopImport(JSON.stringify(base), pack), { valid: false, reason: "invalid" });
  assert.equal(WORKSHOP_IMPORT_MAX_BYTES, 2_097_152);
});
