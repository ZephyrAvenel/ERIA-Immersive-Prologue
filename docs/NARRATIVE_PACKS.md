# Narrative Packs

A Narrative Pack is an independent work consumed by INE. Version 1.0 of the
foundation format is intentionally small and will evolve through later missions.
Its canonical machine-readable contract is
[`schemas/narrative-pack.schema.json`](../schemas/narrative-pack.schema.json).

## Minimum contract

A pack declares its format and version, stable identifier, display title,
language, initial scene, and a non-empty ordered scene list. Each scene includes
an identifier, title, and text. An image and accessible alternative may be
provided.

Asset paths are resolved from the deployed player's base URL in this foundation.
A dedicated portable asset-resolution contract is recommended for the next pack
specification mission.

## Compatibility

The player rejects unknown formats, unknown versions, malformed scenes,
duplicate scene identifiers, and missing start scenes before rendering. JSON
Schema supports authoring tools, while the lightweight runtime validator
protects production loading without introducing a validation framework.
