import { defineConfig } from "vite";
import {
  cpSync,
  createReadStream,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, resolve, sep } from "node:path";

const base = "/ERIA-Immersive-Prologue/";
const publicOrigin = "https://zephyravenel.github.io";

interface RegistryEntry {
  readonly id: string;
  readonly slug: string;
  readonly manifest: string;
}

interface Registry {
  readonly format: "ine-pack-registry";
  readonly version: "1.0";
  readonly home: string;
  readonly packs: readonly RegistryEntry[];
}

interface EditorialWorkshopEntry {
  readonly id: string;
  readonly family: "augmented-workshops";
  readonly status: "planned" | "published";
  readonly slug?: string;
  readonly manifest?: string;
  readonly coverImage?: string;
  readonly coverImageAlt?: string;
  readonly labels: Readonly<Record<string, { readonly title: string; readonly description: string }>>;
}

interface EditorialRegistry {
  readonly format: "ine-editorial-registry";
  readonly version: "1.0";
  readonly workshops: readonly EditorialWorkshopEntry[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function generateWorkEntryPages(): void {
  const registryPath = resolve("packs/index.json");
  const registry = JSON.parse(readFileSync(registryPath, "utf8")) as Registry;
  if (
    registry.format !== "ine-pack-registry" ||
    registry.version !== "1.0" ||
    typeof registry.home !== "string" ||
    !Array.isArray(registry.packs)
  ) {
    throw new Error("INE_BUILD_REGISTRY_INVALID");
  }

  const template = readFileSync(resolve("dist/index.html"), "utf8");
  const applicationHtml = template
    .replace('href="./manifest.webmanifest"', `href="${base}manifest.webmanifest"`)
    .replace('href="./icon.svg"', `href="${base}icon.svg"`);
  writeFileSync(resolve("dist/index.html"), applicationHtml);

  const libraryTarget = resolve("dist", "bibliotheque");
  mkdirSync(libraryTarget, { recursive: true });
  writeFileSync(resolve(libraryTarget, "index.html"), applicationHtml);

  const workshopsTarget = resolve("dist", "ateliers");
  mkdirSync(workshopsTarget, { recursive: true });
  writeFileSync(resolve(workshopsTarget, "index.html"), applicationHtml);

  const reviewTarget = resolve("dist", "revue");
  mkdirSync(reviewTarget, { recursive: true });
  writeFileSync(resolve(reviewTarget, "index.html"), applicationHtml);

  for (const entry of registry.packs) {
    const manifestPath = resolve("packs", entry.manifest);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    if (
      manifest.id !== entry.id ||
      typeof manifest.title !== "string" ||
      typeof manifest.description !== "string" ||
      typeof manifest.coverImage !== "string"
    ) {
      throw new Error(`INE_BUILD_CATALOG_MANIFEST_INVALID:${entry.id}`);
    }

    const canonical = `${publicOrigin}${base}oeuvres/${entry.slug}/`;
    const manifestUrl = new URL(entry.manifest, `${publicOrigin}${base}packs/index.json`);
    const imagePath = new URL(manifest.coverImage, manifestUrl).href;
    const socialMetadata = [
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:title" content="${escapeHtml(manifest.title)}" />`,
      `<meta property="og:description" content="${escapeHtml(manifest.description)}" />`,
      `<meta property="og:image" content="${escapeHtml(imagePath)}" />`,
      `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
    ].join("\n    ");
    const html = template
      .replace("<title>Bibliothèque des œuvres immersives</title>", `<title>${escapeHtml(manifest.title)}</title>`)
      .replace('href="./manifest.webmanifest"', `href="${base}manifest.webmanifest"`)
      .replace('href="./icon.svg"', `href="${base}icon.svg"`)
      .replace(
        '<meta name="description" content="Bibliothèque des œuvres immersives" />',
        `<meta name="description" content="${escapeHtml(manifest.description)}" />\n    ${socialMetadata}`,
      );
    const target = resolve("dist", "oeuvres", entry.slug);
    mkdirSync(target, { recursive: true });
    writeFileSync(resolve(target, "index.html"), html);
  }

  const editorialRegistryPath = resolve("apps", "player", "src", "editorial-registry.json");
  const editorialRegistry = JSON.parse(readFileSync(editorialRegistryPath, "utf8")) as EditorialRegistry;
  if (
    editorialRegistry.format !== "ine-editorial-registry" ||
    editorialRegistry.version !== "1.0" ||
    !Array.isArray(editorialRegistry.workshops)
  ) {
    throw new Error("INE_BUILD_EDITORIAL_REGISTRY_INVALID");
  }

  for (const workshop of editorialRegistry.workshops) {
    if (workshop.status !== "published") continue;
    if (
      workshop.family !== "augmented-workshops" ||
      typeof workshop.slug !== "string" ||
      typeof workshop.manifest !== "string"
    ) {
      throw new Error(`INE_BUILD_WORKSHOP_PUBLICATION_INVALID:${workshop.id}`);
    }

    const labels = workshop.labels.fr ?? workshop.labels.en;
    const title = labels?.title ?? workshop.id;
    const description = labels?.description ?? "";
    const canonical = `${publicOrigin}${base}ateliers/${workshop.slug}/`;
    const html = template
      .replace("<title>Bibliothèque des œuvres immersives</title>", `<title>${escapeHtml(title)} — Zéphyr Avenel</title>`)
      .replace('href="./manifest.webmanifest"', `href="${base}manifest.webmanifest"`)
      .replace('href="./icon.svg"', `href="${base}icon.svg"`)
      .replace(
        '<meta name="description" content="Bibliothèque des œuvres immersives" />',
        `<meta name="description" content="${escapeHtml(description)}" />\n    <link rel="canonical" href="${escapeHtml(canonical)}" />`,
      );
    const target = resolve("dist", "ateliers", workshop.slug);
    mkdirSync(target, { recursive: true });
    writeFileSync(resolve(target, "index.html"), html);
  }
}

function serveDirectory(root: string) {
  return (request: IncomingMessage, response: ServerResponse, next: () => void): void => {
    const relativePath = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const filePath = resolve(root, `.${relativePath}`);
    if (!filePath.startsWith(`${root}${sep}`)) {
      next();
      return;
    }

    try {
      if (!statSync(filePath).isFile()) {
        next();
        return;
      }
    } catch {
      next();
      return;
    }

    const contentTypes: Readonly<Record<string, string>> = {
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
    };
    response.setHeader("Content-Type", contentTypes[extname(filePath)] ?? "application/octet-stream");
    createReadStream(filePath).pipe(response);
  };
}

export default defineConfig({
  root: "apps/player",
  base,
  define: {
    __INE_BASE__: JSON.stringify(base),
  },
  publicDir: "public",
  plugins: [
    {
      name: "copy-example-narrative-packs",
      configureServer(server) {
        server.middlewares.use(`${base}examples`, serveDirectory(resolve("examples")));
        server.middlewares.use(`${base}schemas`, serveDirectory(resolve("schemas")));
        server.middlewares.use(`${base}packs`, serveDirectory(resolve("packs")));
      },
      closeBundle() {
        cpSync(resolve("examples"), resolve("dist/examples"), {
          recursive: true,
        });
        cpSync(resolve("schemas"), resolve("dist/schemas"), {
          recursive: true,
        });
        cpSync(resolve("packs"), resolve("dist/packs"), {
          recursive: true,
        });
        generateWorkEntryPages();
      },
    },
  ],
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    open: true,
  },
});
