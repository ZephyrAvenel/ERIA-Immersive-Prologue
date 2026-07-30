# Changelog

All notable changes to the Immersive Narrative Engine are documented here.
INE follows [Semantic Versioning](https://semver.org/): engine contract changes
determine the repository version, while each immersive work retains its own
content version in its manifest.

## [1.0.0] — 2026-07-30

End of Cycle I — first stable public foundation.

### Engine

- established work-independent Core, Renderer, Validator, UI, SDK, and Player
  boundaries;
- added portable asset resolution relative to pack manifests;
- added configurable CSS/native browser transitions and reduced-motion support;
- added localized interface copy, accessible navigation, image fallbacks, and
  responsive layouts;
- added local, versioned reading progress with resume and restart;
- established unit, integration, coverage, browser, and GitHub Pages quality
  gates.

### Narrative works

- published PACK-001 — *Les Gardiens des Récits Vivants*;
- published the independent PACK-002 — *Polarités Vivantes*, with ten
  contemplative stages;
- integrated the twelve official PACK-002 illustrations, including cover and
  closing compositions;
- preserved original PNG sources and optimized WebP delivery assets;
- kept all authored text, navigation, and resources outside engine code.

### Distribution

- introduced a minimal, versioned pack registry;
- added a manifest-driven immersive works library;
- added stable `/oeuvres/<slug>/` URLs generated as real static pages;
- added per-work canonical, description, Open Graph, and social image metadata;
- retained `?pack=` as a preview and diagnostic mechanism;
- preserved one shared engine bundle across all public works.

### Editorial architecture

- defined the common identity required for a published immersive work;
- separated engine, work manifest, narrative path, and deployment concerns;
- proposed an optional additive editorial metadata contract;
- defined typed connections to books, articles, ERIA, the author site, and
  other immersive works;
- added a practical creation and publication guide for future works.

### Compatibility

- PACK-001 and PACK-002 remain independent and directly addressable;
- the site remains fully static and compatible with GitHub Pages;
- no runtime server or additional production dependency is required.

[1.0.0]: https://github.com/ZephyrAvenel/ERIA-Immersive-Prologue/releases/tag/v1.0.0
