import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export async function readJsonFixture(group, name) {
  const content = await readFile(join(root, "fixtures", group, name), "utf8");
  return JSON.parse(content);
}

export async function readProjectJson(...segments) {
  const content = await readFile(join(root, "..", ...segments), "utf8");
  return JSON.parse(content);
}
