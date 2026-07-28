class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  contains(value) {
    return this.element.className.split(/\s+/).includes(value);
  }
}

export class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.dataset = {};
    this.style = {
      removeProperty(name) {
        delete this[name];
      },
    };
    this.className = "";
    this.id = "";
    this.tabIndex = 0;
    this.textContent = "";
    this.disabled = false;
    this.type = "";
    this.parentElement = null;
    this.classList = new FakeClassList(this);
  }

  append(...children) {
    for (const child of children) {
      child.parentElement = this;
      this.children.push(child);
    }
  }

  replaceChildren(...children) {
    this.children = [];
    this.append(...children);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  addEventListener() {}

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }

  get firstElementChild() {
    return this.children[0] ?? null;
  }

  querySelector(selector) {
    return findElement(this, selector);
  }

  querySelectorAll(selector) {
    return findElements(this, selector);
  }
}

export class FakeDocument {
  createElement(tagName) {
    return new FakeElement(tagName);
  }
}

function matches(element, selector) {
  if (selector.startsWith(".")) return element.classList.contains(selector.slice(1));
  if (selector.startsWith("#")) return element.id === selector.slice(1);
  if (selector.startsWith("[")) {
    const match = selector.match(/^\[([^=]+)="?([^"\]]+)"?\]$/);
    return match ? element.getAttribute(match[1]) === match[2] : false;
  }
  return element.tagName.toLowerCase() === selector.toLowerCase();
}

function visit(element, selector, results) {
  for (const child of element.children) {
    if (matches(child, selector)) results.push(child);
    visit(child, selector, results);
  }
}

export function findElements(root, selector) {
  const results = [];
  visit(root, selector, results);
  return results;
}

export function findElement(root, selector) {
  return findElements(root, selector)[0] ?? null;
}

export function withFakeDocument(callback) {
  const previousDocument = globalThis.document;
  globalThis.document = new FakeDocument();
  let isAsync = false;
  try {
    const result = callback();
    if (result && typeof result.then === "function") {
      isAsync = true;
      return result.finally(() => {
        globalThis.document = previousDocument;
      });
    }
    return result;
  } finally {
    if (!isAsync) {
      globalThis.document = previousDocument;
    }
  }
}
