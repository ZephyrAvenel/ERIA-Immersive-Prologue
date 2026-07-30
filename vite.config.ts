import { defineConfig } from "vite";
import { cpSync, createReadStream, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, resolve, sep } from "node:path";

const base = "/ERIA-Immersive-Prologue/";

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
