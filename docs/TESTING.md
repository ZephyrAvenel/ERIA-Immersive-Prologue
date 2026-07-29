# Testing guide

INE tests verify public contracts and observable behavior. They intentionally
avoid large snapshots, network dependencies, arbitrary sleeps, and assumptions
about private implementation details.

## Commands

```sh
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:coverage
npm run test:ci
```

- `test:unit` checks Core navigation/loading contracts, AssetManager path
  resolution, Validators, Renderer output, transition contracts, and locale
  helpers.
- `test:integration` checks the real demo Narrative Pack against the schema,
  runtime validator, Core loader, assets, and locale files.
- `test:e2e` starts the Vite Player and drives a real browser through the
  Chrome DevTools Protocol.
- `test:coverage` enforces initial coverage thresholds on Core, Renderer, and
  Validators.
- `test:ci` is the full non-watch command used by GitHub Actions.

## Fixtures

Dedicated fixtures live in `tests/fixtures/valid/` and
`tests/fixtures/invalid/`. Prefer a minimal fixture that demonstrates one rule
clearly. Use the demo pack only when the test must verify the integrated pack
published with the Player.

When adding a fixture:

1. Give it a descriptive filename.
2. Keep unrelated fields out of the fixture.
3. Add or update a validator test that names the contract being protected.
4. If the rule is structural, verify JSON Schema and runtime validation agree.

## Unit and integration tests

Tests are plain Node.js test modules. They compile TypeScript into
`.test-build/` before execution, then import the public package entry points
from the compiled output.

Use unit tests for stable package contracts:

- Core loading and navigation state;
- AssetManager resolution;
- Validator acceptance and rejection;
- Renderer DOM output through a focused fake DOM;
- locale selection and interpolation.

Use integration tests for cross-boundary behavior, especially a real Narrative
Pack manifest plus colocated assets.

## Browser and accessibility tests

The browser test lives in `tests/e2e/player.test.mjs`. It checks the running
Player for:

- successful pack loading;
- absence of console errors and critical failed requests;
- full eight-scene navigation;
- French interface copy for the current pack;
- public work identity without visible technical engine labels;
- introductory threshold rendering and entry without page reload;
- default `contain` image display mode;
- configurable scene transitions;
- navigation locking during a transition;
- local reading progress persisted only after stable navigation;
- resume and restart decisions after reload;
- unavailable browser storage fallback;
- focus restoration after animated and reduced-motion navigation;
- `prefers-reduced-motion` disabling visual animations;
- desktop, tablet, and mobile layout sanity;
- no vertical scrolling for standard short scenes at the supported viewports;
- keyboard focus behavior;
- elementary accessibility signals such as headings, alt text, named buttons,
  semantic scene structure, and an accessible progress indication.

In CI, Chrome must be available. Locally, set `CHROME_PATH` when you want to
force browser execution from a specific executable. If Chrome is not explicitly
available in a restricted local environment, the browser test is skipped rather
than becoming flaky.

Transition tests should observe stable states such as `aria-busy`, progress
text, DOM cleanup, and focus target. Avoid pixel-perfect expectations and avoid
long sleeps. If a transition needs to wait for completion, prefer the observable
end state: `aria-busy` removed, one `.player` in the DOM, expected progress
visible, and focus on an enabled control.

On failure, useful files are written under `test-results/`; GitHub Actions
uploads them only for failed runs.

## Coverage

Coverage currently targets:

- `packages/core/src/index.ts`;
- `packages/renderer/src/index.ts`;
- `packages/validators/src/index.ts`.

Initial thresholds are:

- lines: 80%;
- functions: 80%;
- branches: 70%.

Do not add low-value tests only to satisfy a percentage. Raise thresholds when
new stable behavior is covered naturally.

## Diagnosing CI failures

1. Open the failing GitHub Actions run.
2. Identify whether the failure occurred in install, typecheck, tests, coverage,
   build, browser tests, artifact upload, or deployment.
3. For browser failures, download the `browser-test-artifacts` artifact if it is
   present.
4. Reproduce locally with the smallest matching command, for example
   `npm run test:unit` or `CHROME_PATH=/path/to/chrome npm run test:e2e`.
5. Fix the contract or implementation, then rerun `npm run test:ci`.
