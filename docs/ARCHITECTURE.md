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

player.config.json --> player --> Narrative Pack JSON + colocated assets
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
  registration, localization, input wiring, and deployment configuration. It
  does not own narrative business rules or content.

The example pack is served as static data selected through
`player.config.json`. Replacing its URL with any conforming pack requires no
change to an application or package. Relative pack assets are resolved by the
Core `AssetManager` from the pack location, not from the Player location.

## UX foundation

The Player presents a generic engine identity separately from the selected
Narrative Pack title. Visual content remains dominant: images use `contain` by
default, while optional scene-level modes (`cover`, `fill`, `immersive`) prepare
future art direction without changing the Renderer contract.

Localization is selected from the pack language and passed into rendering as
data. This keeps UI copy, pack content, and DOM rendering separate.

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

Future input and ambience features should attach at the Player boundary:
keyboard, swipe, gamepad, transitions, audio, video, animation, ambience, and
voice narration must be introduced through explicit configuration and package
interfaces rather than by embedding work-specific behavior in the engine.

## Build and deployment

The repository is an npm workspace. Vite serves the player and bundles source
packages directly. TypeScript checks every application and package in strict
mode before Vite produces `dist/`.

GitHub Actions uses two workflows: continuous integration for pushes and pull
requests, and Pages deployment for successful pushes to `main`. Both use the
committed npm lockfile through `npm ci`. Deployment is gated by type checking,
unit tests, integration tests, coverage, production build, and browser tests.

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
