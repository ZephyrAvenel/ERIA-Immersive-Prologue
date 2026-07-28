export function createButton(label: string, onActivate: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onActivate);
  return button;
}
