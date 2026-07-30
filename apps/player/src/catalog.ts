export interface PackRegistryEntry {
  readonly id: string;
  readonly slug: string;
  readonly manifest: string;
}

export interface PackRegistry {
  readonly format: "ine-pack-registry";
  readonly version: "1.0";
  readonly home: string;
  readonly packs: readonly PackRegistryEntry[];
}

export interface CatalogPack {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly coverImage: string;
  readonly coverImageAlt: string;
  readonly manifestUrl: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function validatePackRegistry(value: unknown): PackRegistry {
  if (
    !isRecord(value) ||
    value.format !== "ine-pack-registry" ||
    value.version !== "1.0" ||
    !nonEmptyString(value.home) ||
    !Array.isArray(value.packs) ||
    !value.packs.every(
      (entry) =>
        isRecord(entry) &&
        nonEmptyString(entry.id) &&
        nonEmptyString(entry.slug) &&
        nonEmptyString(entry.manifest),
    )
  ) {
    throw new Error("INE_PACK_REGISTRY_INVALID");
  }

  const registry = value as unknown as PackRegistry;
  const ids = new Set(registry.packs.map(({ id }) => id));
  const slugs = new Set(registry.packs.map(({ slug }) => slug));
  if (ids.size !== registry.packs.length || slugs.size !== registry.packs.length) {
    throw new Error("INE_PACK_REGISTRY_DUPLICATE");
  }
  if (!ids.has(registry.home)) throw new Error("INE_PACK_REGISTRY_HOME_MISSING");
  return registry;
}

export async function loadPackRegistry(source: URL): Promise<PackRegistry> {
  const response = await fetch(source);
  if (!response.ok) throw new Error("INE_PACK_REGISTRY_REQUEST_FAILED");
  return validatePackRegistry(await response.json());
}

export async function loadCatalogPack(
  registryUrl: URL,
  entry: PackRegistryEntry,
): Promise<CatalogPack> {
  const manifestUrl = new URL(entry.manifest, registryUrl);
  const response = await fetch(manifestUrl);
  if (!response.ok) throw new Error("INE_CATALOG_MANIFEST_REQUEST_FAILED");
  const manifest: unknown = await response.json();
  if (
    !isRecord(manifest) ||
    manifest.id !== entry.id ||
    !nonEmptyString(manifest.title) ||
    !nonEmptyString(manifest.subtitle) ||
    !nonEmptyString(manifest.description) ||
    !nonEmptyString(manifest.coverImage) ||
    typeof manifest.coverImageAlt !== "string"
  ) {
    throw new Error("INE_CATALOG_MANIFEST_INVALID");
  }

  return {
    id: entry.id,
    slug: entry.slug,
    title: manifest.title,
    subtitle: manifest.subtitle,
    description: manifest.description,
    coverImage: new URL(manifest.coverImage, manifestUrl).href,
    coverImageAlt: manifest.coverImageAlt,
    manifestUrl: manifestUrl.href,
  };
}

export async function loadCatalog(source: URL): Promise<readonly CatalogPack[]> {
  const registry = await loadPackRegistry(source);
  return Promise.all(registry.packs.map((entry) => loadCatalogPack(source, entry)));
}

export function findRegistryEntryBySlug(
  registry: PackRegistry,
  slug: string,
): PackRegistryEntry | undefined {
  return registry.packs.find((entry) => entry.slug === slug);
}
