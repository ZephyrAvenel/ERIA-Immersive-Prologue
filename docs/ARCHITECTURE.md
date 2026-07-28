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
- **renderer** translates trusted domain state into accessible DOM.
- **ui** contains work-independent controls and future design primitives.
- **sdk** is the eventual author-facing entry point; it currently re-exports
  stable types, asset resolution, and validation only.
- **player** composes packages and owns browser lifecycle concerns such as PWA
  registration and deployment configuration. It does not own narrative
  business rules or content.

The example pack is served as static data selected through
`player.config.json`. Replacing its URL with any conforming pack requires no
change to an application or package. Relative pack assets are resolved by the
Core `AssetManager` from the pack location, not from the Player location.

## Build and deployment

The repository is an npm workspace. Vite serves the player and bundles source
packages directly. TypeScript checks every application and package in strict
mode before Vite produces `dist/`.

GitHub Actions uses two workflows: continuous integration for pushes and pull
requests, and Pages deployment for successful pushes to `main`. Both use the
committed npm lockfile through `npm ci` and the same `npm run build` command
used locally.

## Evolution rules

1. Keep narrative-specific assets and decisions in Narrative Packs.
2. Introduce new pack capabilities through versioned schema changes.
3. Keep packages independently testable and isolate browser I/O from domain
   state as the loading boundary evolves.
4. Maintain backward compatibility within a declared pack version.
5. Prefer small interfaces at package boundaries over shared mutable state.
