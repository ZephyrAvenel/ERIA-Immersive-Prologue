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
const progressStorageKey = "ine:progress:v1:les-gardiens-des-recits-vivants";
const workshopProgressStorageKey = "ine:workshop-progress:v1:workshop-demo";
const augmentedWritingWorkshopProgressStorageKey = "ine:workshop-progress:v1:ecriture-augmentee";
const publicThresholdSessionKey = "ine:public-threshold:v1:recits-vivants";
const publicThresholdSkipHomeIntroKey = `${publicThresholdSessionKey}:skip-home-intro-once`;

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

async function waitForPlayerReady(client, expectedProgress, timeoutMs = 10_000) {
  const progressPredicate = expectedProgress
    ? `document.querySelector('.progress__text')?.textContent === ${JSON.stringify(expectedProgress)}`
    : "true";
  await waitForExpression(
    client,
    `(() => {
      const app = document.querySelector('#app');
      const image = document.querySelector('.scene__image');
      const media = document.querySelector('.scene__media');
      const imageReady = image === null
        ? media === null
        : image.complete === true
          && image.naturalWidth > 0
          && image.naturalHeight > 0
          && image.getAttribute('data-image-state') === 'ready'
          && media?.getAttribute('data-image-state') === 'ready';
      return ${progressPredicate}
        && app?.getAttribute('aria-busy') === null
        && app?.getAttribute('data-transition') === null
        && document.querySelectorAll('.player').length === 1
        && imageReady;
    })()`,
    timeoutMs,
  );
}

async function loadUrl(client, url) {
  const load = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url });
  await load;
}

async function navigate(client, url) {
  await loadUrl(client, url);
  await waitForExpression(
    client,
    "document.querySelector('.prologue') !== null || document.querySelector('.scene__image') !== null || document.querySelector('.resume-panel') !== null",
  );
  if (await evaluate(client, "document.querySelector('.prologue') !== null")) {
    await enterPrologue(client);
  }
  await waitForExpression(client, "document.querySelector('.scene__image')?.complete === true");
}

async function waitForPrologueReady(client) {
  await waitForExpression(
    client,
    `(() => {
      const button = document.querySelector('.prologue button');
      return document.querySelector('.prologue') !== null
        && document.querySelector('#prologue-title')?.textContent === 'Le Seuil'
        && Array.from(document.querySelectorAll('.prologue__line')).map((line) => line.textContent).join('|') === "Avant les mots, il y avait le souffle.|Avant les certitudes, il y avait l'émerveillement.|Chaque récit vivant commence lorsqu'une porte s'entrouvre.|Ce seuil ne se franchit pas avec les pieds.|Il se franchit avec le regard."
        && button?.textContent === 'Franchir le seuil'
        && button === document.activeElement;
    })()`,
  );
}

async function enterPrologue(client) {
  await crossPrologue(client);
  await waitForPlayerReady(client, "Scène 1 / 9");
}

async function crossPrologue(client) {
  await waitForPrologueReady(client);
  await evaluate(client, "document.querySelector('.prologue button')?.click()");
}

async function waitForOrientationReady(client) {
  await waitForExpression(
    client,
    `(() => {
      const firstAction = document.querySelector('.orientation-door__action');
      return document.querySelectorAll('.orientation-door').length === 2
        && ['Deux manières de poursuivre', 'Two ways to continue'].includes(document.querySelector('#home-title')?.textContent ?? '')
        && (document.body.textContent?.includes('VIVRE') || document.body.textContent?.includes('LIVE'))
        && (document.body.textContent?.includes('CRÉER') || document.body.textContent?.includes('CREATE'))
        && firstAction instanceof HTMLAnchorElement;
    })()`,
  );
}

async function waitForWorkshopReady(client, expectedProgress, timeoutMs = 10_000) {
  await waitForExpression(
    client,
    `(() => {
      const app = document.querySelector('#app');
      return document.querySelector('.workshop-player') !== null
        && document.querySelector('#workshop-page') !== null
        && document.querySelector('.workshop-progress__text')?.textContent === ${JSON.stringify(expectedProgress)}
        && app?.getAttribute('aria-busy') === null
        && document.querySelectorAll('.workshop-player').length === 1
        && document.querySelector('#workshop-page') === document.activeElement;
    })()`,
    timeoutMs,
  );
}

async function readWorkshopState(client) {
  return evaluate(
    client,
    `(() => {
      const next = document.querySelector('[data-workshop-navigation="next"]');
      const previous = document.querySelector('[data-workshop-navigation="previous"]');
      const exit = document.querySelector('.workshop-exit');
      const page = document.querySelector('#workshop-page');
      const controls = document.querySelector('.workshop-controls');
      const textarea = document.querySelector('textarea');
      const textareaLabel = textarea ? document.querySelector(\`label[for="\${textarea.id}"]\`) : null;
      const revealButton = document.querySelector('.workshop-reveal__button');
      const revealContent = document.querySelector('.workshop-reveal__content');
      const prompt = document.querySelector('.workshop-prompt-copy__text');
      const promptButton = document.querySelector('.workshop-prompt-copy__button');
      const promptStatus = document.querySelector('.workshop-prompt-copy__status');
      const recall = document.querySelector('.workshop-recall__content');
      const reset = document.querySelector('.workshop-reset');
      const progress = document.querySelector('.workshop-progress');
      const pageRect = page?.getBoundingClientRect();
      const controlsRect = controls?.getBoundingClientRect();
      const progressRect = progress?.getBoundingClientRect();
      const previousRect = previous?.getBoundingClientRect();
      const nextRect = next?.getBoundingClientRect();
      const resetRect = reset?.getBoundingClientRect();
      return {
        title: document.querySelector('.workshop-player__title')?.textContent,
        subtitle: document.querySelector('.workshop-player__subtitle')?.textContent,
        movement: document.querySelector('.workshop-page__movement')?.textContent,
        pageTitle: document.querySelector('.workshop-page__title')?.textContent,
        progress: document.querySelector('.workshop-progress__text')?.textContent,
        previousDisabled: previous?.disabled === true,
        nextDisabled: next?.disabled === true,
        pendingBlocks: document.querySelectorAll('.workshop-block--pending').length,
        textareaCount: document.querySelectorAll('textarea').length,
        textareaValue: textarea?.value ?? null,
        textareaLabel: textareaLabel?.textContent ?? null,
        inputCount: document.querySelectorAll('input').length,
        checkedChoices: Array.from(document.querySelectorAll('input[type="radio"]:checked')).map((input) => input.value),
        choiceLabels: Array.from(document.querySelectorAll('.workshop-choice__label')).map((label) => label.textContent),
        promptText: prompt?.textContent ?? null,
        promptButtonText: promptButton?.textContent ?? null,
        promptStatus: promptStatus?.textContent ?? null,
        copiedPrompt: window.__ineCopiedPrompt ?? null,
        recallText: recall?.textContent ?? null,
        resetText: reset?.textContent ?? null,
        revealExpanded: revealButton?.getAttribute('aria-expanded') ?? null,
        revealControls: revealButton?.getAttribute('aria-controls') ?? null,
        revealContentId: revealContent?.id ?? null,
        revealHidden: revealContent?.hidden ?? null,
        revealText: revealContent?.textContent ?? null,
        exitHref: exit?.href ?? null,
        activeId: document.activeElement?.id,
        activeTag: document.activeElement?.tagName,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        pageVisible: Boolean(pageRect && pageRect.width > 0 && pageRect.height > 0),
        controlsInsideViewport: Boolean(controlsRect && controlsRect.left >= 0 && controlsRect.right <= document.documentElement.clientWidth),
        progressInsideViewport: Boolean(progressRect && progressRect.left >= 0 && progressRect.right <= document.documentElement.clientWidth),
        previousInsideViewport: Boolean(previousRect && previousRect.left >= 0 && previousRect.right <= document.documentElement.clientWidth),
        nextInsideViewport: Boolean(nextRect && nextRect.left >= 0 && nextRect.right <= document.documentElement.clientWidth),
        resetInsideViewport: Boolean(resetRect && resetRect.left >= 0 && resetRect.right <= document.documentElement.clientWidth),
        resetBelowControls: Boolean(resetRect && controlsRect && resetRect.top >= controlsRect.bottom),
        resetCentered: Boolean(
          resetRect
            && Math.abs((resetRect.left + resetRect.width / 2) - document.documentElement.clientWidth / 2) <= 8
        )
      };
    })()`,
  );
}

async function readWorkshopEntryState(client) {
  return evaluate(
    client,
    `(() => {
      const entry = document.querySelector('.workshop-entry');
      const primary = document.querySelector('.workshop-entry__primary');
      const secondary = document.querySelector('.workshop-entry__secondary');
      const confirmation = document.querySelector('.workshop-entry__confirm');
      const cover = document.querySelector('.workshop-entry__cover img');
      const rect = entry?.getBoundingClientRect();
      return {
        present: Boolean(entry),
        path: window.location.pathname,
        search: window.location.search,
        title: document.querySelector('#workshop-entry-title')?.textContent,
        subtitle: document.querySelector('.workshop-entry__subtitle')?.textContent,
        description: document.querySelector('.workshop-entry__description')?.textContent,
        steps: document.querySelector('.workshop-entry__steps')?.textContent,
        intro: Array.from(document.querySelectorAll('.workshop-entry__intro p')).map((paragraph) => paragraph.textContent),
        privacy: document.querySelector('.workshop-entry__privacy')?.textContent,
        primary: primary?.textContent ?? null,
        secondary: secondary?.textContent ?? null,
        resume: document.querySelector('.workshop-entry__resume')?.textContent ?? null,
        backHref: document.querySelector('.workshop-entry__back')?.href ?? null,
        coverPresent: Boolean(cover),
        coverAlt: cover?.getAttribute('alt') ?? null,
        coverNaturalWidth: cover?.naturalWidth ?? 0,
        coverNaturalHeight: cover?.naturalHeight ?? 0,
        coverObjectFit: cover ? getComputedStyle(cover).objectFit : null,
        confirmationPresent: Boolean(confirmation),
        confirmationTitle: confirmation?.querySelector('h2')?.textContent ?? null,
        confirmationDescription: confirmation?.querySelector('p')?.textContent ?? null,
        confirmationButtons: Array.from(confirmation?.querySelectorAll('button') ?? []).map((button) => button.textContent),
        activeText: document.activeElement?.textContent ?? null,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        visible: Boolean(rect && rect.width > 0 && rect.height > 0),
      };
    })()`,
  );
}

async function clearReadingProgress(client) {
  await evaluate(client, `localStorage.removeItem(${JSON.stringify(progressStorageKey)})`);
}

async function readStoredProgress(client) {
  return evaluate(
    client,
    `(() => {
      const raw = localStorage.getItem(${JSON.stringify(progressStorageKey)});
      return raw ? JSON.parse(raw) : null;
    })()`,
  );
}

async function readStoredWorkshopProgress(client) {
  return evaluate(
    client,
    `(() => {
      const raw = localStorage.getItem(${JSON.stringify(workshopProgressStorageKey)});
      return raw ? JSON.parse(raw) : null;
    })()`,
  );
}

async function waitForResumePrompt(client, expectedDescription) {
  await waitForExpression(
    client,
    `(() => {
      return document.querySelector('.resume-panel h1')?.textContent === 'Reprendre votre lecture ?'
        && document.querySelector('#resume-description')?.textContent === ${JSON.stringify(expectedDescription)}
        && document.querySelector('[data-resume-action="resume"]') === document.activeElement;
    })()`,
  );
}

async function clickResumeAction(client, action) {
  await evaluate(
    client,
    `document.querySelector(${JSON.stringify(`[data-resume-action="${action}"]`)})?.click()`,
  );
}

async function readPlayerState(client) {
  return evaluate(
    client,
    `(() => {
      const image = document.querySelector('.scene__image');
      const player = document.querySelector('.player');
      const scene = document.querySelector('.scene');
      const controls = document.querySelector('.player-controls');
      const content = document.querySelector('.scene__content');
      const media = document.querySelector('.scene__media');
      const focusable = Array.from(document.querySelectorAll('a[href], button')).map((element) => ({
        text: element.textContent,
        disabled: element.disabled === true
      }));
      const imageRect = image?.getBoundingClientRect();
      const mediaRect = media?.getBoundingClientRect();
      const controlsRect = controls?.getBoundingClientRect();
      const contentRect = content?.getBoundingClientRect();
      const title = document.querySelector('.scene__title');
      const text = document.querySelector('.scene__text');
      const titleRect = title?.getBoundingClientRect();
      const textRect = text?.getBoundingClientRect();
      const titleStyle = title ? getComputedStyle(title) : null;
      const textStyle = text ? getComputedStyle(text) : null;
      return {
        busy: document.querySelector('#app')?.getAttribute('aria-busy'),
        transitionName: document.querySelector('#app')?.getAttribute('data-transition'),
        playerCount: document.querySelectorAll('.player').length,
        hiddenPlayerCount: document.querySelectorAll('.player[aria-hidden="true"]').length,
        lang: document.documentElement.lang,
        documentTitle: document.title,
        engineTitleData: player?.getAttribute('data-engine-title'),
        packIdData: player?.getAttribute('data-pack-id'),
        layoutData: player?.getAttribute('data-layout'),
        layoutPhaseData: player?.getAttribute('data-layout-phase'),
        sceneLayoutPhaseData: scene?.getAttribute('data-layout-phase'),
        hasVisibleEngineBrand: document.querySelector('.player__brand') !== null,
        hasVisiblePackLabel: document.querySelector('.player__pack-label') !== null,
        packTitle: document.querySelector('.player__work-title')?.textContent,
        sceneTitle: document.querySelector('.scene__title')?.textContent,
        sceneText: document.querySelector('.scene__text')?.textContent,
        progress: document.querySelector('.progress__text')?.textContent,
        progressLabel: document.querySelector('.progress')?.getAttribute('aria-label'),
        stepCount: document.querySelectorAll('.progress__step').length,
        previousDisabled: document.querySelector('[data-navigation="previous"]')?.disabled === true,
        nextDisabled: document.querySelector('[data-navigation="next"]')?.disabled === true,
        buttons: Array.from(document.querySelectorAll('.player-controls button')).map((button) => button.textContent),
        objectFit: image ? getComputedStyle(image).objectFit : null,
        displayMode: image?.getAttribute('data-display-mode'),
        imageState: image?.getAttribute('data-image-state'),
        mediaState: document.querySelector('.scene__media')?.getAttribute('data-image-state'),
        imageComplete: image?.complete === true,
        currentSrc: image?.currentSrc ?? '',
        naturalWidth: image?.naturalWidth ?? 0,
        naturalHeight: image?.naturalHeight ?? 0,
        imageHeight: imageRect?.height ?? 0,
        mediaHeight: mediaRect?.height ?? 0,
        titleTop: titleRect?.top ?? 0,
        titleFontSize: titleStyle?.fontSize ?? null,
        textTop: textRect?.top ?? 0,
        textFontSize: textStyle?.fontSize ?? null,
        textLineHeight: textStyle?.lineHeight ?? null,
        mediaBottomBeforeTitle: Boolean(mediaRect && titleRect && mediaRect.bottom <= titleRect.top),
        titleBottomBeforeText: Boolean(titleRect && textRect && titleRect.bottom <= textRect.top),
        imageVisible: Boolean(imageRect && imageRect.width > 0 && imageRect.height > 0),
        sceneBorderWidth: scene ? getComputedStyle(scene).borderWidth : null,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        noVerticalOverflow: document.documentElement.scrollHeight <= document.documentElement.clientHeight + 1,
        controlsInsideViewport: Boolean(controlsRect && controlsRect.left >= 0 && controlsRect.right <= document.documentElement.clientWidth),
        controlsVisibleVertically: Boolean(controlsRect && controlsRect.top >= 0 && controlsRect.bottom <= document.documentElement.clientHeight),
        contentInsideViewport: Boolean(contentRect && contentRect.left >= -1 && contentRect.right <= document.documentElement.clientWidth + 1),
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

async function readStablePlayerState(client, expectedProgress) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await waitForPlayerReady(client, expectedProgress);
    const state = await readPlayerState(client);
    if (state.busy === null && state.transitionName === null) return state;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return readPlayerState(client);
}

async function clickLocalizedNext(client, expectedProgress) {
  await evaluate(client, "Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Suivant')?.click()");
  if (expectedProgress) {
    await waitForPlayerReady(client, expectedProgress);
  } else {
    await waitForPlayerReady(client);
  }
}

async function clickNavigationNext(client, expectedProgress) {
  await evaluate(client, "document.querySelector('[data-navigation=\"next\"]')?.click()");
  if (expectedProgress) {
    await waitForPlayerReady(client, expectedProgress);
  } else {
    await waitForPlayerReady(client);
  }
}

function assertSceneImageReady(state) {
  assert.equal(state.objectFit, "contain");
  assert.equal(state.displayMode, "contain");
  assert.equal(state.imageState, "ready");
  assert.equal(state.mediaState, "ready");
  assert.equal(state.imageComplete, true);
  assert.ok(state.currentSrc.endsWith(".png"), state.currentSrc);
  assert.ok(state.naturalWidth > 0);
  assert.ok(state.naturalHeight > 0);
  assert.equal(state.imageVisible, true);
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
  const imageResponses = [];
  const isIgnorableDevServerLog = (entry) =>
    entry.source === "network" &&
    String(entry.text).includes(`WebSocket connection to 'ws://127.0.0.1:${port}`) &&
    String(entry.text).includes("Page entered Back-Forward Cache.");

  try {
    await page.send("Page.enable");
    await page.send("Runtime.enable");
    await page.send("Network.enable");
    await page.send("Log.enable");
    page.on("Runtime.consoleAPICalled", (event) => {
      if (event.type === "error") consoleErrors.push(event);
    });
    page.on("Log.entryAdded", (event) => {
      if (event.entry.level === "error" && !isIgnorableDevServerLog(event.entry)) consoleErrors.push(event.entry);
    });
    page.on("Network.responseReceived", (event) => {
      const status = event.response.status;
      if (status >= 400) failedRequests.push({ status, url: event.response.url });
      if (event.response.url.endsWith(".png") || event.response.url.endsWith(".webp")) {
        const headers = event.response.headers ?? {};
        imageResponses.push({
          status,
          url: event.response.url,
          mimeType: event.response.mimeType,
          contentType: headers["content-type"] ?? headers["Content-Type"] ?? "",
        });
      }
    });
    page.on("Network.loadingFailed", (event) => {
      failedRequests.push({ status: "failed", url: event.requestId, errorText: event.errorText });
    });

    const entryUrl = `http://127.0.0.1:${port}${baseUrl}`;
    const libraryUrl = `${entryUrl}bibliotheque/`;
    const workshopsUrl = `${entryUrl}ateliers/`;
    const url = `${entryUrl}oeuvres/les-gardiens-des-recits-vivants/`;
    await page.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
    });
    await loadUrl(page, entryUrl);
    await waitForPrologueReady(page);
    assert.equal(
      await evaluate(page, `sessionStorage.getItem(${JSON.stringify(publicThresholdSessionKey)})`),
      null,
      "a new browser session should not mark the public threshold before it is crossed",
    );
    await crossPrologue(page);
    await waitForOrientationReady(page);
    assert.equal(
      await evaluate(page, `sessionStorage.getItem(${JSON.stringify(publicThresholdSessionKey)})`),
      "crossed",
      "crossing the public threshold should be stored only in sessionStorage",
    );
    await waitForExpression(
      page,
      "document.querySelector('.orientation-door__action') === document.activeElement",
    );
    const entryState = await evaluate(
      page,
      `({
        language: navigator.language,
        title: document.querySelector('#home-title')?.textContent,
        doors: Array.from(document.querySelectorAll('.orientation-door')).map((door) => ({
          family: door.getAttribute('data-family'),
          orientation: door.querySelector('.orientation-door__orientation')?.textContent,
          title: door.querySelector('h2')?.textContent,
          description: Array.from(door.querySelectorAll('p')).at(-1)?.textContent,
          href: door.querySelector('a')?.href,
          linkLabel: door.querySelector('a')?.getAttribute('aria-label')
        })),
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
      })`,
    );
    const entryIsFrench = entryState.language.toLowerCase().startsWith("fr");
    assert.equal(
      entryState.title,
      entryIsFrench ? "Deux mani\u00e8res de poursuivre" : "Two ways to continue",
    );
    assert.deepEqual(
      entryState.doors,
      entryIsFrench
        ? [
            {
              family: "narrative-packs",
              orientation: "VIVRE",
              title: "Packs narratifs",
              description: "Des exp\u00e9riences narratives \u00e0 traverser.",
              href: libraryUrl,
              linkLabel: "Entrer \u2014 VIVRE, Packs narratifs",
            },
            {
              family: "augmented-workshops",
              orientation: "CR\u00c9ER",
              title: "Ateliers augment\u00e9s",
              description: "Des formations cr\u00e9atives pour apprendre \u00e0 cr\u00e9er avec l\u2019IA.",
              href: workshopsUrl,
              linkLabel: "Entrer \u2014 CR\u00c9ER, Ateliers augment\u00e9s",
            },
          ]
        : [
            {
              family: "narrative-packs",
              orientation: "LIVE",
              title: "Narrative Packs",
              description: "Narrative experiences to journey through.",
              href: libraryUrl,
              linkLabel: "Enter \u2014 LIVE, Narrative Packs",
            },
            {
              family: "augmented-workshops",
              orientation: "CREATE",
              title: "Augmented workshops",
              description: "Creative learning paths for learning to create with AI.",
              href: workshopsUrl,
              linkLabel: "Enter \u2014 CREATE, Augmented workshops",
            },
          ],
    );
    assert.equal(entryState.noHorizontalOverflow, true);

    await evaluate(page, "document.querySelector('[data-family=\"narrative-packs\"] a')?.click()");
    await waitForExpression(
      page,
      "window.location.pathname.endsWith('/bibliotheque/') && document.querySelectorAll('.work-card').length >= 1",
    );
    assert.equal(
      await evaluate(page, "window.location.pathname.endsWith('/bibliotheque/')"),
      true,
      "the VIVRE door should navigate to the narrative packs library",
    );

    await loadUrl(page, entryUrl);
    await waitForOrientationReady(page);
    assert.equal(
      await evaluate(page, "document.querySelector('.prologue') === null"),
      true,
      "returning to the public root in the same session should not replay the threshold",
    );

    await evaluate(page, "document.querySelector('[data-family=\"augmented-workshops\"] a')?.click()");
    await waitForExpression(
      page,
      "window.location.pathname.endsWith('/ateliers/') && document.querySelectorAll('.workshop-card').length === 4",
    );
    assert.equal(
      await evaluate(page, "window.location.pathname.endsWith('/ateliers/')"),
      true,
      "the CRÉER door should navigate to the augmented workshops page",
    );

    const packOverrideUrl = `${entryUrl}?pack=examples/demo-pack/pack.json`;
    await loadUrl(page, packOverrideUrl);
    await waitForPrologueReady(page);
    await crossPrologue(page);
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 9");

    await loadUrl(page, workshopsUrl);
    await waitForExpression(page, "document.querySelectorAll('.workshop-card').length === 4");
    await waitForExpression(
      page,
      "document.querySelector('[data-workshop-id=\"ecriture-augmentee\"] .workshop-card__cover img')?.complete === true && document.querySelector('[data-workshop-id=\"ecriture-augmentee\"] .workshop-card__cover img')?.naturalWidth === 853",
    );
    const workshopsState = await evaluate(
      page,
      `({
        language: navigator.language,
        title: document.querySelector('#workshops-title')?.textContent,
        cards: Array.from(document.querySelectorAll('.workshop-card')).map((card) => ({
          id: card.getAttribute('data-workshop-id'),
          status: card.getAttribute('data-status'),
          visibleStatus: card.querySelector('.workshop-card__status')?.textContent,
          orientation: card.querySelector('.workshop-card__orientation')?.textContent,
          title: card.querySelector('h2')?.textContent,
          description: Array.from(card.querySelectorAll('p')).at(-2)?.textContent,
          access: card.querySelector('.workshop-card__access')?.textContent,
          linkCount: card.querySelectorAll('a').length,
          href: card.querySelector('a')?.href ?? null,
          role: card.getAttribute('role'),
          tabIndex: card.getAttribute('tabindex'),
          coverPresent: Boolean(card.querySelector('.workshop-card__cover img')),
          coverAlt: card.querySelector('.workshop-card__cover img')?.getAttribute('alt') ?? null,
          coverSrc: card.querySelector('.workshop-card__cover img')?.currentSrc ?? '',
          coverNaturalWidth: card.querySelector('.workshop-card__cover img')?.naturalWidth ?? 0,
          coverNaturalHeight: card.querySelector('.workshop-card__cover img')?.naturalHeight ?? 0,
          coverObjectFit: card.querySelector('.workshop-card__cover img')
            ? getComputedStyle(card.querySelector('.workshop-card__cover img')).objectFit
            : null,
        })),
        workshopHrefCount: Array.from(document.querySelectorAll('.workshop-card a')).length,
        workshopPackLinkCount: Array.from(document.querySelectorAll('.workshop-card a')).filter((link) => link.href.includes('?pack=')).length,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
      })`,
    );
    const workshopsIsFrench = workshopsState.language.toLowerCase().startsWith("fr");
    assert.equal(
      workshopsState.title,
      workshopsIsFrench ? "Apprendre \u00e0 cr\u00e9er avec l\u2019IA" : "Learn to create with AI",
    );
    assert.deepEqual(
      workshopsState.cards,
      workshopsIsFrench
        ? [
            {
              id: "ecriture-augmentee",
              status: "published",
              visibleStatus: "Atelier publi\u00e9",
              orientation: "\u00c9CRIRE",
              title: "\u00c9criture augment\u00e9e",
              description: "Un atelier d\u2019\u00e9criture en 7 mouvements pour apprendre \u00e0 dialoguer avec l\u2019IA sans lui abandonner le geste d\u2019auteur.",
              access: "Ouvrir l\u2019atelier",
              linkCount: 1,
              href: `${entryUrl}ateliers/ecriture-augmentee/`,
              role: null,
              tabIndex: null,
              coverPresent: true,
              coverAlt:
                "Couverture verticale de l'atelier \u00c9criture augment\u00e9e montrant un carnet ouvert, une plume et des lettres lumineuses pr\u00e8s d'une fen\u00eatre.",
              coverSrc: workshopsState.cards[0].coverSrc,
              coverNaturalWidth: 853,
              coverNaturalHeight: 1280,
              coverObjectFit: "contain",
            },
            {
              id: "art-augmente",
              status: "planned",
              visibleStatus: "Pr\u00e9vu",
              orientation: "VOIR",
              title: "Art augment\u00e9",
              description: "Cr\u00e9er avec l\u2019IA sans renoncer \u00e0 son regard.",
              access: "Parcours en pr\u00e9paration",
              linkCount: 0,
              href: null,
              role: null,
              tabIndex: null,
              coverPresent: false,
              coverAlt: null,
              coverSrc: "",
              coverNaturalWidth: 0,
              coverNaturalHeight: 0,
              coverObjectFit: null,
            },
            {
              id: "cartographie-augmentee",
              status: "planned",
              visibleStatus: "Pr\u00e9vu",
              orientation: "RELIER",
              title: "Cartographie augment\u00e9e",
              description: "Rendre visibles les relations avec l\u2019IA.",
              access: "Parcours en pr\u00e9paration",
              linkCount: 0,
              href: null,
              role: null,
              tabIndex: null,
              coverPresent: false,
              coverAlt: null,
              coverSrc: "",
              coverNaturalWidth: 0,
              coverNaturalHeight: 0,
              coverObjectFit: null,
            },
            {
              id: "composer-recit-vivant-ia",
              status: "planned",
              visibleStatus: "Pr\u00e9vu",
              orientation: "COMPOSER",
              title: "Cr\u00e9er un R\u00e9cit Vivant avec l\u2019IA",
              description: "Faire dialoguer \u00e9criture, image et cartographie.",
              access: "Parcours en pr\u00e9paration",
              linkCount: 0,
              href: null,
              role: null,
              tabIndex: null,
              coverPresent: false,
              coverAlt: null,
              coverSrc: "",
              coverNaturalWidth: 0,
              coverNaturalHeight: 0,
              coverObjectFit: null,
            },
          ]
        : [
            {
              id: "ecriture-augmentee",
              status: "published",
              visibleStatus: "Published workshop",
              orientation: "WRITE",
              title: "Augmented writing",
              description: "A 7-movement writing workshop for learning to dialogue with AI without surrendering the authorial gesture.",
              access: "Open workshop",
              linkCount: 1,
              href: `${entryUrl}ateliers/ecriture-augmentee/`,
              role: null,
              tabIndex: null,
              coverPresent: true,
              coverAlt:
                "Couverture verticale de l'atelier \u00c9criture augment\u00e9e montrant un carnet ouvert, une plume et des lettres lumineuses pr\u00e8s d'une fen\u00eatre.",
              coverSrc: workshopsState.cards[0].coverSrc,
              coverNaturalWidth: 853,
              coverNaturalHeight: 1280,
              coverObjectFit: "contain",
            },
            {
              id: "art-augmente",
              status: "planned",
              visibleStatus: "Planned",
              orientation: "SEE",
              title: "Augmented art",
              description: "Creating with AI without giving up your gaze.",
              access: "Path in preparation",
              linkCount: 0,
              href: null,
              role: null,
              tabIndex: null,
              coverPresent: false,
              coverAlt: null,
              coverSrc: "",
              coverNaturalWidth: 0,
              coverNaturalHeight: 0,
              coverObjectFit: null,
            },
            {
              id: "cartographie-augmentee",
              status: "planned",
              visibleStatus: "Planned",
              orientation: "CONNECT",
              title: "Augmented mapping",
              description: "Making relationships visible with AI.",
              access: "Path in preparation",
              linkCount: 0,
              href: null,
              role: null,
              tabIndex: null,
              coverPresent: false,
              coverAlt: null,
              coverSrc: "",
              coverNaturalWidth: 0,
              coverNaturalHeight: 0,
              coverObjectFit: null,
            },
            {
              id: "composer-recit-vivant-ia",
              status: "planned",
              visibleStatus: "Planned",
              orientation: "COMPOSE",
              title: "Create a Living Story with AI",
              description: "Bringing writing, image, and mapping into dialogue.",
              access: "Path in preparation",
              linkCount: 0,
              href: null,
              role: null,
              tabIndex: null,
              coverPresent: false,
              coverAlt: null,
              coverSrc: "",
              coverNaturalWidth: 0,
              coverNaturalHeight: 0,
              coverObjectFit: null,
            },
          ],
    );
    assert.equal(workshopsState.cards[0].coverSrc.endsWith("/packs/workshop-001-ecriture-augmentee/assets/images/00-couverture-ecriture-augmentee.webp"), true);
    assert.equal(workshopsState.workshopHrefCount, 1);
    assert.equal(workshopsState.workshopPackLinkCount, 0);
    assert.equal(workshopsState.noHorizontalOverflow, true);

    await evaluate(page, `localStorage.removeItem(${JSON.stringify(augmentedWritingWorkshopProgressStorageKey)})`);
    await evaluate(page, `localStorage.setItem(${JSON.stringify(`${augmentedWritingWorkshopProgressStorageKey}:sentinel`)}, "keep")`);
    await evaluate(page, "document.querySelector('[data-workshop-id=\"ecriture-augmentee\"] a')?.focus()");
    assert.equal(
      await evaluate(page, "document.querySelector('[data-workshop-id=\"ecriture-augmentee\"] a') === document.activeElement"),
      true,
    );
    await evaluate(page, "document.querySelector('[data-workshop-id=\"ecriture-augmentee\"] a')?.click()");
    await waitForExpression(page, "document.querySelector('.workshop-entry') !== null");
    const emptyEntry = await readWorkshopEntryState(page);
    assert.equal(emptyEntry.present, true);
    assert.equal(emptyEntry.path.endsWith("/ateliers/ecriture-augmentee/"), true);
    assert.equal(emptyEntry.search, "");
    assert.equal(emptyEntry.title, "\u00c9CRITURE AUGMENT\u00c9E");
    assert.equal(emptyEntry.subtitle, "\u00c9crire avec l'IA sans lui abandonner sa voix");
    assert.equal(
      emptyEntry.description,
      "Un atelier d\u2019\u00e9criture en 7 mouvements pour apprendre \u00e0 dialoguer avec l\u2019IA sans lui abandonner le geste d\u2019auteur.",
    );
    assert.equal(emptyEntry.steps, "7 mouvements \u00b7 26 \u00e9tapes");
    assert.equal(emptyEntry.coverPresent, true);
    assert.equal(emptyEntry.coverAlt, "Couverture verticale de l'atelier \u00c9criture augment\u00e9e montrant un carnet ouvert, une plume et des lettres lumineuses pr\u00e8s d'une fen\u00eatre.");
    assert.equal(emptyEntry.coverNaturalWidth, 853);
    assert.equal(emptyEntry.coverNaturalHeight, 1280);
    assert.equal(emptyEntry.coverObjectFit, "contain");
    assert.equal(emptyEntry.primary, "Commencer l\u2019atelier");
    assert.equal(emptyEntry.secondary, null);
    assert.equal(emptyEntry.resume, null);
    assert.equal(emptyEntry.backHref, workshopsUrl);
    assert.equal(emptyEntry.noHorizontalOverflow, true);

    await evaluate(page, "document.querySelector('.workshop-entry__primary')?.click()");
    await waitForWorkshopReady(page, "01 / 26");
    const writingWorkshopPageOne = await readWorkshopState(page);
    assert.equal(new URL(await evaluate(page, "window.location.href")).pathname.endsWith("/ateliers/ecriture-augmentee/"), true);
    assert.equal(new URL(await evaluate(page, "window.location.href")).search, "");
    assert.equal(writingWorkshopPageOne.title, "\u00c9criture augment\u00e9e");
    assert.equal(writingWorkshopPageOne.subtitle, "\u00c9crire avec l'IA sans lui abandonner sa voix");
    assert.equal(writingWorkshopPageOne.movement, "MOUVEMENT I \u00b7 INTENTION");
    assert.equal(writingWorkshopPageOne.progress, "01 / 26");
    assert.equal(writingWorkshopPageOne.previousDisabled, true);
    assert.equal(writingWorkshopPageOne.nextDisabled, false);
    assert.equal(writingWorkshopPageOne.noHorizontalOverflow, true);
    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"next\"]')?.click()");
    await waitForWorkshopReady(page, "02 / 26");
    await evaluate(
      page,
      `(() => {
        const textarea = document.querySelector('textarea');
        textarea.value = '<script>alert(1)</script>';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      })()`,
    );
    const savedWritingProgress = await evaluate(
      page,
      `JSON.parse(localStorage.getItem(${JSON.stringify(augmentedWritingWorkshopProgressStorageKey)}))`,
    );
    assert.equal(savedWritingProgress.pageId, "page-02");
    assert.equal(savedWritingProgress.completed, false);
    await loadUrl(page, `${entryUrl}ateliers/ecriture-augmentee/`);
    await waitForExpression(page, "document.querySelector('.workshop-entry') !== null");
    const resumableEntry = await readWorkshopEntryState(page);
    assert.equal(resumableEntry.primary, "Reprendre l\u2019atelier");
    assert.equal(resumableEntry.secondary, "Recommencer");
    assert.equal(resumableEntry.resume, "Reprendre \u00e0 l\u2019\u00e9tape 2 sur 26");
    assert.equal(resumableEntry.confirmationPresent, false);

    await evaluate(page, "document.querySelector('.workshop-entry__primary')?.click()");
    await waitForWorkshopReady(page, "02 / 26");
    const writingWorkshopResumed = await readWorkshopState(page);
    assert.equal(writingWorkshopResumed.progress, "02 / 26");
    assert.equal(writingWorkshopResumed.textareaValue, "<script>alert(1)</script>");
    assert.equal(writingWorkshopResumed.noHorizontalOverflow, true);
    assert.equal(await evaluate(page, "document.body.textContent.includes('alert(1)')"), false);

    await loadUrl(page, `${entryUrl}ateliers/ecriture-augmentee/`);
    await waitForExpression(page, "document.querySelector('.workshop-entry') !== null");
    await evaluate(page, "document.querySelector('.workshop-entry__secondary')?.click()");
    const confirmEntry = await readWorkshopEntryState(page);
    assert.equal(confirmEntry.confirmationPresent, true);
    assert.equal(confirmEntry.confirmationTitle, "Recommencer l\u2019atelier ?");
    assert.deepEqual(confirmEntry.confirmationButtons, ["Annuler", "Recommencer"]);
    assert.equal(confirmEntry.activeText, "Annuler");
    assert.equal(
      await evaluate(page, `localStorage.getItem(${JSON.stringify(augmentedWritingWorkshopProgressStorageKey)}) !== null`),
      true,
    );
    await evaluate(page, "document.querySelector('.workshop-entry__confirm button')?.click()");
    const cancelledEntry = await readWorkshopEntryState(page);
    assert.equal(cancelledEntry.confirmationPresent, false);
    assert.equal(cancelledEntry.activeText, "Recommencer");
    assert.equal(
      await evaluate(page, `localStorage.getItem(${JSON.stringify(augmentedWritingWorkshopProgressStorageKey)}) !== null`),
      true,
    );
    await evaluate(page, "document.querySelector('.workshop-entry__secondary')?.click()");
    await evaluate(page, "Array.from(document.querySelectorAll('.workshop-entry__confirm button')).at(1)?.click()");
    await waitForWorkshopReady(page, "01 / 26");
    assert.equal(await evaluate(page, `localStorage.getItem(${JSON.stringify(augmentedWritingWorkshopProgressStorageKey)})`), null);
    assert.equal(
      await evaluate(page, `localStorage.getItem(${JSON.stringify(`${augmentedWritingWorkshopProgressStorageKey}:sentinel`)})`),
      "keep",
    );

    await loadUrl(page, `${entryUrl}ateliers/ecriture-augmentee/`);
    await waitForExpression(page, "document.querySelector('.workshop-entry') !== null");
    await evaluate(
      page,
      `localStorage.setItem(${JSON.stringify(augmentedWritingWorkshopProgressStorageKey)}, JSON.stringify({
        schemaVersion: 1,
        workshopId: 'ecriture-augmentee',
        workshopVersion: '1.0',
        pageId: 'page-26',
        updatedAt: new Date().toISOString(),
        completed: true,
        responses: {}
      }))`,
    );
    await loadUrl(page, `${entryUrl}ateliers/ecriture-augmentee/`);
    await waitForExpression(page, "document.querySelector('.workshop-entry') !== null");
    const completedEntry = await readWorkshopEntryState(page);
    assert.equal(completedEntry.primary, "Revoir l\u2019atelier");
    assert.equal(completedEntry.secondary, "Recommencer");
    assert.equal(completedEntry.resume, "Derni\u00e8re \u00e9tape atteinte : 26 sur 26");
    await evaluate(page, "document.querySelector('.workshop-entry__primary')?.click()");
    await waitForWorkshopReady(page, "26 / 26");
    const completedWorkshop = await readWorkshopState(page);
    assert.equal(completedWorkshop.pageTitle, "Continuer sans l'atelier");

    await loadUrl(page, `${entryUrl}ateliers/art-augmente/`);
    await waitForExpression(page, "document.querySelector('.error-panel') !== null");
    assert.equal(
      await evaluate(page, "document.querySelector('.workshop-player') === null && document.querySelector('.error-panel') !== null"),
      true,
      "a planned workshop slug must not load a workshop",
    );

    await loadUrl(page, `${entryUrl}ateliers/slug-inconnu/`);
    await waitForExpression(page, "document.querySelector('.error-panel') !== null");
    assert.equal(
      await evaluate(page, "document.querySelector('.workshop-player') === null && document.querySelector('.error-panel') !== null"),
      true,
      "an unknown workshop slug must not load a workshop",
    );

    const workshopDemoUrl = `${entryUrl}?pack=examples/workshop-demo/pack.json`;
    await loadUrl(page, workshopDemoUrl);
    await evaluate(
      page,
      `Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          async writeText(text) {
            window.__ineCopiedPrompt = text;
          }
        }
      })`,
    );
    await waitForWorkshopReady(page, "01 / 04");
    const workshopPageOne = await readWorkshopState(page);
    assert.equal(workshopPageOne.title, "Atelier augment\u00e9 \u2014 d\u00e9monstrateur technique");
    assert.equal(workshopPageOne.subtitle, "Runtime minimal des Ateliers augment\u00e9s");
    assert.equal(workshopPageOne.movement, "MOUVEMENT I \u00b7 ENTRER");
    assert.equal(workshopPageOne.pageTitle, "Entrer dans l'atelier");
    assert.equal(workshopPageOne.previousDisabled, true);
    assert.equal(workshopPageOne.nextDisabled, false);
    assert.equal(workshopPageOne.activeId, "workshop-page");
    assert.equal(workshopPageOne.noHorizontalOverflow, true);
    assert.equal(workshopPageOne.pageVisible, true);
    assert.equal(workshopPageOne.controlsInsideViewport, true);

    const assertMobileWorkshopNavigation = (state, label) => {
      assert.equal(state.noHorizontalOverflow, true, `${label} has horizontal overflow`);
      assert.equal(state.progressInsideViewport, true, `${label} progress overflows`);
      assert.equal(state.previousInsideViewport, true, `${label} previous button overflows`);
      assert.equal(state.nextInsideViewport, true, `${label} next button overflows`);
      assert.equal(state.resetInsideViewport, true, `${label} reset button overflows`);
      assert.equal(state.resetBelowControls, true, `${label} reset button is not on its own row`);
      assert.equal(state.resetCentered, true, `${label} reset button is not centered`);
    };

    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await waitForWorkshopReady(page, "01 / 04");
    assertMobileWorkshopNavigation(await readWorkshopState(page), "mobile workshop page 01");

    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"next\"]')?.click()");
    await waitForWorkshopReady(page, "02 / 04");
    const workshopPageTwo = await readWorkshopState(page);
    assert.equal(workshopPageTwo.movement, "MOUVEMENT I \u00b7 ENTRER");
    assert.equal(workshopPageTwo.pageTitle, "\u00c9crire quelques mots");
    assert.equal(workshopPageTwo.previousDisabled, false);
    assertMobileWorkshopNavigation(workshopPageTwo, "mobile workshop page 02");
    assert.equal(workshopPageTwo.pendingBlocks, 0);
    assert.equal(workshopPageTwo.textareaCount, 1);
    assert.equal(workshopPageTwo.textareaLabel, "Note technique temporaire");
    assert.equal(workshopPageTwo.textareaValue, "");
    await evaluate(
      page,
      `(() => {
        const textarea = document.querySelector('textarea');
        textarea.value = '<script>alert("test")</script> Une première trace';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      })()`,
    );

    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"next\"]')?.click()");
    await waitForWorkshopReady(page, "03 / 04");
    const workshopPageThree = await readWorkshopState(page);
    assert.equal(workshopPageThree.movement, "MOUVEMENT II \u00b7 EXPLORER");
    assert.equal(workshopPageThree.pageTitle, "Choisir une piste");
    assert.equal(workshopPageThree.pendingBlocks, 0);
    assert.equal(workshopPageThree.inputCount, 3);
    assert.deepEqual(workshopPageThree.choiceLabels, ["Lire", "\u00c9crire", "R\u00e9v\u00e9ler"]);
    assert.deepEqual(workshopPageThree.checkedChoices, []);
    assert.equal(workshopPageThree.promptButtonText, "Copier le prompt");
    assert.equal(
      workshopPageThree.promptText,
      "\u00c0 partir de cette note technique, propose trois questions pour ouvrir plusieurs pistes sans choisir \u00e0 ma place.",
    );
    await evaluate(page, "document.querySelector('input[value=\"reveler\"]')?.click()");
    assert.deepEqual((await readWorkshopState(page)).checkedChoices, ["reveler"]);
    await evaluate(page, "document.querySelector('.workshop-prompt-copy__button')?.click()");
    await waitForExpression(
      page,
      "document.querySelector('.workshop-prompt-copy__status')?.textContent === 'Prompt copi\u00e9'",
    );
    const copiedPromptState = await readWorkshopState(page);
    assert.equal(copiedPromptState.promptStatus, "Prompt copi\u00e9");
    assert.equal(copiedPromptState.copiedPrompt, copiedPromptState.promptText);

    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"previous\"]')?.click()");
    await waitForWorkshopReady(page, "02 / 04");
    assert.equal((await readWorkshopState(page)).textareaValue, "<script>alert(\"test\")</script> Une premi\u00e8re trace");
    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"next\"]')?.click()");
    await waitForWorkshopReady(page, "03 / 04");
    assert.deepEqual((await readWorkshopState(page)).checkedChoices, ["reveler"]);
    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"next\"]')?.click()");
    await waitForWorkshopReady(page, "04 / 04");
    const workshopPageFour = await readWorkshopState(page);
    assert.equal(workshopPageFour.movement, "MOUVEMENT II \u00b7 EXPLORER");
    assert.equal(workshopPageFour.pageTitle, "R\u00e9v\u00e9ler une information");
    assert.equal(workshopPageFour.previousDisabled, false);
    assert.equal(workshopPageFour.nextDisabled, true);
    assert.equal(workshopPageFour.pendingBlocks, 0);
    assert.equal(workshopPageFour.recallText, "<script>alert(\"test\")</script> Une premi\u00e8re trace");
    assert.equal(workshopPageFour.revealExpanded, "false");
    assert.equal(workshopPageFour.revealControls, workshopPageFour.revealContentId);
    assert.equal(workshopPageFour.revealHidden, true);
    assert.equal(workshopPageFour.exitHref, workshopsUrl);
    assert.equal(workshopPageFour.noHorizontalOverflow, true);
    await evaluate(page, "document.querySelector('.workshop-reveal__button')?.click()");
    const revealedWorkshop = await readWorkshopState(page);
    assert.equal(revealedWorkshop.revealExpanded, "true");
    assert.equal(revealedWorkshop.revealHidden, false);
    assert.equal(revealedWorkshop.revealText.includes("reste ouvert pendant cette travers\u00e9e"), true);
    assert.equal(["ARTICLE", "BUTTON"].includes(revealedWorkshop.activeTag), true);
    await evaluate(page, "document.querySelector('#workshop-page')?.focus()");
    const savedWorkshopProgress = await readStoredWorkshopProgress(page);
    assert.equal(savedWorkshopProgress.pageId, "page-04");
    assert.equal(savedWorkshopProgress.completed, true);
    assert.equal(savedWorkshopProgress.responses["technical-note"], "<script>alert(\"test\")</script> Une premi\u00e8re trace");
    assert.equal(savedWorkshopProgress.responses["technical-choice"], "reveler");
    assert.equal(savedWorkshopProgress.responses["technical-reveal"], true);
    assert.equal("technical-prompt" in savedWorkshopProgress.responses, false);

    await loadUrl(page, workshopDemoUrl);
    await waitForWorkshopReady(page, "04 / 04");
    const restoredWorkshop = await readWorkshopState(page);
    assert.equal(restoredWorkshop.recallText, "<script>alert(\"test\")</script> Une premi\u00e8re trace");
    assert.equal(restoredWorkshop.revealExpanded, "true");
    assert.equal(restoredWorkshop.revealHidden, false);

    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
    ]) {
      await page.send("Emulation.setDeviceMetricsOverride", {
        ...viewport,
        deviceScaleFactor: 1,
        mobile: viewport.width < 600,
      });
      await waitForWorkshopReady(page, "04 / 04");
      const responsiveWorkshop = await readWorkshopState(page);
      assert.equal(responsiveWorkshop.noHorizontalOverflow, true, `workshop ${viewport.width} has horizontal overflow`);
      assert.equal(responsiveWorkshop.pageVisible, true, `workshop ${viewport.width} page is not visible`);
      assert.equal(responsiveWorkshop.controlsInsideViewport, true, `workshop ${viewport.width} controls overflow`);
      if (viewport.width === 390) {
        assert.equal(responsiveWorkshop.progressInsideViewport, true, "mobile workshop progress overflows");
        assert.equal(responsiveWorkshop.previousInsideViewport, true, "mobile workshop previous button overflows");
        assert.equal(responsiveWorkshop.nextInsideViewport, true, "mobile workshop next button overflows");
        assert.equal(responsiveWorkshop.resetInsideViewport, true, "mobile workshop reset button overflows");
        assert.equal(responsiveWorkshop.resetBelowControls, true, "mobile workshop reset button is not on its own row");
        assert.equal(responsiveWorkshop.resetCentered, true, "mobile workshop reset button is not centered");
      }
    }

    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"next\"]')?.click()");
    await waitForWorkshopReady(page, "04 / 04");
    assert.equal((await readWorkshopState(page)).pageTitle, "R\u00e9v\u00e9ler une information");
    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"previous\"]')?.click()");
    await waitForWorkshopReady(page, "03 / 04");
    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"previous\"]')?.click()");
    await waitForWorkshopReady(page, "02 / 04");
    await evaluate(
      page,
      `(() => {
        const textarea = document.querySelector('textarea');
        textarea.value = 'Une trace r\u00e9\u00e9crite depuis le retour';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      })()`,
    );
    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"next\"]')?.click()");
    await waitForWorkshopReady(page, "03 / 04");
    assert.deepEqual((await readWorkshopState(page)).checkedChoices, ["reveler"]);
    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"next\"]')?.click()");
    await waitForWorkshopReady(page, "04 / 04");
    const returnedReveal = await readWorkshopState(page);
    assert.equal(returnedReveal.recallText, "Une trace r\u00e9\u00e9crite depuis le retour");
    assert.equal(returnedReveal.revealExpanded, "true");
    assert.equal(returnedReveal.revealHidden, false);

    await evaluate(page, `localStorage.setItem(${JSON.stringify(`${workshopProgressStorageKey}:sentinel`)}, "keep")`);
    assert.equal((await readStoredWorkshopProgress(page)).responses["technical-note"], "Une trace r\u00e9\u00e9crite depuis le retour");
    await evaluate(page, "document.querySelector('.workshop-reset')?.click()");
    assert.equal((await readWorkshopState(page)).resetText, "Confirmer l'effacement");
    await evaluate(page, "document.querySelector('.workshop-reset')?.click()");
    await waitForWorkshopReady(page, "01 / 04");
    assert.equal(await readStoredWorkshopProgress(page), null);
    assert.equal(
      await evaluate(page, `localStorage.getItem(${JSON.stringify(`${workshopProgressStorageKey}:sentinel`)})`),
      "keep",
    );
    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"next\"]')?.click()");
    await waitForWorkshopReady(page, "02 / 04");
    assert.equal((await readWorkshopState(page)).textareaValue, "");
    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"next\"]')?.click()");
    await waitForWorkshopReady(page, "03 / 04");
    assert.deepEqual((await readWorkshopState(page)).checkedChoices, []);
    await evaluate(page, "document.querySelector('[data-workshop-navigation=\"next\"]')?.click()");
    await waitForWorkshopReady(page, "04 / 04");
    const clearedWorkshop = await readWorkshopState(page);
    assert.equal(clearedWorkshop.recallText, "Aucune note technique n'a encore \u00e9t\u00e9 formul\u00e9e.");
    assert.equal(clearedWorkshop.revealExpanded, "false");

    await loadUrl(page, workshopsUrl);
    await waitForExpression(page, "window.location.pathname.endsWith('/ateliers/') && document.querySelectorAll('.workshop-card').length === 4");

    await loadUrl(page, libraryUrl);
    await waitForExpression(page, "document.querySelectorAll('.work-card').length === 13");
    const libraryState = await evaluate(
      page,
      `({
        language: navigator.language,
        title: document.querySelector('#library-title')?.textContent,
        eyebrow: document.querySelector('.library__eyebrow')?.textContent,
        signature: document.querySelector('.library__signature')?.textContent,
        orientation: document.querySelector('.library__orientation')?.textContent,
        prompt: document.querySelector('.library__prompt')?.textContent,
        cards: Array.from(document.querySelectorAll('.work-card')).map((card) => ({
          title: card.querySelector('h2')?.textContent,
          slug: card.getAttribute('data-work-slug'),
          imageAlt: card.querySelector('img')?.getAttribute('alt'),
          imagePosition: getComputedStyle(card.querySelector('img')).objectPosition,
          href: card.querySelector('a')?.getAttribute('href'),
          linkLabel: card.querySelector('a')?.getAttribute('aria-label')
        })),
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
      })`,
    );
    const expectedLibraryTitle = libraryState.language.toLowerCase().startsWith("fr")
      ? "Un monde narratif habitable"
      : "A habitable narrative world";
    assert.equal(libraryState.title, expectedLibraryTitle);
    assert.equal(libraryState.eyebrow, libraryState.language.toLowerCase().startsWith("fr")
      ? "VIVRE \u00b7 Packs narratifs"
      : "LIVE \u00b7 Narrative Packs");
    assert.equal(
      libraryState.signature,
      libraryState.language.toLowerCase().startsWith("fr")
        ? "Les R\u00e9cits Vivants ne sont pas seulement des histoires \u00e0 lire. Ce sont des mondes \u00e0 explorer, des passages \u00e0 traverser et des exp\u00e9riences qui invitent chacun \u00e0 habiter autrement le r\u00e9el."
        : "Living Stories are not only stories to read. They are worlds to explore, passages to cross, and experiences that invite each person to inhabit reality differently.",
    );
    assert.equal(libraryState.orientation.includes("porte d\u2019entr\u00e9e") || libraryState.orientation.includes("entryway"), true);
    assert.equal(libraryState.prompt.includes("R\u00e9cits Vivants") || libraryState.prompt.includes("Living Stories"), true);
    assert.deepEqual(
      libraryState.cards.map(({ title }) => title),
      [
        "Les Gardiens des R\u00e9cits Vivants",
        "Polarit\u00e9s Vivantes",
        "Atlas des R\u00e9cits Vivants",
        "La Voie du Milieu",
        "Les r\u00e9cits qui r\u00e9v\u00e8lent\u2026 ou qui enferment",
        "La M\u00e9tamorphose",
        "Jouer pour devenir",
        "Le Veilleur",
        "Trouver sa juste place",
        "Le Monde commun",
        "La Joie lucide",
        "Celle que je n’avais pas encore rencontrée",
        "La Chaise",
      ],
    );
    assert.equal(libraryState.cards.every(({ imageAlt, linkLabel }) => imageAlt.length > 0 && linkLabel.length > 0), true);
    assert.equal(libraryState.cards[0].href.endsWith("/oeuvres/les-gardiens-des-recits-vivants/"), true);
    assert.equal(libraryState.cards[1].href.endsWith("/oeuvres/polarites-vivantes/"), true);
    assert.equal(libraryState.cards[2].href.endsWith("/oeuvres/atlas-recits-vivants/"), true);
    assert.equal(libraryState.cards[3].href.endsWith("/oeuvres/voie-du-milieu/"), true);
    assert.equal(libraryState.cards[4].href.endsWith("/oeuvres/recits-qui-revelent-ou-enferment/"), true);
    assert.equal(libraryState.cards[5].href.endsWith("/oeuvres/la-metamorphose/"), true);
    assert.equal(libraryState.cards[6].href.endsWith("/oeuvres/jouer-pour-devenir/"), true);
    assert.equal(libraryState.cards[7].href.endsWith("/oeuvres/le-veilleur/"), true);
    assert.equal(libraryState.cards[8].href.endsWith("/oeuvres/trouver-sa-juste-place/"), true);
    assert.equal(libraryState.cards[9].href.endsWith("/oeuvres/le-monde-commun/"), true);
    assert.equal(libraryState.cards[10].href.endsWith("/oeuvres/la-joie-lucide/"), true);
    assert.equal(libraryState.cards[11].href.endsWith("/oeuvres/celle-que-je-navais-pas-encore-rencontree/"), true);
    assert.equal(libraryState.cards[12].href.endsWith("/oeuvres/la-chaise/"), true);
    assert.equal(libraryState.cards[0].slug, "les-gardiens-des-recits-vivants");
    assert.equal(libraryState.cards[1].slug, "polarites-vivantes");
    assert.equal(libraryState.cards[2].slug, "atlas-recits-vivants");
    assert.equal(libraryState.cards[3].slug, "voie-du-milieu");
    assert.equal(libraryState.cards[4].slug, "recits-qui-revelent-ou-enferment");
    assert.equal(libraryState.cards[5].slug, "la-metamorphose");
    assert.equal(libraryState.cards[6].slug, "jouer-pour-devenir");
    assert.equal(libraryState.cards[7].slug, "le-veilleur");
    assert.equal(libraryState.cards[8].slug, "trouver-sa-juste-place");
    assert.equal(libraryState.cards[9].slug, "le-monde-commun");
    assert.equal(libraryState.cards[10].slug, "la-joie-lucide");
    assert.equal(libraryState.cards[11].slug, "celle-que-je-navais-pas-encore-rencontree");
    assert.equal(libraryState.cards[12].slug, "la-chaise");
    assert.equal(libraryState.cards[0].imagePosition, "50% 50%");
    assert.equal(libraryState.cards[1].imagePosition, "50% 50%");
    assert.equal(libraryState.cards[2].imagePosition, "50% 0%");
    assert.equal(libraryState.cards[3].imagePosition, "50% 50%");
    assert.equal(libraryState.cards[4].imagePosition, "50% 50%");
    assert.equal(libraryState.cards[5].imagePosition, "50% 50%");
    assert.equal(libraryState.cards[6].imagePosition, "50% 50%");
    assert.equal(libraryState.cards[7].imagePosition, "50% 50%");
    assert.equal(libraryState.cards[8].imagePosition, "50% 0%");
    assert.equal(libraryState.cards[9].imagePosition, "50% 50%");
    assert.equal(libraryState.cards[10].imagePosition, "50% 50%");
    assert.equal(libraryState.cards[11].imagePosition, "50% 50%");
    assert.equal(libraryState.cards[12].imagePosition, "50% 50%");
    assert.equal(libraryState.noHorizontalOverflow, true);

    await evaluate(
      page,
      "document.querySelector('[data-work-slug=\"les-gardiens-des-recits-vivants\"] .work-card__action')?.click()",
    );
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 9");
    assert.equal(
      await evaluate(page, "document.querySelector('.prologue') === null"),
      true,
      "opening the home pack from the library after the public threshold should not replay Le Seuil",
    );
    assert.equal(
      await evaluate(page, `sessionStorage.getItem(${JSON.stringify(publicThresholdSkipHomeIntroKey)})`),
      null,
      "the library-origin skip intent should be consumed once",
    );

    await evaluate(page, "setTimeout(() => history.back(), 0); true");
    await waitForExpression(
      page,
      "window.location.pathname.endsWith('/bibliotheque/') && document.querySelectorAll('.work-card').length === 13",
    );
    assert.equal(
      await evaluate(page, `sessionStorage.getItem(${JSON.stringify(publicThresholdSkipHomeIntroKey)})`),
      null,
      "browser back should not leave a residual home intro skip intent",
    );

    await loadUrl(page, url);
    await waitForPrologueReady(page);
    await loadUrl(page, url);
    await waitForPrologueReady(page);
    await enterPrologue(page);
    await waitForPlayerReady(page, "Scène 1 / 9");
    const progressAfterThreshold = await readStoredProgress(page);
    assert.equal(progressAfterThreshold.sceneId, "scene-01");
    assert.equal(progressAfterThreshold.sceneIndex, 0);
    assert.equal(progressAfterThreshold.completed, false);

    const first = await readStablePlayerState(page, "Scène 1 / 9");
    assert.equal(first.lang, "fr");
    assert.equal(first.engineTitleData, "Immersive Narrative Engine");
    assert.equal(first.packIdData, "les-gardiens-des-recits-vivants");
    assert.equal(first.hasVisibleEngineBrand, false);
    assert.equal(first.hasVisiblePackLabel, false);
    assert.equal(first.packTitle, "Les Gardiens des Récits Vivants");
    assert.equal(first.sceneTitle, "La Gardienne des profondeurs");
    assert.equal(first.progress, "Scène 1 / 9");
    assert.equal(first.previousDisabled, true);
    assert.equal(first.nextDisabled, false);
    assert.equal(first.busy, null);
    assert.equal(first.transitionName, null);
    assert.equal(first.playerCount, 1);
    assert.equal(first.hiddenPlayerCount, 0);
    assertSceneImageReady(first);
    assert.equal(first.stepCount, 9);
    assert.equal(first.sceneBorderWidth, "0px");

    assert.equal(first.noHorizontalOverflow, true);
    assert.equal(first.noVerticalOverflow, true);
    assert.equal(first.controlsVisibleVertically, true);
    assert.equal(first.hasHeading, true);
    assert.equal(first.hasNamedButtons, true);
    assert.equal(first.hasArticle, true);
    assert.ok(first.imageAlt.length > 0);
    assert.equal(first.currentSrc.endsWith("scene-02-cosmic-whale.png"), true);
    assert.deepEqual(first.focusable, [
      { text: "Passer au récit", disabled: false },
      { text: "Précédent", disabled: true },
      { text: "Suivant", disabled: false },
      { text: "Explorer les œuvres", disabled: false },
    ]);

    await loadUrl(page, url);
    await waitForPrologueReady(page);
    await enterPrologue(page);
    await waitForPlayerReady(page, "Scène 1 / 9");
    assert.equal((await readStoredProgress(page)).sceneId, "scene-01");

    await evaluate(
      page,
      `(() => {
        window.__ineAnimations = [];
        window.__ineBusyObserved = false;
        window.__ineControlsDisabledDuringBusy = false;
        window.__ineProgressWrites = [];
        const app = document.querySelector('#app');
        const observer = new MutationObserver(() => {
          if (app?.getAttribute('aria-busy') === 'true') {
            window.__ineBusyObserved = true;
            window.__ineControlsDisabledDuringBusy = Array.from(document.querySelectorAll('button')).every((button) => button.disabled);
          }
        });
        if (app) observer.observe(app, { attributes: true, attributeFilter: ['aria-busy'] });
        const originalAnimate = Element.prototype.animate;
        Element.prototype.animate = function(keyframes, options) {
          window.__ineAnimations.push({ className: this.className, keyframes, options });
          return originalAnimate.call(this, keyframes, options);
        };
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
          if (key === ${JSON.stringify(progressStorageKey)}) {
            window.__ineProgressWrites.push({
              busy: app?.getAttribute('aria-busy'),
              transition: app?.getAttribute('data-transition'),
              value: JSON.parse(value)
            });
          }
          return originalSetItem.call(this, key, value);
        };
      })()`,
    );

    await evaluate(
      page,
      `(() => {
        const next = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Suivant');
        next?.click();
        next?.click();
      })()`,
    );
    await waitForExpression(page, "window.__ineBusyObserved === true", 1_000);
    assert.equal(await evaluate(page, "window.__ineControlsDisabledDuringBusy"), true);
    await waitForPlayerReady(page, "Scène 2 / 9");
    const afterDoubleActivation = await readStablePlayerState(page, "Scène 2 / 9");
    assert.equal(afterDoubleActivation.progress, "Scène 2 / 9");
    assert.equal(afterDoubleActivation.busy, null);
    assert.equal(afterDoubleActivation.transitionName, null);
    assert.equal(afterDoubleActivation.playerCount, 1);
    assert.equal(afterDoubleActivation.hiddenPlayerCount, 0);
    assert.equal(afterDoubleActivation.activeElementText, "Suivant");
    assert.ok((await evaluate(page, "window.__ineAnimations.length")) >= 2);
    assert.deepEqual(
      await evaluate(page, "window.__ineProgressWrites.map((write) => ({ busy: write.busy, transition: write.transition, sceneId: write.value.sceneId }))"),
      [{ busy: null, transition: null, sceneId: "scene-02" }],
    );
    const progressAfterDoubleActivation = await readStoredProgress(page);
    assert.equal(progressAfterDoubleActivation.sceneId, "scene-02");
    assert.equal(progressAfterDoubleActivation.sceneIndex, 1);
    assert.equal(progressAfterDoubleActivation.completed, false);

    await clickLocalizedNext(page, "Scène 3 / 9");
    assert.equal((await readStoredProgress(page)).sceneId, "scene-03");
    await clickLocalizedNext(page, "Scène 4 / 9");
    assert.equal((await readStoredProgress(page)).sceneId, "scene-04");

    await loadUrl(page, url);
    await crossPrologue(page);
    await waitForResumePrompt(page, "Vous vous êtes arrêté à la scène 4 sur 9.");
    await clickResumeAction(page, "resume");
    await waitForPlayerReady(page, "Scène 4 / 9");
    const resumed = await readStablePlayerState(page, "Scène 4 / 9");
    assert.equal(resumed.progress, "Scène 4 / 9");
    assert.equal(resumed.activeElementText, "Suivant");
    assert.equal((await readStoredProgress(page)).sceneIndex, 3);

    await loadUrl(page, url);
    await crossPrologue(page);
    await waitForResumePrompt(page, "Vous vous êtes arrêté à la scène 4 sur 9.");
    await clickResumeAction(page, "restart");
    await waitForPlayerReady(page, "Scène 1 / 9");
    const restarted = await readStablePlayerState(page, "Scène 1 / 9");
    assert.equal(restarted.progress, "Scène 1 / 9");
    assert.equal(restarted.previousDisabled, true);
    assert.equal(restarted.nextDisabled, false);
    assert.equal((await readStoredProgress(page)).sceneId, "scene-01");

    for (let index = 2; index <= 9; index += 1) {
      await clickLocalizedNext(page, `Scène ${index} / 9`);
      const state = await readStablePlayerState(page, `Scène ${index} / 9`);
      assert.equal(state.progress, `Scène ${index} / 9`);
      assert.equal(state.busy, null);
      assert.equal(state.playerCount, 1);
      assert.equal(state.hiddenPlayerCount, 0);
      if (index <= 8) assertSceneImageReady(state);
      else assert.equal(state.currentSrc, "");
      assert.equal(state.activeElementText, index === 9 ? "Poursuivre votre exploration" : "Suivant");
    }

    const last = await readStablePlayerState(page, "Scène 9 / 9");
    assert.equal(last.nextDisabled, true);
    assert.equal(last.previousDisabled, false);
    assert.equal(
      await evaluate(page, "document.querySelector('[data-library-continuation]')?.href.endsWith('/bibliotheque/')"),
      true,
    );
    const completedProgress = await readStoredProgress(page);
    assert.equal(completedProgress.sceneId, "scene-09");
    assert.equal(completedProgress.sceneIndex, 8);
    assert.equal(completedProgress.completed, true);

    await loadUrl(page, url);
    await crossPrologue(page);
    await waitForResumePrompt(page, "Vous vous êtes arrêté à la scène 9 sur 9.");
    await clickResumeAction(page, "resume");
    await waitForPlayerReady(page, "Scène 9 / 9");

    await evaluate(page, "Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Précédent')?.click()");
    await waitForPlayerReady(page, "Scène 8 / 9");
    const previousState = await readStablePlayerState(page, "Scène 8 / 9");
    assert.equal(previousState.activeElementText, "Précédent");
    assert.equal(previousState.busy, null);
    assert.equal(previousState.playerCount, 1);

    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1280, height: 800 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 430, height: 932 },
      { width: 390, height: 844 },
      { width: 360, height: 800 },
    ]) {
      await page.send("Emulation.setDeviceMetricsOverride", {
        ...viewport,
        deviceScaleFactor: 1,
        mobile: viewport.width < 600,
      });
      await clearReadingProgress(page);
      await navigate(page, url);
      await waitForPlayerReady(page, "Scène 1 / 9");
      const state = await readStablePlayerState(page, "Scène 1 / 9");
      assert.equal(state.noHorizontalOverflow, true, `${viewport.width} has horizontal overflow`);
      assert.equal(state.noVerticalOverflow, true, `${viewport.width} has vertical overflow`);
      assert.equal(state.controlsInsideViewport, true, `${viewport.width} controls overflow`);
      assert.equal(state.controlsVisibleVertically, true, `${viewport.width} controls below viewport`);
      assert.equal(state.contentInsideViewport, true, `${viewport.width} content overflow`);
      assertSceneImageReady(state);
      assert.deepEqual(state.buttons, ["Précédent", "Suivant"]);
      const libraryControl = await evaluate(
        page,
        `(() => {
          const control = document.querySelector('.site-navigation a');
          const title = document.querySelector('.player__work-title');
          if (!control || !title) return null;
          const controlRect = control.getBoundingClientRect();
          const titleRect = title.getBoundingClientRect();
          const overlapsTitle = !(
            controlRect.right <= titleRect.left ||
            controlRect.left >= titleRect.right ||
            controlRect.bottom <= titleRect.top ||
            controlRect.top >= titleRect.bottom
          );
          return {
            width: controlRect.width,
            height: controlRect.height,
            opacity: Number.parseFloat(getComputedStyle(control).opacity),
            overlapsTitle
          };
        })()`,
      );
      assert.ok(libraryControl, `${viewport.width} library control missing`);
      assert.equal(libraryControl.width, 44, `${viewport.width} library control width`);
      assert.equal(libraryControl.height, 44, `${viewport.width} library control height`);
      assert.ok(libraryControl.opacity < 0.75, `${viewport.width} library control is too prominent`);
      assert.equal(libraryControl.overlapsTitle, false, `${viewport.width} library control overlaps title`);
    }

    const polarityPackUrl = `${entryUrl}oeuvres/polarites-vivantes/`;
    await loadUrl(page, polarityPackUrl);
    await waitForExpression(page, "document.querySelector('.prologue__title')?.textContent === 'Polarités Vivantes'");
    await waitForExpression(
      page,
      "document.querySelector('.prologue__cover')?.currentSrc.endsWith('/00-couverture.webp') === true && document.querySelector('.prologue__cover')?.complete === true && document.querySelector('.prologue__cover')?.naturalWidth > 0",
    );
    await evaluate(page, "document.querySelector('.prologue button')?.click()");
    const polarityTitles = [
      "Entre affirmation et don",
      "Entre autonomie et appartenance",
      "Entre mémoire et avenir",
      "Entre proximité et liberté",
      "Entre identité et transformation",
      "Entre parole et silence",
      "Entre conviction et dialogue",
      "Entre protection et ouverture",
      "Entre racines et horizons",
      "Entre fidélité et changement",
    ];
    await waitForExpression(page, `document.querySelector('.polarity__title')?.textContent === ${JSON.stringify(polarityTitles[0])}`);
    await waitForExpression(
      page,
      "document.querySelector('.polarity__image')?.complete === true && document.querySelector('.polarity__image')?.naturalWidth > 0",
    );
    let polarityState = await evaluate(
      page,
      `(() => ({
        poles: document.querySelectorAll('.polarity__pole').length,
        bridgeLabel: document.querySelector('.polarity__bridge')?.getAttribute('aria-label'),
        imageAlt: document.querySelector('.polarity__image')?.getAttribute('alt'),
        imageReady: document.querySelector('.polarity__image')?.complete === true,
        hasArticle: document.querySelector('.polarity__action--article') instanceof HTMLAnchorElement,
        articleHref: document.querySelector('.polarity__action--article')?.href,
        hasPrevious: document.querySelector('[data-polarity-action="previous"]') !== null,
        hasNext: document.querySelector('[data-polarity-action="next"]') !== null,
        libraryControlSize: document.querySelector('.site-navigation a')?.getBoundingClientRect().width,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
      }))()`,
    );
    assert.equal(polarityState.poles, 2);
    assert.ok(polarityState.bridgeLabel.length > 0);
    assert.ok(polarityState.imageAlt.length > 0);
    assert.equal(polarityState.imageReady, true);
    assert.equal(polarityState.hasArticle, true);
    assert.equal(
      polarityState.articleHref,
      "https://zephyr-avenel.blogspot.com/2026/07/les-tensions-fecondes-des-polarites.html?m=1",
    );
    assert.equal(polarityState.hasPrevious, false);
    assert.equal(polarityState.hasNext, true);
    assert.equal(polarityState.libraryControlSize, 44);
    assert.equal(polarityState.noHorizontalOverflow, true);
    const mobilePolarityActions = await evaluate(
      page,
      `Array.from(document.querySelectorAll('.polarity__actions > *')).map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width };
      })`,
    );
    assert.equal(mobilePolarityActions.every(({ height, width }) => height >= 44 && width >= 280), true);
    assert.equal(
      mobilePolarityActions.every((action, index) => index === 0 || action.top >= mobilePolarityActions[index - 1].bottom),
      true,
    );
    for (let index = 1; index < polarityTitles.length; index += 1) {
      await evaluate(page, "document.querySelector('[data-polarity-action=\"next\"]')?.click()");
      await waitForExpression(page, `document.querySelector('.polarity__title')?.textContent === ${JSON.stringify(polarityTitles[index])}`);
    }
    polarityState = await evaluate(
      page,
      `({
        hasPrevious: document.querySelector('[data-polarity-action="previous"]') !== null,
        hasNext: document.querySelector('[data-polarity-action="next"]') !== null,
        articleHref: document.querySelector('.polarity__action--article')?.href
      })`,
    );
    assert.equal(polarityState.hasPrevious, true);
    assert.equal(polarityState.hasNext, false);
    assert.equal(
      polarityState.articleHref,
      "https://zephyr-avenel.blogspot.com/2026/07/les-tensions-fecondes-des-polarites.html?m=1",
    );
    assert.equal(
      await evaluate(page, "document.querySelector('[data-polarity-action=\"closing\"]')?.textContent"),
      "Achever le parcours",
    );
    await evaluate(page, "document.querySelector('[data-polarity-action=\"closing\"]')?.click()");
    await waitForExpression(
      page,
      "document.querySelector('.polarity-closing__image')?.currentSrc.endsWith('/11-cloture.webp') && document.querySelector('.polarity-closing__image')?.complete === true",
    );
    assert.equal(
      await evaluate(page, "document.querySelector('.polarity-closing__image')?.complete === true"),
      true,
    );
    const closingLayout = await evaluate(
      page,
      `(() => {
        const image = document.querySelector('.polarity-closing__image');
        const actions = Array.from(document.querySelectorAll('.polarity-closing__actions > *'));
        const imageRect = image?.getBoundingClientRect();
        const actionRects = actions.map((element) => {
          const rect = element.getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width };
        });
        return {
          imageBottom: imageRect?.bottom,
          firstActionTop: actionRects[0]?.top,
          actionRects,
          actionsPosition: getComputedStyle(document.querySelector('.polarity-closing__actions')).position,
          noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
        };
      })()`,
    );
    assert.equal(closingLayout.noHorizontalOverflow, true);
    assert.equal(closingLayout.actionsPosition, "static");
    assert.equal(closingLayout.imageBottom <= closingLayout.firstActionTop + 1, true);
    assert.equal(closingLayout.actionRects.every(({ height, width }) => height >= 44 && width >= 280), true);
    const closingContinuation = await evaluate(
      page,
      `({
        label: document.querySelector('.polarity-closing__continue')?.textContent,
        href: document.querySelector('.polarity-closing__continue')?.href
      })`,
    );
    assert.equal(closingContinuation.label, "Poursuivre votre exploration");
    assert.equal(closingContinuation.href.endsWith("/bibliotheque/"), true);
    await evaluate(page, "document.querySelector('.polarity-closing__back')?.click()");
    await waitForExpression(page, "document.querySelector('.prologue__title')?.textContent === 'Polarités Vivantes'");

    const atlasPackUrl = `${entryUrl}oeuvres/atlas-recits-vivants/`;
    await loadUrl(page, atlasPackUrl);
    await waitForExpression(page, "document.querySelector('.prologue__title')?.textContent === 'Atlas des Récits Vivants'");
    await waitForExpression(
      page,
      "document.querySelector('.prologue__cover')?.currentSrc.endsWith('/00-couverture-atlas-recits-vivants.webp') === true && document.querySelector('.prologue__cover')?.complete === true",
    );
    await evaluate(page, "document.querySelector('.prologue button')?.click()");
    const livingCardTitles = [
      "Carte du Premier Pas",
      "Carte de l’Équilibre Vivant",
      "Carte du Passage",
      "Carte du Miroir",
      "Carte du Conflit Créateur",
      "Carte de la Traversée",
      "Carte des Racines",
      "Carte du Monde Commun",
    ];
    await waitForExpression(page, `document.querySelector('.living-card__title')?.textContent === ${JSON.stringify(livingCardTitles[0])}`);
    await waitForExpression(
      page,
      "document.querySelector('.living-card__image')?.currentSrc.endsWith('/01-premier-pas.webp') === true && document.querySelector('.living-card__image')?.complete === true",
    );
    let livingCardState = await evaluate(
      page,
      `(() => ({
        imageReady: document.querySelector('.living-card__image')?.complete === true,
        imageAlt: document.querySelector('.living-card__image')?.getAttribute('alt'),
        symbol: document.querySelector('.living-card__symbol')?.textContent,
        quote: document.querySelector('.living-card__quote')?.textContent,
        motto: document.querySelector('.living-card__motto')?.textContent,
        metadataCount: document.querySelectorAll('.living-card__metadata dt').length,
        hasPrevious: document.querySelector('[data-card-action="previous"]') !== null,
        hasContinue: document.querySelector('[data-card-action="continue"]') !== null,
        hasBack: document.querySelector('[data-card-action="back"]') !== null,
        libraryControlSize: document.querySelector('.site-navigation a')?.getBoundingClientRect().width,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
      }))()`,
    );
    assert.equal(livingCardState.imageReady, true);
    assert.ok(livingCardState.imageAlt.length > 0);
    assert.equal(livingCardState.symbol, "graine");
    assert.ok(livingCardState.quote.length > 0);
    assert.equal(livingCardState.motto, "ÉCOUTER • RELIER • HABITER • TRANSMETTRE");
    assert.equal(livingCardState.metadataCount, 2);
    assert.equal(livingCardState.hasPrevious, false);
    assert.equal(livingCardState.hasContinue, true);
    assert.equal(livingCardState.hasBack, true);
    assert.equal(livingCardState.libraryControlSize, 44);
    assert.equal(livingCardState.noHorizontalOverflow, true);
    for (let index = 1; index < livingCardTitles.length; index += 1) {
      await evaluate(page, "document.querySelector('[data-card-action=\"continue\"]')?.click()");
      await waitForExpression(page, `document.querySelector('.living-card__title')?.textContent === ${JSON.stringify(livingCardTitles[index])}`);
    }
    livingCardState = await evaluate(
      page,
      `({
        hasPrevious: document.querySelector('[data-card-action="previous"]') !== null,
        hasContinue: document.querySelector('[data-card-action="continue"]') !== null,
        hasFinish: document.querySelector('[data-card-action="finish"]') !== null,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
      })`,
    );
    assert.equal(livingCardState.hasPrevious, true);
    assert.equal(livingCardState.hasContinue, false);
    assert.equal(livingCardState.hasFinish, true);
    assert.equal(livingCardState.noHorizontalOverflow, true);
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 360,
      height: 800,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await loadUrl(page, atlasPackUrl);
    await waitForExpression(page, "document.querySelector('.prologue__title')?.textContent === 'Atlas des Récits Vivants'");
    await evaluate(page, "document.querySelector('.prologue button')?.click()");
    await waitForExpression(page, "document.querySelector('.living-card__title')?.textContent === 'Carte du Premier Pas'");
    const mobileLivingCardActions = await evaluate(
      page,
      `Array.from(document.querySelectorAll('.living-card__actions > *')).map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width };
      })`,
    );
    assert.equal(mobileLivingCardActions.every(({ height, width }) => height >= 44 && width >= 280), true);
    assert.equal(
      mobileLivingCardActions.every((action, index) => index === 0 || action.top >= mobileLivingCardActions[index - 1].bottom),
      true,
    );

    const middleWayPackUrl = `${entryUrl}oeuvres/voie-du-milieu/`;
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 360,
      height: 800,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await loadUrl(page, middleWayPackUrl);
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 11");
    const middleWayCheckpoints = new Map([
      [4, "Les r\u00e9cits qui enferment"],
      [5, "Entre deux r\u00e9cits, un choix ?"],
      [7, "La pr\u00e9sence au-del\u00e0 des r\u00e9cits"],
      [9, "Au seuil d\u2019un monde vivant"],
      [11, "Les r\u00e9cits vivants continuent\u2026"],
    ]);
    for (let sceneNumber = 1; sceneNumber <= 11; sceneNumber += 1) {
      const state = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 11`);
      if (middleWayCheckpoints.has(sceneNumber)) {
        assert.equal(state.packIdData, "pack-004");
        assert.equal(state.sceneTitle, middleWayCheckpoints.get(sceneNumber));
        assert.equal(state.objectFit, "contain");
        assert.equal(state.displayMode, "contain");
        assert.equal(state.imageVisible, true);
        assert.equal(state.noHorizontalOverflow, true);
        assert.equal(state.controlsInsideViewport, true);
        assert.equal(state.contentInsideViewport, true);
        assert.equal(state.currentSrc.endsWith(".webp"), true);
        assert.equal(state.mediaHeight >= 240, true);
        assert.equal(state.imageHeight >= 240, true);
        assert.equal(state.imageHeight <= 310, true);
        assert.equal(state.mediaBottomBeforeTitle, true);
        assert.equal(state.titleBottomBeforeText, true);
      }
      if (sceneNumber < 11) {
        await clickLocalizedNext(page, `Sc\u00e8ne ${sceneNumber + 1} / 11`);
      }
    }
    const middleWayFinalActions = await evaluate(
      page,
      `Array.from(document.querySelectorAll('.player-controls > *')).map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width };
      })`,
    );
    assert.equal(middleWayFinalActions.every(({ height, width }) => height >= 44 && width >= 280), true);
    assert.equal(
      middleWayFinalActions.every((action, index) => index === 0 || action.top >= middleWayFinalActions[index - 1].bottom),
      true,
    );

    const revealedStoriesPackUrl = `${entryUrl}oeuvres/recits-qui-revelent-ou-enferment/`;
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 360,
      height: 800,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await loadUrl(page, revealedStoriesPackUrl);
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 12");
    const revealedStoriesCheckpoints = new Map([
      [1, "Les r\u00e9cits qui r\u00e9v\u00e8lent\u2026 ou qui enferment"],
      [2, "Le premier regard"],
      [3, "Les attentes invisibles"],
      [4, "Une exp\u00e9rience c\u00e9l\u00e8bre"],
      [8, "Les r\u00e9cits vivants"],
      [12, "Quel r\u00e9cit faisons-nous grandir ?"],
    ]);
    for (let sceneNumber = 1; sceneNumber <= 12; sceneNumber += 1) {
      const state = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 12`);
      if (revealedStoriesCheckpoints.has(sceneNumber)) {
        assert.equal(state.packIdData, "pack-005");
        assert.equal(state.sceneTitle, revealedStoriesCheckpoints.get(sceneNumber));
        assert.equal(state.noHorizontalOverflow, true);
        assert.equal(state.controlsInsideViewport, true);
        assert.equal(state.contentInsideViewport, true);
        assert.equal(state.titleBottomBeforeText, true);
        assert.equal(state.objectFit, "contain");
        assert.equal(state.displayMode, "contain");
        assert.equal(state.imageVisible, true);
        assert.equal(state.currentSrc.endsWith(".webp"), true);
        assert.equal(state.mediaHeight >= 176, true);
        assert.equal(state.imageHeight >= 176, true);
        assert.equal(state.imageHeight <= 290, true);
        assert.equal(state.mediaBottomBeforeTitle, true);
        if (sceneNumber === 3) {
          assert.equal(state.currentSrc.endsWith("/02-les-attentes-invisibles.webp"), true);
        }
      }
      if (sceneNumber < 12) {
        await clickLocalizedNext(page, `Sc\u00e8ne ${sceneNumber + 1} / 12`);
      }
    }
    const revealedStoriesFinalActions = await evaluate(
      page,
      `Array.from(document.querySelectorAll('.player-controls > *')).map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width };
      })`,
    );
    assert.equal(revealedStoriesFinalActions.every(({ height, width }) => height >= 44 && width >= 280), true);
    assert.equal(
      revealedStoriesFinalActions.every((action, index) => index === 0 || action.top >= revealedStoriesFinalActions[index - 1].bottom),
      true,
    );
    await evaluate(page, "document.querySelector('.site-navigation a')?.click()");
    await waitForExpression(page, "document.querySelectorAll('.work-card').length === 13");

    const metamorphosisPackUrl = `${entryUrl}oeuvres/la-metamorphose/`;
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await loadUrl(page, metamorphosisPackUrl);
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 13");
    const metamorphosisCheckpoints = new Map([
      [1, "La M\u00e9tamorphose"],
      [2, "Le monde des chenilles"],
      [6, "R\u00e9sister \u00e0 l\u2019ancien r\u00e9cit"],
      [7, "Tu as chang\u00e9."],
      [8, "Les ailes invisibles"],
      [13, "Un cycle, des infinis possibles"],
    ]);
    for (let sceneNumber = 1; sceneNumber <= 13; sceneNumber += 1) {
      const state = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 13`);
      if (metamorphosisCheckpoints.has(sceneNumber)) {
        assert.equal(state.packIdData, "pack-006");
        assert.equal(state.sceneTitle, metamorphosisCheckpoints.get(sceneNumber));
        assert.equal(state.noHorizontalOverflow, true);
        assert.equal(state.controlsInsideViewport, true);
        assert.equal(state.contentInsideViewport, true);
        assert.equal(state.titleBottomBeforeText, true);
        assert.equal(state.objectFit, "contain");
        assert.equal(state.displayMode, "contain");
        assert.equal(state.imageVisible, true);
        assert.equal(state.currentSrc.endsWith(".webp"), true);
        assert.equal(state.mediaHeight >= 216, true);
        assert.equal(state.imageHeight >= 216, true);
        assert.equal(state.imageHeight <= 352, true);
        assert.equal(state.mediaBottomBeforeTitle, true);
        if (sceneNumber === 7) {
          assert.equal(state.currentSrc.endsWith("/06-tu-as-change.webp"), true);
        }
      }
      if (sceneNumber < 13) {
        await clickLocalizedNext(page, `Sc\u00e8ne ${sceneNumber + 1} / 13`);
      }
    }
    const metamorphosisFinalActions = await evaluate(
      page,
      `Array.from(document.querySelectorAll('.player-controls > *')).map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width };
      })`,
    );
    assert.equal(metamorphosisFinalActions.every(({ height, width }) => height >= 44 && width >= 280), true);
    assert.equal(
      metamorphosisFinalActions.every((action, index) => index === 0 || action.top >= metamorphosisFinalActions[index - 1].bottom),
      true,
    );

    const playToBecomePackUrl = `${entryUrl}oeuvres/jouer-pour-devenir/`;
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await loadUrl(page, playToBecomePackUrl);
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 14");
    const playToBecomeCheckpoints = new Map([
      [1, "Jouer pour devenir"],
      [2, "Le premier terrain d\u2019exploration"],
      [4, "Le droit d\u2019essayer"],
      [7, "Les r\u00e9cits emp\u00each\u00e9s"],
      [10, "Apprendre, explorer, cr\u00e9er, recommencer et devenir"],
      [14, "Le jeu continue avec vous"],
    ]);
    for (let sceneNumber = 1; sceneNumber <= 14; sceneNumber += 1) {
      const state = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 14`);
      if (playToBecomeCheckpoints.has(sceneNumber)) {
        assert.equal(state.packIdData, "pack-007");
        assert.equal(state.sceneTitle, playToBecomeCheckpoints.get(sceneNumber));
        assert.equal(state.noHorizontalOverflow, true);
        assert.equal(state.controlsInsideViewport, true);
        assert.equal(state.contentInsideViewport, true);
        assert.equal(state.titleBottomBeforeText, true);
        assert.equal(state.objectFit, "contain");
        assert.equal(state.displayMode, "contain");
        assert.equal(state.imageVisible, true);
        assert.equal(state.currentSrc.endsWith(".webp"), true);
        assert.equal(state.mediaHeight >= 216, true);
        assert.equal(state.imageHeight >= 216, true);
        assert.equal(state.imageHeight <= 352, true);
        assert.equal(state.mediaBottomBeforeTitle, true);
        if (sceneNumber === 14) {
          assert.equal(state.currentSrc.endsWith("/13-le-jeu-continue-avec-vous.webp"), true);
        }
      }
      if (sceneNumber < 14) {
        await clickLocalizedNext(page, `Sc\u00e8ne ${sceneNumber + 1} / 14`);
      }
    }
    const playToBecomeFinalActions = await evaluate(
      page,
      `Array.from(document.querySelectorAll('.player-controls > *')).map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width };
      })`,
    );
    assert.equal(playToBecomeFinalActions.every(({ height, width }) => height >= 44 && width >= 280), true);
    assert.equal(
      playToBecomeFinalActions.every((action, index) => index === 0 || action.top >= playToBecomeFinalActions[index - 1].bottom),
      true,
    );

    const watcherPackUrl = `${entryUrl}oeuvres/le-veilleur/`;
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await loadUrl(page, watcherPackUrl);
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 12");
    const watcherCheckpoints = new Map([
      [1, "Le Veilleur"],
      [2, "La Voix"],
      [5, "Le Bruit du monde"],
      [7, "Le Veilleur"],
      [10, "La Plume et l\u2019IA"],
      [12, "Devenir veilleur"],
    ]);
    for (let sceneNumber = 1; sceneNumber <= 12; sceneNumber += 1) {
      const state = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 12`);
      if (watcherCheckpoints.has(sceneNumber)) {
        assert.equal(state.packIdData, "pack-008");
        assert.equal(state.sceneTitle, watcherCheckpoints.get(sceneNumber));
        assert.equal(state.noHorizontalOverflow, true);
        assert.equal(state.controlsInsideViewport, true);
        assert.equal(state.contentInsideViewport, true);
        assert.equal(state.titleBottomBeforeText, true);
        assert.equal(state.objectFit, "contain");
        assert.equal(state.displayMode, "contain");
        assert.equal(state.imageVisible, true);
        assert.equal(state.currentSrc.endsWith(".webp"), true);
        assert.equal(state.mediaHeight >= 208, true);
        assert.equal(state.imageHeight >= 208, true);
        assert.equal(state.imageHeight <= 344, true);
        assert.equal(state.mediaBottomBeforeTitle, true);
        if (sceneNumber === 11) {
          assert.equal(state.currentSrc.endsWith("/10-transmettre.webp"), true);
        }
        if (sceneNumber === 12) {
          assert.equal(state.currentSrc.endsWith("/11-cloture-devenir-veilleur.webp"), true);
        }
      }
      if (sceneNumber < 12) {
        await clickLocalizedNext(page, `Sc\u00e8ne ${sceneNumber + 1} / 12`);
      }
    }
    const watcherFinalActions = await evaluate(
      page,
      `Array.from(document.querySelectorAll('.player-controls > *')).map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width };
      })`,
    );
    assert.equal(watcherFinalActions.every(({ height, width }) => height >= 44 && width >= 280), true);
    assert.equal(
      watcherFinalActions.every((action, index) => index === 0 || action.top >= watcherFinalActions[index - 1].bottom),
      true,
    );

    const justPlacePackUrl = `${entryUrl}oeuvres/trouver-sa-juste-place/`;
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await loadUrl(page, justPlacePackUrl);
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 11 \u2014 Contempler");
    const justPlaceFirstImage = await readStablePlayerState(page, "Sc\u00e8ne 1 / 11 \u2014 Contempler");
    assert.equal(justPlaceFirstImage.packIdData, "pack-009-trouver-sa-juste-place");
    assert.equal(justPlaceFirstImage.layoutData, "image-then-text");
    assert.equal(justPlaceFirstImage.layoutPhaseData, "image");
    assert.equal(justPlaceFirstImage.sceneLayoutPhaseData, "image");
    assert.equal(justPlaceFirstImage.sceneTitle, "Trouver sa juste place");
    assert.equal(justPlaceFirstImage.buttons.join("|"), "Pr\u00e9c\u00e9dent|Lire");
    assert.equal(justPlaceFirstImage.previousDisabled, true);
    assert.equal(justPlaceFirstImage.nextDisabled, false);
    assert.equal(justPlaceFirstImage.objectFit, "contain");
    assert.equal(justPlaceFirstImage.currentSrc.endsWith("/00-couverture-trouver-sa-juste-place.webp"), true);
    assert.equal(justPlaceFirstImage.imageVisible, true);
    assert.equal(justPlaceFirstImage.imageHeight >= 500, true);
    assert.equal(justPlaceFirstImage.noHorizontalOverflow, true);
    assert.equal(justPlaceFirstImage.controlsInsideViewport, true);

    await clickNavigationNext(page, "Sc\u00e8ne 1 / 11 \u2014 Lire");
    const justPlaceFirstText = await readStablePlayerState(page, "Sc\u00e8ne 1 / 11 \u2014 Lire");
    assert.equal(justPlaceFirstText.layoutPhaseData, "text");
    assert.equal(justPlaceFirstText.sceneLayoutPhaseData, "text");
    assert.equal(justPlaceFirstText.buttons.join("|"), "Pr\u00e9c\u00e9dent|Suivant");
    assert.equal(justPlaceFirstText.previousDisabled, false);
    assert.equal(justPlaceFirstText.sceneText.includes("Toute existence commence"), true);
    assert.equal(justPlaceFirstText.imageVisible, false);
    assert.equal(justPlaceFirstText.contentInsideViewport, true);
    assert.equal(justPlaceFirstText.noHorizontalOverflow, true);

    await evaluate(page, "document.querySelector('[data-navigation=\"previous\"]')?.click()");
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 11 \u2014 Contempler");
    const justPlaceBackToImage = await readStablePlayerState(page, "Sc\u00e8ne 1 / 11 \u2014 Contempler");
    assert.equal(justPlaceBackToImage.layoutPhaseData, "image");
    assert.equal(justPlaceBackToImage.previousDisabled, true);

    await clickNavigationNext(page, "Sc\u00e8ne 1 / 11 \u2014 Lire");
    for (let sceneNumber = 2; sceneNumber <= 11; sceneNumber += 1) {
      await clickNavigationNext(page, `Sc\u00e8ne ${sceneNumber} / 11 \u2014 Contempler`);
      const imageState = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 11 \u2014 Contempler`);
      assert.equal(imageState.layoutPhaseData, "image");
      assert.equal(imageState.objectFit, "contain");
      assert.equal(imageState.imageVisible, true);
      assert.equal(imageState.currentSrc.endsWith(".webp"), true);
      assert.equal(imageState.noHorizontalOverflow, true);
      assert.equal(imageState.controlsInsideViewport, true);

      await clickNavigationNext(page, `Sc\u00e8ne ${sceneNumber} / 11 \u2014 Lire`);
      const textState = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 11 \u2014 Lire`);
      assert.equal(textState.layoutPhaseData, "text");
      assert.equal(textState.imageVisible, false);
      assert.equal(textState.sceneText.length > 80, true);
      assert.equal(textState.contentInsideViewport, true);
      assert.equal(textState.noHorizontalOverflow, true);
    }
    const justPlaceFinal = await readStablePlayerState(page, "Sc\u00e8ne 11 / 11 \u2014 Lire");
    assert.equal(justPlaceFinal.sceneTitle, "Devenir pr\u00e9sence");
    assert.equal(justPlaceFinal.nextDisabled, true);
    assert.equal(
      await evaluate(page, "document.querySelector('[data-library-continuation]')?.href.endsWith('/bibliotheque/')"),
      true,
    );

    const commonWorldPackUrl = `${entryUrl}oeuvres/le-monde-commun/`;
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await loadUrl(page, commonWorldPackUrl);
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 12 \u2014 Contempler");
    const commonWorldFirstImage = await readStablePlayerState(page, "Sc\u00e8ne 1 / 12 \u2014 Contempler");
    assert.equal(commonWorldFirstImage.packIdData, "pack-010-le-monde-commun");
    assert.equal(commonWorldFirstImage.layoutData, "image-then-text");
    assert.equal(commonWorldFirstImage.layoutPhaseData, "image");
    assert.equal(commonWorldFirstImage.sceneLayoutPhaseData, "image");
    assert.equal(commonWorldFirstImage.sceneTitle, "Couverture \u2014 Le Monde commun");
    assert.equal(commonWorldFirstImage.buttons.join("|"), "Pr\u00e9c\u00e9dent|Lire");
    assert.equal(commonWorldFirstImage.previousDisabled, true);
    assert.equal(commonWorldFirstImage.nextDisabled, false);
    assert.equal(commonWorldFirstImage.objectFit, "contain");
    assert.equal(commonWorldFirstImage.currentSrc.endsWith("/00-couverture-le-monde-commun.webp"), true);
    assert.equal(commonWorldFirstImage.imageVisible, true);
    assert.equal(commonWorldFirstImage.imageHeight >= 500, true);
    assert.equal(commonWorldFirstImage.noHorizontalOverflow, true);
    assert.equal(commonWorldFirstImage.controlsInsideViewport, true);

    await clickNavigationNext(page, "Sc\u00e8ne 1 / 12 \u2014 Lire");
    const commonWorldFirstText = await readStablePlayerState(page, "Sc\u00e8ne 1 / 12 \u2014 Lire");
    assert.equal(commonWorldFirstText.layoutPhaseData, "text");
    assert.equal(commonWorldFirstText.sceneLayoutPhaseData, "text");
    assert.equal(commonWorldFirstText.buttons.join("|"), "Pr\u00e9c\u00e9dent|Suivant");
    assert.equal(commonWorldFirstText.previousDisabled, false);
    assert.equal(commonWorldFirstText.sceneText.includes("comment habiter nos diff\u00e9rences sans rompre le lien"), true);
    assert.equal(commonWorldFirstText.imageVisible, false);
    assert.equal(commonWorldFirstText.noHorizontalOverflow, true);
    assert.equal(commonWorldFirstText.controlsInsideViewport, true);

    await evaluate(page, "document.querySelector('[data-navigation=\"previous\"]')?.click()");
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 12 \u2014 Contempler");
    const commonWorldBackToImage = await readStablePlayerState(page, "Sc\u00e8ne 1 / 12 \u2014 Contempler");
    assert.equal(commonWorldBackToImage.layoutPhaseData, "image");
    assert.equal(commonWorldBackToImage.previousDisabled, true);

    await clickNavigationNext(page, "Sc\u00e8ne 1 / 12 \u2014 Lire");
    for (let sceneNumber = 2; sceneNumber <= 12; sceneNumber += 1) {
      await clickNavigationNext(page, `Sc\u00e8ne ${sceneNumber} / 12 \u2014 Contempler`);
      const imageState = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 12 \u2014 Contempler`);
      assert.equal(imageState.layoutPhaseData, "image");
      assert.equal(imageState.objectFit, "contain");
      assert.equal(imageState.imageVisible, true);
      assert.equal(imageState.currentSrc.endsWith(".webp"), true);
      assert.equal(imageState.noHorizontalOverflow, true);
      assert.equal(imageState.controlsInsideViewport, true);

      await clickNavigationNext(page, `Sc\u00e8ne ${sceneNumber} / 12 \u2014 Lire`);
      const textState = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 12 \u2014 Lire`);
      assert.equal(textState.layoutPhaseData, "text");
      assert.equal(textState.imageVisible, false);
      assert.equal(textState.sceneText.length > 120, true, `PACK-010 scene ${sceneNumber} read page should expose narrative text`);
      assert.equal(textState.noHorizontalOverflow, true, `PACK-010 scene ${sceneNumber} read page should not overflow horizontally`);
      assert.equal(
        textState.nextDisabled,
        sceneNumber === 12,
        `PACK-010 scene ${sceneNumber} read page should keep navigation state coherent`,
      );
      const readControlsState = await evaluate(
        page,
        `(() => {
          const controls = document.querySelector('.player-controls');
          controls?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          const next = document.querySelector('[data-navigation="next"]');
          const continuation = document.querySelector('[data-library-continuation]');
          const buttons = Array.from(document.querySelectorAll('.player-controls button')).map((button) => ({
            text: (button.textContent || '').trim(),
            disabled: button.disabled
          }));
          return {
            controlsPresent: Boolean(controls),
            buttonsNamed: buttons.every(({ text }) => text.length > 0),
            nextButtonPresent: Boolean(next),
            nextButtonEnabled: Boolean(next && !next.disabled),
            nextDisabled: next?.disabled === true,
            continuationPresent: Boolean(continuation),
            continuationNamed: Boolean(continuation && (continuation.textContent || '').trim().length > 0),
            continuationHref: continuation?.href ?? ''
          };
        })()`,
      );
      assert.equal(readControlsState.controlsPresent, true, `PACK-010 scene ${sceneNumber} read page should render controls`);
      assert.equal(
        readControlsState.nextButtonPresent,
        true,
        `PACK-010 scene ${sceneNumber} read page should render the next navigation control`,
      );
      assert.equal(readControlsState.buttonsNamed, true, `PACK-010 scene ${sceneNumber} read page controls should be named`);
      if (sceneNumber < 12) {
        assert.equal(
          readControlsState.nextButtonEnabled,
          true,
          `PACK-010 scene ${sceneNumber} read page next button should remain activable`,
        );
      } else {
        assert.equal(readControlsState.nextDisabled, true, "PACK-010 final read page next button should be disabled");
        assert.equal(readControlsState.continuationPresent, true, "PACK-010 final read page should render a continuation link");
        assert.equal(readControlsState.continuationNamed, true, "PACK-010 final read page continuation link should be named");
        assert.equal(
          readControlsState.continuationHref.endsWith("/bibliotheque/"),
          true,
          "PACK-010 final read page continuation link should point to the library",
        );
      }
    }
    const commonWorldFinal = await readStablePlayerState(page, "Sc\u00e8ne 12 / 12 \u2014 Lire");
    assert.equal(commonWorldFinal.sceneTitle, "Cl\u00f4ture \u2014 Faire monde");
    assert.equal(commonWorldFinal.nextDisabled, true);
    assert.equal(
      await evaluate(page, "document.querySelector('[data-library-continuation]')?.href.endsWith('/bibliotheque/')"),
      true,
    );
    await evaluate(
      page,
      `(() => {
        const continuation = document.querySelector('[data-library-continuation]');
        continuation?.scrollIntoView({ block: 'center', inline: 'nearest' });
        continuation?.click();
      })()`,
    );
    await waitForExpression(page, "document.querySelectorAll('.work-card').length === 13");
    assert.equal(
      await evaluate(page, "window.location.pathname.endsWith('/bibliotheque/')"),
      true,
      "PACK-010 final read page continuation link should navigate back to the library",
    );

    const lucidJoyPackUrl = `${entryUrl}oeuvres/la-joie-lucide/`;
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await loadUrl(page, lucidJoyPackUrl);
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 12 \u2014 Contempler");
    const lucidJoyFirstImage = await readStablePlayerState(page, "Sc\u00e8ne 1 / 12 \u2014 Contempler");
    assert.equal(lucidJoyFirstImage.packIdData, "pack-011-la-joie-lucide");
    assert.equal(lucidJoyFirstImage.layoutData, "image-then-text");
    assert.equal(lucidJoyFirstImage.layoutPhaseData, "image");
    assert.equal(lucidJoyFirstImage.sceneLayoutPhaseData, "image");
    assert.equal(lucidJoyFirstImage.sceneTitle, "Couverture \u2014 La Joie lucide");
    assert.equal(lucidJoyFirstImage.currentSrc.endsWith("/00-couverture-la-joie-lucide.webp"), true);
    assert.equal(lucidJoyFirstImage.objectFit, "contain");
    assert.equal(lucidJoyFirstImage.imageVisible, true);
    assert.equal(lucidJoyFirstImage.noHorizontalOverflow, true);

    await clickNavigationNext(page, "Sc\u00e8ne 1 / 12 \u2014 Lire");
    const lucidJoyFirstText = await readStablePlayerState(page, "Sc\u00e8ne 1 / 12 \u2014 Lire");
    assert.equal(lucidJoyFirstText.layoutPhaseData, "text");
    assert.equal(lucidJoyFirstText.sceneText.includes("Voir la houle"), true);
    assert.equal(lucidJoyFirstText.imageVisible, false);
    assert.equal(lucidJoyFirstText.noHorizontalOverflow, true);

    const lucidJoyCheckpoints = new Map([
      [2, "La Houle"],
      [3, "Le Droit \u00e0 la joie"],
      [6, "Les Deux V\u00e9rit\u00e9s"],
      [7, "Les Dauphins dans la houle"],
      [11, "La Joie lucide"],
      [12, "Le Nouveau R\u00e9cit"],
    ]);
    for (let sceneNumber = 2; sceneNumber <= 12; sceneNumber += 1) {
      await clickNavigationNext(page, `Sc\u00e8ne ${sceneNumber} / 12 \u2014 Contempler`);
      const imageState = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 12 \u2014 Contempler`);
      assert.equal(imageState.layoutPhaseData, "image");
      assert.equal(imageState.objectFit, "contain");
      assert.equal(imageState.imageVisible, true);
      assert.equal(imageState.currentSrc.endsWith(".webp"), true);
      assert.equal(imageState.noHorizontalOverflow, true);
      if (lucidJoyCheckpoints.has(sceneNumber)) {
        assert.equal(imageState.sceneTitle, lucidJoyCheckpoints.get(sceneNumber));
      }

      await clickNavigationNext(page, `Sc\u00e8ne ${sceneNumber} / 12 \u2014 Lire`);
      const textState = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 12 \u2014 Lire`);
      assert.equal(textState.layoutPhaseData, "text");
      assert.equal(textState.imageVisible, false);
      assert.equal(textState.sceneText.includes("LE SEUIL"), true, `PACK-011 scene ${sceneNumber} should expose a threshold question`);
      assert.equal(textState.noHorizontalOverflow, true);
      assert.equal(textState.nextDisabled, sceneNumber === 12);
    }
    const lucidJoyFinal = await readStablePlayerState(page, "Sc\u00e8ne 12 / 12 \u2014 Lire");
    assert.equal(lucidJoyFinal.sceneTitle, "Le Nouveau R\u00e9cit");
    assert.equal(lucidJoyFinal.sceneText.includes("LE SEUIL FINAL"), true);
    assert.equal(
      await evaluate(page, "document.querySelector('[data-library-continuation]')?.href.endsWith('/bibliotheque/')"),
      true,
    );
    await evaluate(
      page,
      `(() => {
        const continuation = document.querySelector('[data-library-continuation]');
        continuation?.scrollIntoView({ block: 'center', inline: 'nearest' });
        continuation?.click();
      })()`,
    );
    await waitForExpression(page, "document.querySelectorAll('.work-card').length === 13");

    const encounterPackUrl = `${entryUrl}oeuvres/celle-que-je-navais-pas-encore-rencontree/`;
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await loadUrl(page, encounterPackUrl);
    await waitForPlayerReady(page, "Scène 1 / 13 — Contempler");
    const encounterFirstImage = await readStablePlayerState(page, "Scène 1 / 13 — Contempler");
    assert.equal(encounterFirstImage.packIdData, "pack-012-celle-que-je-navais-pas-encore-rencontree");
    assert.equal(encounterFirstImage.layoutData, "image-then-text");
    assert.equal(encounterFirstImage.layoutPhaseData, "image");
    assert.equal(encounterFirstImage.sceneLayoutPhaseData, "image");
    assert.equal(encounterFirstImage.sceneTitle, "Couverture — Celle que je n’avais pas encore rencontrée");
    assert.equal(encounterFirstImage.currentSrc.endsWith("/pack-012-cover.webp"), true);
    assert.equal(encounterFirstImage.objectFit, "contain");
    assert.equal(encounterFirstImage.imageVisible, true);
    assert.equal(encounterFirstImage.noHorizontalOverflow, true);

    await clickNavigationNext(page, "Scène 1 / 13 — Lire");
    const encounterFirstText = await readStablePlayerState(page, "Scène 1 / 13 — Lire");
    assert.equal(encounterFirstText.layoutPhaseData, "text");
    assert.equal(encounterFirstText.sceneText.includes("Un récit vivant"), true);
    assert.equal(encounterFirstText.imageVisible, false);
    assert.equal(encounterFirstText.noHorizontalOverflow, true);

    const encounterCheckpoints = new Map([
      [2, "La vie déjà écrite"],
      [3, "La fenêtre sur une autre vie"],
      [9, "Découvrir que l’autre était un miroir"],
      [10, "Ne pas devenir l’autre"],
      [12, "Habiter son propre récit"],
      [13, "Clôture — Épilogue"],
    ]);
    for (let sceneNumber = 2; sceneNumber <= 13; sceneNumber += 1) {
      await clickNavigationNext(page, `Scène ${sceneNumber} / 13 — Contempler`);
      const imageState = await readStablePlayerState(page, `Scène ${sceneNumber} / 13 — Contempler`);
      assert.equal(imageState.layoutPhaseData, "image");
      assert.equal(imageState.objectFit, "contain");
      assert.equal(imageState.imageVisible, true);
      assert.equal(imageState.currentSrc.endsWith(".webp"), true);
      assert.equal(imageState.noHorizontalOverflow, true);
      if (encounterCheckpoints.has(sceneNumber)) {
        assert.equal(imageState.sceneTitle, encounterCheckpoints.get(sceneNumber));
      }

      await clickNavigationNext(page, `Scène ${sceneNumber} / 13 — Lire`);
      const textState = await readStablePlayerState(page, `Scène ${sceneNumber} / 13 — Lire`);
      assert.equal(textState.layoutPhaseData, "text");
      assert.equal(textState.imageVisible, false);
      assert.equal(textState.sceneText.length > 100, true, `PACK-012 scene ${sceneNumber} should expose narrative text`);
      assert.equal(textState.noHorizontalOverflow, true);
      assert.equal(textState.nextDisabled, sceneNumber === 13);
    }
    const encounterFinal = await readStablePlayerState(page, "Scène 13 / 13 — Lire");
    assert.equal(encounterFinal.sceneTitle, "Clôture — Épilogue");
    assert.equal(encounterFinal.sceneText.includes("Il existe des rencontres"), true);
    assert.equal(
      await evaluate(page, "document.querySelector('[data-library-continuation]')?.href.endsWith('/bibliotheque/')"),
      true,
    );
    await evaluate(
      page,
      `(() => {
        const continuation = document.querySelector('[data-library-continuation]');
        continuation?.scrollIntoView({ block: 'center', inline: 'nearest' });
        continuation?.click();
      })()`,
    );
    await waitForExpression(page, "document.querySelectorAll('.work-card').length === 13");

    const chairPackUrl = `${entryUrl}oeuvres/la-chaise/`;
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await loadUrl(page, chairPackUrl);
    await waitForPlayerReady(page, "Sc\u00e8ne 1 / 15 \u2014 Contempler");
    const chairFirstImage = await readStablePlayerState(page, "Sc\u00e8ne 1 / 15 \u2014 Contempler");
    assert.equal(chairFirstImage.packIdData, "pack-013-la-chaise");
    assert.equal(chairFirstImage.layoutData, "image-then-text");
    assert.equal(chairFirstImage.layoutPhaseData, "image");
    assert.equal(chairFirstImage.sceneLayoutPhaseData, "image");
    assert.equal(chairFirstImage.sceneTitle, "La Chaise");
    assert.equal(chairFirstImage.currentSrc.endsWith("/00-couverture-la-chaise.webp"), true);
    assert.equal(chairFirstImage.objectFit, "contain");
    assert.equal(chairFirstImage.imageVisible, true);
    assert.equal(chairFirstImage.noHorizontalOverflow, true);

    await clickNavigationNext(page, "Sc\u00e8ne 1 / 15 \u2014 Lire");
    const chairFirstText = await readStablePlayerState(page, "Sc\u00e8ne 1 / 15 \u2014 Lire");
    assert.equal(chairFirstText.layoutPhaseData, "text");
    assert.equal(chairFirstText.sceneText.includes("regarder la place que nous occupons"), true);
    assert.equal(chairFirstText.imageVisible, false);
    assert.equal(chairFirstText.noHorizontalOverflow, true);

    const chairCheckpoints = new Map([
      [2, "La Table \u2014 Entrer"],
      [9, "Voir le dessous \u2014 Observer"],
      [13, "La table r\u00e9ciproque \u2014 Rencontrer"],
      [14, "Construire la table \u2014 Co-cr\u00e9er"],
      [15, "La chaise libre \u2014 Habiter"],
    ]);
    for (let sceneNumber = 2; sceneNumber <= 15; sceneNumber += 1) {
      await clickNavigationNext(page, `Sc\u00e8ne ${sceneNumber} / 15 \u2014 Contempler`);
      const imageState = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 15 \u2014 Contempler`);
      assert.equal(imageState.layoutPhaseData, "image");
      assert.equal(imageState.objectFit, "contain");
      assert.equal(imageState.imageVisible, true);
      assert.equal(imageState.currentSrc.endsWith(".webp"), true);
      assert.equal(imageState.noHorizontalOverflow, true);
      if (chairCheckpoints.has(sceneNumber)) {
        assert.equal(imageState.sceneTitle, chairCheckpoints.get(sceneNumber));
      }
      if (sceneNumber === 13) {
        assert.equal(imageState.currentSrc.endsWith("/12-la-table-reciproque.webp"), true);
      }
      if (sceneNumber === 14) {
        assert.equal(imageState.currentSrc.endsWith("/13-construire-la-table.webp"), true);
      }
      if (sceneNumber === 15) {
        assert.equal(imageState.currentSrc.endsWith("/14-la-chaise-libre.webp"), true);
      }

      await clickNavigationNext(page, `Sc\u00e8ne ${sceneNumber} / 15 \u2014 Lire`);
      const textState = await readStablePlayerState(page, `Sc\u00e8ne ${sceneNumber} / 15 \u2014 Lire`);
      assert.equal(textState.layoutPhaseData, "text");
      assert.equal(textState.imageVisible, false);
      assert.equal(textState.sceneText.length > 80, true, `PACK-013 scene ${sceneNumber} should expose narrative text`);
      assert.equal(textState.noHorizontalOverflow, true);
      assert.equal(textState.nextDisabled, sceneNumber === 15);
      if (sceneNumber === 9) {
        const undersideLinkState = await evaluate(
          page,
          `(() => {
            const link = document.querySelector('.scene__link');
            return {
              present: Boolean(link),
              label: link?.textContent ?? '',
              href: link?.href ?? '',
              target: link?.target ?? '',
              rel: link?.rel ?? '',
              nextDisabled: document.querySelector('[data-navigation="next"]')?.disabled === true
            };
          })()`,
        );
        assert.equal(undersideLinkState.present, true, "PACK-013 scene 08 should render the Le Dessous external link");
        assert.equal(undersideLinkState.label, "Explorer \u00ab Le Dessous \u00bb");
        assert.equal(undersideLinkState.href, "https://zephyr-avenel.blogspot.com/2026/08/le-dessous.html");
        assert.equal(undersideLinkState.target, "_blank");
        assert.equal(undersideLinkState.rel, "noopener noreferrer");
        assert.equal(undersideLinkState.nextDisabled, false, "PACK-013 scene 08 should keep internal progression available");
      }
    }
    const chairFinal = await readStablePlayerState(page, "Sc\u00e8ne 15 / 15 \u2014 Lire");
    assert.equal(chairFinal.sceneTitle, "La chaise libre \u2014 Habiter");
    assert.equal(chairFinal.sceneText.includes("Il reste une chaise."), true);
    assert.equal(
      await evaluate(page, "document.querySelector('[data-library-continuation]')?.href.endsWith('/bibliotheque/')"),
      true,
    );
    await evaluate(
      page,
      `(() => {
        const continuation = document.querySelector('[data-library-continuation]');
        continuation?.scrollIntoView({ block: 'center', inline: 'nearest' });
        continuation?.click();
      })()`,
    );
    await waitForExpression(page, "document.querySelectorAll('.work-card').length === 13");

    await page.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await clearReadingProgress(page);
    await navigate(page, url);
    await waitForPlayerReady(page, "Scène 1 / 9");
    await evaluate(
      page,
      `(() => {
        window.__ineReducedAnimations = [];
        const originalAnimate = Element.prototype.animate;
        Element.prototype.animate = function(keyframes, options) {
          window.__ineReducedAnimations.push({ className: this.className, keyframes, options });
          return originalAnimate.call(this, keyframes, options);
        };
      })()`,
    );
    await clickLocalizedNext(page, "Scène 2 / 9");
    const reducedState = await readStablePlayerState(page, "Scène 2 / 9");
    assert.equal(reducedState.busy, null);
    assert.equal(reducedState.playerCount, 1);
    assert.equal(reducedState.activeElementText, "Suivant");
    assertSceneImageReady(reducedState);
    assert.equal(await evaluate(page, "window.__ineReducedAnimations.length"), 0);

    await page.send("Page.addScriptToEvaluateOnNewDocument", {
      source:
        "Object.defineProperty(window, 'localStorage', { get() { throw new Error('localStorage unavailable'); } });",
    });
    await loadUrl(page, url);
    await waitForPrologueReady(page);
    await enterPrologue(page);
    await waitForPlayerReady(page, "Scène 1 / 9");
    const storageUnavailableState = await readStablePlayerState(page, "Scène 1 / 9");
    assert.equal(storageUnavailableState.progress, "Scène 1 / 9");
    assert.equal(storageUnavailableState.busy, null);
    assert.equal(storageUnavailableState.noVerticalOverflow, true);
    assertSceneImageReady(storageUnavailableState);

    assert.equal(
      imageResponses.every((response) => response.status < 400),
      true,
      JSON.stringify(imageResponses),
    );
    assert.equal(
      imageResponses.every(
        (response) =>
          response.mimeType.startsWith("image/") ||
          String(response.contentType).toLowerCase().startsWith("image/"),
      ),
      true,
      JSON.stringify(imageResponses),
    );
    assert.equal(
      imageResponses.some((response) => String(response.contentType).toLowerCase().includes("text/html")),
      false,
      JSON.stringify(imageResponses),
    );
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(failedRequests, []);
  } catch (error) {
    const diagnostic = await Promise.race([
      evaluate(
        page,
        `(() => {
          const app = document.querySelector('#app');
          const image = document.querySelector('.scene__image');
          return {
            busy: app?.getAttribute('aria-busy'),
            transition: app?.getAttribute('data-transition'),
            progress: document.querySelector('.progress__text')?.textContent,
            title: document.querySelector('.scene__title')?.textContent,
            imageState: image?.getAttribute('data-image-state'),
            mediaState: document.querySelector('.scene__media')?.getAttribute('data-image-state'),
            imageComplete: image?.complete,
            naturalWidth: image?.naturalWidth,
            naturalHeight: image?.naturalHeight,
            currentSrc: image?.currentSrc,
            playerCount: document.querySelectorAll('.player').length,
            hiddenPlayerCount: document.querySelectorAll('.player[aria-hidden="true"]').length
          };
        })()`,
      ),
      new Promise((resolve) => setTimeout(() => resolve({ diagnosticError: "Timed out collecting DOM diagnostic" }), 2_000)),
    ]).catch((diagnosticError) => ({ diagnosticError: String(diagnosticError) }));
    await writeFile(
      join(artifactsDir, "failure.txt"),
      `${String(error.stack ?? error)}\n\nDOM diagnostic:\n${JSON.stringify(diagnostic, null, 2)}\n\nImage responses:\n${JSON.stringify(imageResponses, null, 2)}\n\nFailed requests:\n${JSON.stringify(failedRequests, null, 2)}`,
    );
    const screenshot = await Promise.race([
      page.send("Page.captureScreenshot", { format: "png" }),
      new Promise((resolve) => setTimeout(() => resolve(undefined), 2_000)),
    ]).catch(() => undefined);
    if (screenshot?.data) await writeFile(join(artifactsDir, "player-failure.png"), Buffer.from(screenshot.data, "base64"));
    throw error;
  } finally {
    await page.close();
    await stopChild(vite);
    await stopChild(chrome.child);
    await Promise.race([
      rm(chrome.userDataDir, { recursive: true, force: true }),
      new Promise((resolve) => setTimeout(resolve, 2_000)),
    ]).catch(() => undefined);
  }
});
