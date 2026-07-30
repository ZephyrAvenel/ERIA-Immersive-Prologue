# Architecture

## Boundary model

INE is divided into small packages with one-way responsibilities:

```text
player --> core <-- renderer
   |----> validators --> core
   |----> renderer
   `----> ui

sdk ----> core
 `------> validators

packs/index.json --> library + static routes --> player
                                          |----> pack.json + colocated assets
?pack=<manifest> -------------------------'
```

- **core** owns stable domain types, pack loading, asset resolution, and
  narrative navigation.
- **validators** protects the engine boundary from malformed external data.
- **renderer** translates trusted domain state into accessible DOM. It receives
  localized interface copy and display options from the Player.
- **ui** contains work-independent controls and future design primitives.
- **sdk** is the eventual author-facing entry point; it currently re-exports
  stable types, asset resolution, and validation only.
- **player** composes packages and owns browser lifecycle concerns such as PWA
  registration, localization, local reading progress, input wiring, and
  deployment configuration. It does not own narrative business rules or content.

The versioned pack registry contains only a stable id, a public slug, and a
manifest path. The library reads presentation data from manifests, and the
build generates real `/oeuvres/<slug>/index.html` entry pages for GitHub Pages.
`player.config.json` is retained as a legacy deployment fallback; `?pack=` is
the explicit preview override. Relative pack assets are resolved by the Core
`AssetManager` from the pack location, not from the Player location.

The registry owns deployment coordinates. A manifest owns the work identity,
resources, and optional editorial metadata. A narrative path owns only scenes,
polarities, chapters, or other format-specific content. This prevents the
library and engine from acquiring work-specific knowledge.

## UX foundation

The Player presents a generic engine identity separately from the selected
Narrative Pack title. Visual content remains dominant: images use `contain` by
default, while optional scene-level modes (`cover`, `fill`, `immersive`) prepare
future art direction without changing the Renderer contract.

Localization is selected from the pack language and passed into rendering as
data. This keeps UI copy, pack content, and DOM rendering separate.

Optional introductory sequences are declared by the Narrative Pack under
`presentation.intro`. The Player renders the threshold using generic visual
language; the authored lines, title, and entry label remain pack data. This
keeps the engine independent from a particular work while allowing the public
experience to feel like an installation rather than a technical shell.

Transitions are split across the existing layers:

- **Core** defines the serializable transition contract, default values, and
  deterministic scene-entry resolution.
- **Validators** and JSON Schema reject unknown transition types, invalid
  durations, unknown easing names, malformed transition objects, and extra
  properties.
- **Player** owns navigation orchestration, temporary locking, `aria-busy`,
  focus restoration, and user motion preferences.
- **Renderer** executes the visual transition with native browser animation
  primitives and falls back to immediate rendering if animation is unavailable
  or fails.

This keeps transitions independent from narrative content and prevents Core from
depending on DOM, CSS, timers, or browser APIs.

Reading progress is another Player boundary concern. `ReadingProgressStore`
uses an injected storage adapter and stores only a small versioned record:

```text
schemaVersion
packId
packVersion
sceneId
sceneIndex
updatedAt
completed
```

The storage key is `ine:progress:v1:<pack-id>`. The pack id comes from the
Narrative Pack manifest and is independent from the title. The Player resolves
stored progress by `sceneId`, so a changed index does not prevent resume when
the scene still exists. If storage is corrupt, unavailable, or points to a
removed scene, the Player ignores it and renders the initial scene. Core exposes
only deterministic scene lookup/selection by id; it never reads or writes
browser storage.

Future input and ambience features should attach at the Player boundary:
keyboard, swipe, gamepad, transitions, intro variants, audio, video, animation,
ambience, and voice narration must be introduced through explicit configuration
and package interfaces rather than by embedding work-specific behavior in the
engine.

## Build and deployment

The repository is an npm workspace. Vite serves the player and bundles source
packages directly. TypeScript checks every application and package in strict
mode before Vite produces `dist/`.

GitHub Actions uses two workflows: continuous integration for pushes and pull
requests, and Pages deployment for successful pushes to `main`. Both use the
committed npm lockfile through `npm ci`. Deployment is gated by type checking,
unit tests, integration tests, coverage, production build, and browser tests.

Vite also validates the registry and generates a static entry page for each
published work. Those pages share one JavaScript and CSS bundle while carrying
work-specific canonical and Open Graph metadata.

The automated test foundation is intentionally package-oriented: Core,
Validators, Renderer, AssetManager, localization, and the Player browser shell
are verified through public contracts and observable behavior. See
`docs/TESTING.md` for contributor guidance.

## Evolution rules

1. Keep narrative-specific assets and decisions in Narrative Packs.
2. Introduce new pack capabilities through versioned schema changes.
3. Keep packages independently testable and isolate browser I/O from domain
   state as the loading boundary evolves.
4. Maintain backward compatibility within a declared pack version.
5. Prefer small interfaces at package boundaries over shared mutable state.
