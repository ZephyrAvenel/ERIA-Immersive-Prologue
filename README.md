# Immersive Narrative Engine

INE is a work-independent, web-based player for **Narrative Packs**. The engine
contains no story-specific logic: any pack that follows the published schemas
can be loaded without changing the runtime.

Cycle I provides the production foundation: an immersive player, core loading
contract, renderers, validators, UI helpers, SDK entry point, three independent
works, a manifest-driven library, dedicated public URLs, a PWA shell, and
continuous delivery to GitHub Pages.

## Requirements

- Node.js 24 or later
- npm 10 or later

## Get started

```sh
npm install
npm run dev
```

The development server prints its local URL. To create a production build:

```sh
npm run build
npm run preview
```

Additional verification is available with:

```sh
npm run typecheck
npm run test:ci
```

The site root presents two editorial doors: **VIVRE / Packs narratifs** and
**CRÉER / Ateliers augmentés**. Narrative Packs remain available through the
immersive works library at `/bibliotheque/`, and public works keep their stable
routes under `/oeuvres/<slug>/`. The Augmented Workshops orientation is exposed
at `/ateliers/` as planned editorial entries only; no pedagogical runtime is
implemented yet. The build derives pack routes and social metadata from the pack
registry and each pack manifest. The `?pack=<manifest>` query remains available
for local preview and diagnostics. Adding a conforming work never requires
editing an engine package.

## Narrative Pack assets

Pack resources live beside the pack manifest under `assets/`, with reserved
folders for `images/`, `audio/`, `video/`, and `icons/`. Runtime code resolves
asset references through the Core `AssetManager`, so applications and renderers
do not hard-code file locations.

Scene images use `contain` by default so an author's illustration is displayed
in full. Packs may opt into `cover`, `fill`, or `immersive` through
`imageDisplayMode` when a different visual treatment is intentional.

Narrative Packs may also declare scene transitions. Supported transition types
are `none`, `fade`, `crossfade`, and `slide`. A pack can define
`presentation.defaultTransition`, and an individual scene can override it with
its own `transition`. Transitions are optional and are disabled automatically
when the user prefers reduced motion.

Packs may declare an optional `presentation.intro` with authored lines and an
entry label. The Player renders it as a generic threshold experience before the
first scene; the copy and title still come from the pack.

## Reading progress

The Player can persist reading progress locally per Narrative Pack. Progress is
stored under `ine:progress:v1:<pack-id>` and contains only stable runtime state:
pack id, pack version, scene id, current scene index, update date, completion
state, and a schema version. It never stores pack content, images, analytics,
accounts, or personal data.

An authored introduction always remains the first screen of a visit. After the
visitor crosses that threshold, a valid saved scene beyond the start scene
offers an accessible choice to resume or restart. A saved start scene continues
directly without a redundant prompt. If storage is unavailable, corrupt, or
references a removed scene, the Player falls back to the pack start scene
without blocking reading.

## Interface language

Player interface copy lives in `apps/player/src/locales/`. The active locale is
selected from the Narrative Pack language, with English as fallback for unknown
language codes. Content text remains owned by the pack manifest.

## Repository layout

```text
apps/player/       Minimal browser player and PWA shell
packages/core/     Narrative loading and navigation state
packages/renderer/ DOM rendering boundary
packages/sdk/      Public author-facing types and future SDK entry point
packages/ui/       Accessible reusable UI primitives
packages/validators/ Runtime Narrative Pack validation
examples/demo-pack/ First artistic Narrative Pack and normalized assets
packs/             Published pack registry, PACK-002, and PACK-003
apps/player/src/editorial-registry.json
                   Editorial families and planned Augmented Workshops
schemas/           Versioned JSON Schemas
docs/              Architecture and Narrative Pack documentation
tests/             Unit, integration, browser, accessibility, and fixture tests
reports/           Mission reports
```

## Design principles

- The engine and narrative content remain strictly separated.
- Package boundaries describe responsibilities and can evolve independently.
- External data is validated before it reaches rendering code.
- Interface copy is localized outside rendering logic.
- The player is mobile-first, keyboard accessible, and progressively enhanced.
- Every change must leave the default branch installable and buildable.

See [the architecture guide](docs/ARCHITECTURE.md),
[distribution architecture](docs/INE-DISTRIBUTION-ARCHITECTURE.md),
[editorial model](docs/MODELE-EDITORIAL-OEUVRES-IMMERSIVES.md),
[new immersive work guide](docs/CREER-UNE-OEUVRE-IMMERSIVE.md),
[PACK-003 Atlas guide](docs/PACK-003-ATLAS-RECITS-VIVANTS.md),
[Cycle I releases](CHANGELOG.md),
[Narrative Pack specification](docs/NARRATIVE_PACKS.md), and
[testing guide](docs/TESTING.md).

## Tests

The repository uses Node.js' built-in test runner so the automated test
foundation stays dependency-light and reproducible with the committed lockfile.

```sh
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:coverage
npm run test:ci
```

Browser tests start the Vite player and drive Chrome through the Chrome DevTools
Protocol. In CI, Chrome must be available and the test fails if it cannot run.
Locally, set `CHROME_PATH` when Chrome is not discoverable or when the desktop
environment restricts browser automation. The browser scenario covers scene
intro threshold, transitions, navigation locking, reading progress
resume/restart, unavailable storage, focus restoration, the library, direct
routes for all published packs, the prologue-to-library journey, responsive
layout without standard-scene scrolling, mobile polarity controls, and
Living Card navigation, mobile controls, and
`prefers-reduced-motion`.

## Deployment

Every push to `main` is tested, built, and deployed to GitHub Pages by GitHub
Actions. Pull requests and non-main branches run the same quality gate without
deploying. The deployment chain is:

```text
npm ci
typecheck
unit tests
integration tests
coverage
build
browser tests
upload Pages artifact
deploy Pages
```

The repository's Pages publishing source must be set to **GitHub Actions** once
by an administrator, as required by GitHub.

## License

[MIT](LICENSE)
