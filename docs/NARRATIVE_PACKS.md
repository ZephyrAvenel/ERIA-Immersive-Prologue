# Narrative Packs

A Narrative Pack is an independent work consumed by INE. Version 1.0 of the
foundation format is intentionally small and will evolve through later missions.
Its canonical machine-readable contract is
[`schemas/narrative-pack.schema.json`](../schemas/narrative-pack.schema.json).

## Minimum contract

A pack declares its format and version, stable identifier, display title,
language, initial scene, and a non-empty ordered scene list. Each scene includes
an identifier, title, and text. An image and accessible alternative may be
provided. A scene may also declare `imageDisplayMode`; when omitted, `contain`
is used.

Asset paths are URI references resolved relative to the pack manifest URL by
the Core `AssetManager`. Keeping a pack manifest and its asset folders together
therefore makes the pack portable between deployments. Absolute asset URLs
remain valid.

## Asset layout

Narrative Packs reserve the following folders under `assets/`:

```text
assets/
  images/
  audio/
  video/
  icons/
```

Image references should point to normalized files under `assets/images/`.
Future audio, video, and icon references will use the same resolution boundary
instead of direct file paths in the Player or Renderer.

## Image display modes

`imageDisplayMode` prepares the visual contract without binding the engine to a
specific work:

```text
contain    Display the complete image. This is the default.
cover      Fill the image area and allow cropping when intentional.
fill       Stretch the image into the available area.
immersive  Use a larger, atmospheric image area for future transitions.
```

Authors should prefer `contain` when preserving the full illustration matters.
Other modes are explicit presentation choices made by the pack, not by the
engine.

## Interface language

The Player selects interface copy from the pack `language` field. Narrative text
and titles are never translated by the engine; they are authored content and
remain the responsibility of the Narrative Pack.

## Compatibility

The player rejects unknown formats, unknown versions, malformed scenes,
duplicate scene identifiers, and missing start scenes before rendering. JSON
Schema supports authoring tools, while the lightweight runtime validator mirrors
its foundation constraints and additionally checks duplicate scene identifiers
the `startScene` reference, and allowed image display modes.
