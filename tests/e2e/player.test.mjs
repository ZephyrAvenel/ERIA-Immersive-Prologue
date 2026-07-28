import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";

const baseUrl = "/ERIA-Immersive-Prologue/";
const artifactsDir = "test-results/e2e";

function once(emitter, event) {
  return new Promise((resolve) => emitter.once(event, resolve));
}

async function getFreePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  await new Promise((resolve) => server.close(resolve));
  return address.port;
}

async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill();
  await Promise.race([
    once(child, "exit"),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
}

async function waitForHttpOk(url, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

function findChromeExecutable() {
  if (!process.env.CI && !process.env.CHROME_PATH && !process.env.GOOGLE_CHROME_SHIM) {
    return undefined;
  }

  const candidates = [
    process.env.CHROME_PATH,
    process.env.GOOGLE_CHROME_SHIM,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    join(process.env.LOCALAPPDATA ?? "", "Google\\Chrome\\Application\\chrome.exe"),
  ].filter(Boolean);

  return candidates.find((candidate) => {
    try {
      return Boolean(candidate) && basename(candidate).length > 0 && requireExists(candidate);
    } catch {
      return false;
    }
  });
}

function requireExists(path) {
  return Boolean(path) && existsSync(path);
}

class CdpClient {
  #id = 0;
  #pending = new Map();
  #listeners = new Map();

  constructor(socket) {
    this.socket = socket;
    this.socket.addEventListener("message", (event) => this.#handleMessage(event));
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    return new CdpClient(socket);
  }

  send(method, params = {}) {
    const id = ++this.#id;
    const message = JSON.stringify({ id, method, params });
    const pending = new Promise((resolve, reject) => this.#pending.set(id, { resolve, reject }));
    this.socket.send(message);
    return pending;
  }

  on(method, listener) {
    const listeners = this.#listeners.get(method) ?? [];
    listeners.push(listener);
    this.#listeners.set(method, listeners);
  }

  waitFor(method, predicate = () => true, timeoutMs = 10_000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
      this.on(method, (params) => {
        if (!predicate(params)) return;
        clearTimeout(timeout);
        resolve(params);
      });
    });
  }

  close() {
    if (this.socket.readyState === WebSocket.CLOSED) return Promise.resolve();
    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, 1_000);
      this.socket.addEventListener("close", () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });
      this.socket.close();
    });
  }

  #handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id) {
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      this.#pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
      return;
    }

    const listeners = this.#listeners.get(message.method) ?? [];
    for (const listener of listeners) listener(message.params);
  }
}

async function launchVite(port) {
  const child = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    stdio: "ignore",
  });
  try {
    await waitForHttpOk(`http://127.0.0.1:${port}${baseUrl}`);
    return child;
  } catch (error) {
    await stopChild(child);
    throw error;
  }
}

async function launchChrome() {
  const executable = findChromeExecutable();
  if (!executable) return undefined;

  const userDataDir = await mkdtemp(join(tmpdir(), "ine-chrome-"));
  const child = spawn(executable, [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--no-sandbox",
    "about:blank",
  ], {
    stdio: ["ignore", "ignore", "pipe"],
  });

  try {
    const endpoint = await new Promise((resolve, reject) => {
      let settled = false;
      let timeout;
      const fail = (error) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        reject(error);
      };
      timeout = setTimeout(() => fail(new Error("Timed out waiting for Chrome DevTools endpoint")), 15_000);
      const inspect = (data) => {
        const match = String(data).match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (!match || settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(match[1]);
      };
      child.stderr.on("data", inspect);
      child.once("error", fail);
      child.once("exit", (code) => fail(new Error(`Chrome exited before DevTools was ready (${code})`)));
    });

    return { child, endpoint, userDataDir };
  } catch (error) {
    await stopChild(child);
    await rm(userDataDir, { recursive: true, force: true });
    throw error;
  }
}

async function openPage(browserEndpoint) {
  const { port } = new URL(browserEndpoint);
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  const pages = await response.json();
  const page = pages.find((entry) => entry.type === "page");
  assert.ok(page?.webSocketDebuggerUrl, "Chrome did not expose a page target");
  return CdpClient.connect(page.webSocketDebuggerUrl);
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitForExpression(client, expression, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(client, expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for expression: ${expression}`);
}

async function navigate(client, url) {
  const load = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url });
  await load;
  await waitForExpression(client, "document.querySelector('.scene__image')?.complete === true");
}

async function readPlayerState(client) {
  return evaluate(
    client,
    `(() => {
      const image = document.querySelector('.scene__image');
      const scene = document.querySelector('.scene');
      const controls = document.querySelector('.player-controls');
      const content = document.querySelector('.scene__content');
      const focusable = Array.from(document.querySelectorAll('a[href], button')).map((element) => ({
        text: element.textContent,
        disabled: element.disabled === true
      }));
      const imageRect = image?.getBoundingClientRect();
      const controlsRect = controls?.getBoundingClientRect();
      const contentRect = content?.getBoundingClientRect();
      return {
        lang: document.documentElement.lang,
        documentTitle: document.title,
        brand: document.querySelector('.player__brand')?.textContent,
        packLabel: document.querySelector('.player__pack-label')?.textContent,
        packTitle: document.querySelector('.player__pack-title')?.textContent,
        sceneTitle: document.querySelector('.scene__title')?.textContent,
        sceneText: document.querySelector('.scene__text')?.textContent,
        progress: document.querySelector('.progress__text')?.textContent,
        progressLabel: document.querySelector('.progress')?.getAttribute('aria-label'),
        stepCount: document.querySelectorAll('.progress__step').length,
        previousDisabled: document.querySelectorAll('button')[0]?.disabled === true,
        nextDisabled: document.querySelectorAll('button')[1]?.disabled === true,
        buttons: Array.from(document.querySelectorAll('button')).map((button) => button.textContent),
        objectFit: image ? getComputedStyle(image).objectFit : null,
        displayMode: image?.getAttribute('data-display-mode'),
        imageComplete: image?.complete === true,
        naturalWidth: image?.naturalWidth ?? 0,
        naturalHeight: image?.naturalHeight ?? 0,
        imageVisible: Boolean(imageRect && imageRect.width > 0 && imageRect.height > 0),
        sceneBorderWidth: scene ? getComputedStyle(scene).borderWidth : null,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        controlsInsideViewport: Boolean(controlsRect && controlsRect.left >= 0 && controlsRect.right <= document.documentElement.clientWidth),
        contentInsideViewport: Boolean(contentRect && contentRect.left >= 0 && contentRect.right <= document.documentElement.clientWidth),
        activeElementText: document.activeElement?.textContent,
        focusable,
        hasHeading: document.querySelectorAll('h1').length === 1,
        imageAlt: image?.getAttribute('alt'),
        hasNamedButtons: Array.from(document.querySelectorAll('button')).every((button) => (button.textContent || '').trim().length > 0),
        hasArticle: document.querySelector('article#scene') !== null
      };
    })()`,
  );
}

async function clickLocalizedNext(client) {
  await evaluate(client, "Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Suivant')?.click()");
  await waitForExpression(client, "document.querySelector('.scene__image')?.complete === true");
}

test("Player loads, localizes, navigates, keeps focus, and remains responsive in a real browser", async (t) => {
  let chrome;
  try {
    chrome = await launchChrome();
  } catch (error) {
    if (process.env.CI) throw error;
    t.skip(`Chrome could not start locally: ${error.message}`);
    return;
  }
  if (!chrome) {
    if (process.env.CI) throw new Error("Chrome executable not found in CI.");
    t.skip("Chrome executable not found locally.");
    return;
  }

  await mkdir(artifactsDir, { recursive: true });
  const port = await getFreePort();
  const vite = await launchVite(port);
  const page = await openPage(chrome.endpoint);
  const consoleErrors = [];
  const failedRequests = [];

  try {
    await page.send("Page.enable");
    await page.send("Runtime.enable");
    await page.send("Network.enable");
    await page.send("Log.enable");
    page.on("Runtime.consoleAPICalled", (event) => {
      if (event.type === "error") consoleErrors.push(event);
    });
    page.on("Log.entryAdded", (event) => {
      if (event.entry.level === "error") consoleErrors.push(event.entry);
    });
    page.on("Network.responseReceived", (event) => {
      const status = event.response.status;
      if (status >= 400) failedRequests.push({ status, url: event.response.url });
    });
    page.on("Network.loadingFailed", (event) => {
      failedRequests.push({ status: "failed", url: event.requestId, errorText: event.errorText });
    });

    const url = `http://127.0.0.1:${port}${baseUrl}`;
    await navigate(page, url);

    const first = await readPlayerState(page);
    assert.equal(first.lang, "fr");
    assert.equal(first.brand, "Immersive Narrative Engine");
    assert.equal(first.packLabel, "Pack narratif");
    assert.equal(first.packTitle, "Le Seuil des Étoiles");
    assert.equal(first.sceneTitle, "Le mont silencieux");
    assert.equal(first.progress, "Scène 1 / 8");
    assert.equal(first.previousDisabled, true);
    assert.equal(first.nextDisabled, false);
    assert.equal(first.objectFit, "contain");
    assert.equal(first.displayMode, "contain");
    assert.equal(first.imageComplete, true);
    assert.ok(first.naturalWidth > 0);
    assert.ok(first.naturalHeight > 0);
    assert.equal(first.stepCount, 8);
    assert.equal(first.sceneBorderWidth, "0px");
    assert.equal(first.noHorizontalOverflow, true);
    assert.equal(first.hasHeading, true);
    assert.equal(first.hasNamedButtons, true);
    assert.equal(first.hasArticle, true);
    assert.ok(first.imageAlt.length > 0);
    assert.deepEqual(first.focusable, [
      { text: "Passer au récit", disabled: false },
      { text: "Précédent", disabled: true },
      { text: "Suivant", disabled: false },
    ]);

    for (let index = 2; index <= 8; index += 1) {
      await clickLocalizedNext(page);
      const state = await readPlayerState(page);
      assert.equal(state.progress, `Scène ${index} / 8`);
      assert.equal(state.objectFit, "contain");
      assert.equal(state.displayMode, "contain");
      assert.equal(state.imageComplete, true);
      assert.ok(state.naturalWidth > 0);
      assert.ok(state.naturalHeight > 0);
      assert.equal(state.activeElementText, index === 8 ? "Précédent" : "Suivant");
    }

    const last = await readPlayerState(page);
    assert.equal(last.nextDisabled, true);
    assert.equal(last.previousDisabled, false);

    await evaluate(page, "Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Précédent')?.click()");
    await waitForExpression(page, "document.querySelector('.progress__text')?.textContent === 'Scène 7 / 8'");
    assert.equal((await readPlayerState(page)).activeElementText, "Précédent");

    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      await page.send("Emulation.setDeviceMetricsOverride", {
        ...viewport,
        deviceScaleFactor: 1,
        mobile: viewport.width < 600,
      });
      await navigate(page, url);
      const state = await readPlayerState(page);
      assert.equal(state.noHorizontalOverflow, true, `${viewport.width} has horizontal overflow`);
      assert.equal(state.controlsInsideViewport, true, `${viewport.width} controls overflow`);
      assert.equal(state.contentInsideViewport, true, `${viewport.width} content overflow`);
      assert.equal(state.imageVisible, true, `${viewport.width} image is not visible`);
      assert.deepEqual(state.buttons, ["Précédent", "Suivant"]);
    }

    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(failedRequests, []);
  } catch (error) {
    const screenshot = await page.send("Page.captureScreenshot", { format: "png" }).catch(() => undefined);
    if (screenshot?.data) await writeFile(join(artifactsDir, "player-failure.png"), Buffer.from(screenshot.data, "base64"));
    await writeFile(join(artifactsDir, "failure.txt"), String(error.stack ?? error));
    throw error;
  } finally {
    await page.close();
    await stopChild(vite);
    await stopChild(chrome.child);
    await rm(chrome.userDataDir, { recursive: true, force: true }).catch(() => undefined);
  }
});
