import assert from "node:assert/strict";
import test from "node:test";
import {
  findRegistryEntryBySlug,
  loadCatalog,
  validatePackRegistry,
} from "../../../.test-build/apps/player/src/catalog.js";

const registry = {
  format: "ine-pack-registry",
  version: "1.0",
  home: "work-one",
  packs: [
    {
      id: "work-one",
      slug: "work-one",
      manifest: "../works/work-one/pack.json",
    },
  ],
};

test("pack registry rejects duplicate routes", () => {
  assert.throws(
    () =>
      validatePackRegistry({
        ...registry,
        packs: [...registry.packs, { ...registry.packs[0], id: "work-two" }],
      }),
    /INE_PACK_REGISTRY_DUPLICATE/,
  );
});

test("pack registry rejects a missing narrative home", () => {
  assert.throws(
    () => validatePackRegistry({ ...registry, home: "missing-work" }),
    /INE_PACK_REGISTRY_HOME_MISSING/,
  );
});

test("catalog is derived from manifests and resolves cover URLs", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (source) => {
    const url = String(source);
    if (url.endsWith("/packs/index.json")) return Response.json(registry);
    if (url.endsWith("/works/work-one/pack.json")) {
      return Response.json({
        id: "work-one",
        title: "Work One",
        subtitle: "A subtitle",
        description: "A description",
        coverImage: "assets/cover.webp",
        coverImageAlt: "A cover",
      });
    }
    return new Response(null, { status: 404 });
  };

  const source = new URL("https://example.test/project/packs/index.json");
  const catalog = await loadCatalog(source);
  assert.deepEqual(catalog, [
    {
      id: "work-one",
      slug: "work-one",
      title: "Work One",
      subtitle: "A subtitle",
      description: "A description",
      coverImage: "https://example.test/project/works/work-one/assets/cover.webp",
      coverImageAlt: "A cover",
      manifestUrl: "https://example.test/project/works/work-one/pack.json",
    },
  ]);
  assert.equal(findRegistryEntryBySlug(validatePackRegistry(registry), "work-one")?.id, "work-one");
});

test("catalog rejects a registry id that differs from its manifest", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (source) =>
    String(source).endsWith("/packs/index.json")
      ? Response.json(registry)
      : Response.json({
          id: "another-work",
          title: "Work",
          subtitle: "Subtitle",
          description: "Description",
          coverImage: "cover.webp",
          coverImageAlt: "",
        });

  await assert.rejects(
    loadCatalog(new URL("https://example.test/packs/index.json")),
    /INE_CATALOG_MANIFEST_INVALID/,
  );
});
