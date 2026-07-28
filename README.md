# Immersive Narrative Engine

INE is a work-independent, web-based player for **Narrative Packs**. The engine
contains no story-specific logic: any pack that follows the published schemas
can be loaded without changing the runtime.

This repository currently provides the production foundation: a minimal player,
core loading contract, renderer, validator, UI helpers, SDK entry point, example
pack, PWA shell, and continuous delivery to GitHub Pages.

## Requirements

- Node.js 20 or later
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

Additional verification is available with `npm run typecheck`.

## Repository layout

```text
apps/player/       Minimal browser player and PWA shell
packages/core/     Narrative loading and navigation state
packages/renderer/ DOM rendering boundary
packages/sdk/      Public author-facing types and future SDK entry point
packages/ui/       Accessible reusable UI primitives
packages/validators/ Runtime Narrative Pack validation
examples/demo-pack/ Small, work-neutral sample pack
schemas/           Versioned JSON Schemas
docs/              Architecture and Narrative Pack documentation
tests/             Reserved for cross-package integration tests
reports/           Mission reports
```

## Design principles

- The engine and narrative content remain strictly separated.
- Package boundaries describe responsibilities and can evolve independently.
- External data is validated before it reaches rendering code.
- The player is mobile-first, keyboard accessible, and progressively enhanced.
- Every change must leave the default branch installable and buildable.

See [the architecture guide](docs/ARCHITECTURE.md) and
[Narrative Pack specification](docs/NARRATIVE_PACKS.md).

## Deployment

Every push to `main` is built by GitHub Actions and deployed to GitHub Pages.
Pull requests run the same type and production-build checks without deploying.

## License

[MIT](LICENSE)
