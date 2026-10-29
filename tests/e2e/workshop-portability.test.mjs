import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";

const baseUrl = "/ERIA-Immersive-Prologue/";
const storageKey = "ine:workshop-progress:v1:ecriture-augmentee";

function once(emitter, event) { return new Promise((resolve) => emitter.once(event, resolve)); }
async function freePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([once(child, "exit"), new Promise((resolve) => setTimeout(resolve, 2_000))]);
}
async function waitFor(predicate, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for an observable browser state");
}
class Cdp {
  #id = 0; #pending = new Map();
  constructor(socket) { this.socket = socket; socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); const pending = this.#pending.get(message.id); if (!pending) return; this.#pending.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result); }); }
  static async connect(url) { const socket = new WebSocket(url); await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); }); return new Cdp(socket); }
  send(method, params = {}) { const id = ++this.#id; const result = new Promise((resolve, reject) => this.#pending.set(id, { resolve, reject })); this.socket.send(JSON.stringify({ id, method, params })); return result; }
  async evaluate(expression) { const result = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; }
  close() { this.socket.close(); }
}
async function launchVite(port) {
  const child = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { stdio: "ignore" });
  await waitFor(async () => { try { return (await fetch(`http://127.0.0.1:${port}${baseUrl}`)).ok; } catch { return false; } });
  return child;
}
async function launchChrome() {
  const executable = process.env.CHROME_PATH;
  assert.ok(executable && existsSync(executable), "CHROME_PATH must reference Chrome");
  const profile = await mkdtemp(join(tmpdir(), "ine-portability-profile-"));
  const child = spawn(executable, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const endpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Chrome DevTools endpoint timed out")), 15_000);
    child.stderr.on("data", (data) => { const match = String(data).match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timeout); resolve(match[1]); } });
    child.once("error", reject);
  });
  return { child, endpoint, profile };
}
async function openPage(endpoint) {
  const { port } = new URL(endpoint);
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  return Cdp.connect(pages.find((page) => page.type === "page").webSocketDebuggerUrl);
}
async function setFile(client, path) {
  const root = await client.send("DOM.getDocument", { depth: 2 });
  const node = await client.send("DOM.querySelector", { nodeId: root.root.nodeId, selector: ".workshop-portability input[type=file]" });
  assert.ok(node.nodeId, "Import file input missing");
  await client.send("DOM.setFileInputFiles", { files: [path], nodeId: node.nodeId });
}
async function downloaded(directory, count, extension) {
  await waitFor(async () => (await readdir(directory)).filter((name) => name.endsWith(extension)).length >= count);
  const names = await readdir(directory);
  const name = names.filter((candidate) => candidate.endsWith(extension)).sort().at(-1);
  assert.ok(name);
  return join(directory, name);
}

test("Augmented Workshop portability downloads, previews, imports, cancels and replaces in Chrome", async () => {
  const started = Date.now();
  const downloads = await mkdtemp(join(tmpdir(), "ine-portability-downloads-"));
  const files = await mkdtemp(join(tmpdir(), "ine-portability-files-"));
  const port = await freePort();
  const vite = await launchVite(port);
  const chrome = await launchChrome();
  const page = await openPage(chrome.endpoint);
  try {
    await page.send("Page.enable");
    await page.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
    await page.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const url = `http://127.0.0.1:${port}${baseUrl}ateliers/ecriture-augmentee/`;
    await page.send("Page.navigate", { url });
    await waitFor(() => page.evaluate("document.querySelector('.workshop-entry') !== null"));
    assert.equal(await page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), true);
    assert.equal(await page.evaluate("document.querySelector('.workshop-portability')?.open"), false);
    assert.equal(await page.evaluate("(() => { const summary = document.querySelector('.workshop-portability summary'); summary.focus(); return document.activeElement === summary; })()"), true);
    assert.equal(await page.evaluate("document.querySelector('.workshop-portability__status')?.getAttribute('role')"), "status");
    await page.evaluate("document.querySelector('.workshop-entry__primary')?.click()");
    await waitFor(() => page.evaluate("document.querySelector('.workshop-progress__text')?.textContent === '01 / 26'"));
    await page.evaluate("document.querySelector('[data-workshop-navigation=next]')?.click()");
    await waitFor(() => page.evaluate("document.querySelector('.workshop-progress__text')?.textContent === '02 / 26'"));
    await page.evaluate(`(() => { const field = document.querySelector('textarea'); field.value = 'Élan spécial\\n# sans titre'; field.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await page.evaluate("document.querySelector('.workshop-portability summary')?.click()");
    await waitFor(() => page.evaluate("document.querySelector('.workshop-portability[open]') !== null"));
    await page.evaluate("Array.from(document.querySelectorAll('.workshop-portability button')).find((button) => button.textContent.includes('(.md)'))?.click()");
    const markdownPath = await downloaded(downloads, 1, ".md");
    const markdown = await readFile(markdownPath, "utf8");
    assert.match(basename(markdownPath), /^recits-vivants-ecriture-augmentee-parcours-\d{4}-\d{2}-\d{2}\.md$/);
    assert.match(markdown, /Élan spécial\n# sans titre/);
    assert.match(markdown, /Étape 2/);
    await page.evaluate("Array.from(document.querySelectorAll('.workshop-portability button')).find((button) => button.textContent.includes('(.json)'))?.click()");
    const jsonPath = await downloaded(downloads, 1, ".json");
    const exported = JSON.parse(await readFile(jsonPath, "utf8"));
    assert.match(basename(jsonPath), /^recits-vivants-ecriture-augmentee-parcours-\d{4}-\d{2}-\d{2}\.json$/);
    assert.equal(exported.format, "ine-workshop-export");
    assert.equal(exported.workshop.id, "ecriture-augmentee");
    assert.equal(exported.progress.pageId, "page-02");
    assert.equal(Object.values(exported.progress.responses).includes("Élan spécial\n# sans titre"), true);

    const importPath = join(files, "parcours.json");
    await writeFile(importPath, JSON.stringify(exported), "utf8");
    await page.evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)})`);
    await page.send("Page.navigate", { url });
    await waitFor(() => page.evaluate("document.querySelector('.workshop-entry') !== null"));
    await page.evaluate("document.querySelector('.workshop-portability summary')?.click(); Array.from(document.querySelectorAll('.workshop-portability button')).find((button) => button.textContent.includes('Reprendre un parcours'))?.click()");
    await setFile(page, importPath);
    await waitFor(() => page.evaluate("document.querySelector('.workshop-portability__preview:not([hidden])') !== null"));
    assert.equal(await page.evaluate("document.querySelector('.workshop-portability__preview')?.textContent.includes('étape 2')"), true);
    await page.evaluate("Array.from(document.querySelectorAll('.workshop-portability__preview button')).find((button) => button.textContent === 'Annuler')?.click()");
    assert.equal(await page.evaluate(`localStorage.getItem(${JSON.stringify(storageKey)})`), null);

    await page.evaluate("Array.from(document.querySelectorAll('.workshop-portability button')).find((button) => button.textContent.includes('Reprendre un parcours'))?.click()");
    await setFile(page, importPath);
    await waitFor(() => page.evaluate("document.querySelector('.workshop-portability__preview:not([hidden])') !== null"));
    await page.evaluate("Array.from(document.querySelectorAll('.workshop-portability__preview button')).find((button) => button.textContent.includes('Remplacer'))?.click()");
    await waitFor(() => page.evaluate("document.querySelector('.workshop-entry__primary')?.textContent === 'Reprendre l’atelier'"));
    await page.evaluate("document.querySelector('.workshop-entry__primary')?.click()");
    await waitFor(() => page.evaluate("document.querySelector('.workshop-progress__text')?.textContent === '02 / 26' && document.querySelector('textarea')?.value === 'Élan spécial\\n# sans titre'"));
    await page.send("Page.navigate", { url });
    await waitFor(() => page.evaluate("document.querySelector('.workshop-entry__primary')?.textContent === 'Reprendre l’atelier'"));

    await page.evaluate(`localStorage.setItem(${JSON.stringify(storageKey)}, JSON.stringify({ schemaVersion: 1, workshopId: 'ecriture-augmentee', workshopVersion: '1.0', pageId: 'page-01', updatedAt: new Date().toISOString(), completed: false, responses: {} }))`);
    await page.send("Page.navigate", { url });
    await waitFor(() => page.evaluate("document.querySelector('.workshop-entry') !== null"));
    await page.evaluate("document.querySelector('.workshop-portability summary')?.click(); Array.from(document.querySelectorAll('.workshop-portability button')).find((button) => button.textContent.includes('Reprendre un parcours'))?.click()");
    await setFile(page, importPath);
    await waitFor(() => page.evaluate("document.querySelector('.workshop-portability__warning') !== null"));
    await page.evaluate("Array.from(document.querySelectorAll('.workshop-portability__preview button')).find((button) => button.textContent.includes('progression actuelle'))?.click()");
    let currentPath;
    await waitFor(async () => {
      for (const name of (await readdir(downloads)).filter((candidate) => candidate.endsWith(".json"))) {
        const candidate = join(downloads, name);
        if (JSON.parse(await readFile(candidate, "utf8")).progress.pageId === "page-01") {
          currentPath = candidate;
          return true;
        }
      }
      return false;
    });
    assert.equal(JSON.parse(await readFile(currentPath, "utf8")).progress.pageId, "page-01");
    await page.evaluate("Array.from(document.querySelectorAll('.workshop-portability__preview button')).find((button) => button.textContent === 'Annuler')?.click()");
    assert.equal(JSON.parse(await page.evaluate(`localStorage.getItem(${JSON.stringify(storageKey)})`)).pageId, "page-01");

    const invalidPath = join(files, "invalide.json");
    await writeFile(invalidPath, "{", "utf8");
    await page.evaluate("Array.from(document.querySelectorAll('.workshop-portability button')).find((button) => button.textContent.includes('Reprendre un parcours'))?.click()");
    await setFile(page, invalidPath);
    await waitFor(() => page.evaluate("document.querySelector('.workshop-portability__status')?.textContent.includes('Aucune progression')"));
    assert.equal(JSON.parse(await page.evaluate(`localStorage.getItem(${JSON.stringify(storageKey)})`)).pageId, "page-01");

    const reject = async (name, content, expectedText) => {
      const path = join(files, name);
      await writeFile(path, content, "utf8");
      await page.evaluate("document.querySelector('.workshop-portability__status').textContent = ''");
      await page.evaluate("Array.from(document.querySelectorAll('.workshop-portability button')).find((button) => button.textContent.includes('Reprendre un parcours'))?.click()");
      await setFile(page, path);
      await waitFor(() => page.evaluate(`document.querySelector('.workshop-portability__status')?.textContent.includes(${JSON.stringify(expectedText)})`));
      assert.equal(JSON.parse(await page.evaluate(`localStorage.getItem(${JSON.stringify(storageKey)})`)).pageId, "page-01");
    };
    const foreign = structuredClone(exported);
    foreign.workshop.id = "art-augmente";
    await reject("autre-atelier.json", JSON.stringify(foreign), "autre atelier");
    const incompatible = structuredClone(exported);
    incompatible.workshop.manifestVersion = "2.0";
    await reject("version.json", JSON.stringify(incompatible), "version non compatible");
    const removedPage = structuredClone(exported);
    removedPage.progress.pageId = "page-supprimee";
    await reject("etape.json", JSON.stringify(removedPage), "ne correspond pas");
    const invalidChoice = structuredClone(exported);
    invalidChoice.progress.responses["forme-impulsion"] = "option-inconnue";
    await reject("choix.json", JSON.stringify(invalidChoice), "ne correspond pas");
    const oversizedPath = join(files, "trop-grand.json");
    await writeFile(oversizedPath, Buffer.alloc(2_097_153, 32));
    await page.evaluate("Array.from(document.querySelectorAll('.workshop-portability button')).find((button) => button.textContent.includes('Reprendre un parcours'))?.click()");
    await setFile(page, oversizedPath);
    await waitFor(() => page.evaluate("document.querySelector('.workshop-portability__status')?.textContent.includes('2 Mio')"));
    assert.equal(JSON.parse(await page.evaluate(`localStorage.getItem(${JSON.stringify(storageKey)})`)).pageId, "page-01");
    assert.ok(Date.now() - started > 0);
  } finally {
    page.close(); await stop(vite); await stop(chrome.child);
    await rm(chrome.profile, { recursive: true, force: true });
    await rm(downloads, { recursive: true, force: true });
    await rm(files, { recursive: true, force: true });
  }
});
