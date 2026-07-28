# Tests

INE uses dependency-free automated tests built on the Node.js test runner.

```sh
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:coverage
npm run test:ci
```

Unit and integration tests compile TypeScript into `.test-build/` before
running. Browser tests start Vite and drive a real Chrome-compatible browser
through the Chrome DevTools Protocol.

Fixtures live under `tests/fixtures/`. Prefer a minimal fixture for each
contract case instead of reusing the full demonstration Narrative Pack when a
small pack is enough.

Transition fixtures cover valid defaults, scene overrides, reduced-motion-safe
`none`, unknown transition types, invalid durations, unknown easing names, extra
properties, and malformed transition objects. Keep future transition tests tied
to observable contracts: normalized Core output, validator/schema agreement,
DOM cleanup, `aria-busy`, focus, and reduced-motion behavior.

To add a unit test, place a `*.test.mjs` file under `tests/unit/` and import
the compiled public module from `.test-build/`. To add an integration test,
place it under `tests/integration/` and keep the assertion focused on an
observable contract across package boundaries. The portable launcher files
discover test files recursively for Windows and Linux CI.

When an e2e test fails in CI, inspect the uploaded `test-results/` artifact for
the browser screenshot, HTML report inputs, and failure notes.
