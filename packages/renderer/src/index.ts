import type { NarrativePack, NarrativeScene } from "@ine/core";

export function renderPlayer(
  target: HTMLElement,
  pack: NarrativePack,
  scene: NarrativeScene,
  progress: number,
  controls: HTMLElement,
): void {
  target.replaceChildren();

  const player = document.createElement("div");
  player.className = "player";

  const eyebrow = document.createElement("p");
  eyebrow.className = "player__eyebrow";
  eyebrow.textContent = pack.title;

  const article = document.createElement("article");
  article.id = "scene";
  article.className = "scene";
  article.tabIndex = -1;

  if (scene.image) {
    const image = document.createElement("img");
    image.className = "scene__image";
    image.src = scene.image;
    image.alt = scene.imageAlt ?? "";
    article.append(image);
  }

  const content = document.createElement("div");
  content.className = "scene__content";
  const title = document.createElement("h1");
  title.textContent = scene.title;
  const text = document.createElement("p");
  text.className = "scene__text";
  text.textContent = scene.text;
  content.append(title, text);
  article.append(content);

  const progressRegion = document.createElement("div");
  progressRegion.className = "progress";
  const progressLabel = document.createElement("span");
  progressLabel.textContent = "Progress";
  const progressText = document.createElement("span");
  progressText.textContent = `${Math.round(progress * 100)}%`;
  const track = document.createElement("div");
  track.className = "progress__track";
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-label", "Narrative progress");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "100");
  track.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
  const value = document.createElement("div");
  value.className = "progress__value";
  value.style.width = `${progress * 100}%`;
  track.append(value);
  progressRegion.append(progressLabel, progressText, track);

  player.append(eyebrow, article, progressRegion, controls);
  target.append(player);
}
