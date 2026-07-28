import { defineConfig } from "vite";
import { cpSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
  root: "apps/player",
  base: "/ERIA-Immersive-Prologue/",
  publicDir: "public",
  plugins: [
    {
      name: "copy-example-narrative-pack",
      closeBundle() {
        cpSync(resolve("examples/demo-pack"), resolve("dist/demo-pack"), {
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
