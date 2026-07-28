import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

async function collectTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectTests(path)));
    else if (entry.isFile() && entry.name.endsWith(".test.mjs")) files.push(path);
  }
  return files.sort();
}

export async function runGroups(groups) {
  if (groups.length === 0) {
    throw new Error("At least one test group is required.");
  }

  for (const group of groups) {
    const files = await collectTests(join("tests", group));
    for (const file of files) {
      await import(pathToFileURL(file).href);
    }
  }
}
