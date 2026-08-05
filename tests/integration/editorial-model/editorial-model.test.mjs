import assert from "node:assert/strict";
import test from "node:test";
import { readProjectJson } from "../../helpers/fixtures.mjs";

test("published works expose the common library identity without deployment metadata", async () => {
  const manifests = [
    await readProjectJson("examples", "demo-pack", "pack.json"),
    await readProjectJson("packs", "pack-002-polarites-vivantes", "pack.json"),
    await readProjectJson("packs", "pack-003-atlas-recits-vivants", "pack.json"),
    await readProjectJson("packs", "pack-004-voie-du-milieu", "pack.json"),
    await readProjectJson("packs", "pack-005-recits-qui-revelent-ou-enferment", "pack.json"),
    await readProjectJson("packs", "pack-006-la-metamorphose", "pack.json"),
    await readProjectJson("packs", "pack-007-jouer-pour-devenir", "pack.json"),
    await readProjectJson("packs", "pack-008-le-veilleur", "pack.json"),
    await readProjectJson("packs", "pack-009-trouver-sa-juste-place", "pack.json"),
    await readProjectJson("packs", "pack-010-le-monde-commun", "pack.json"),
  ];

  for (const manifest of manifests) {
    for (const field of [
      "id",
      "title",
      "subtitle",
      "description",
      "version",
      "language",
      "coverImage",
      "coverImageAlt",
    ]) {
      assert.equal(typeof manifest[field], "string", `${manifest.id}.${field}`);
    }
    assert.equal("slug" in manifest, false, `${manifest.id} must not own its deployment slug`);
    assert.equal("canonicalUrl" in manifest, false, `${manifest.id} must not own its canonical URL`);
  }
});

test("editorial metadata reference keeps author-universe links in one typed collection", async () => {
  const schema = await readProjectJson("schemas", "editorial-metadata.schema.json");
  const example = await readProjectJson("examples", "editorial-metadata.example.json");
  const connectionSchema = schema.$defs.connection;

  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(connectionSchema.required, ["kind", "title"]);
  assert.deepEqual(connectionSchema.properties.kind.enum, [
    "book",
    "article",
    "immersive-work",
    "eria",
    "author-site",
  ]);
  assert.equal(Array.isArray(example.connections), true);
  assert.equal(example.connections.length, 2);
  assert.equal(example.connections.some(({ targetWorkId }) => typeof targetWorkId === "string"), true);
  assert.equal(example.connections.some(({ url }) => typeof url === "string"), true);
  assert.equal("relatedBooks" in example, false);
  assert.equal("relatedArticles" in example, false);
});

test("editorial publication and discovery metadata remain optional and static-hosting friendly", async () => {
  const schema = await readProjectJson("schemas", "editorial-metadata.schema.json");
  const example = await readProjectJson("examples", "editorial-metadata.example.json");

  assert.equal("required" in schema, false);
  assert.equal(schema.properties.discovery.properties.seoDescription.maxLength, 180);
  assert.match(example.publication.createdAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(example.publication.publishedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(example.presentation.estimatedDurationMinutes > 0, true);
  assert.equal(
    example.resources.every(({ url }) => !url.startsWith("/") && !url.startsWith("file:")),
    true,
  );
});
