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
is used. Presentation metadata may define transitions and an optional
introductory threshold sequence.

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

## Scene transitions

Transitions are optional visual presentation metadata. A pack that omits them
remains valid and uses an immediate `none` transition.

Supported transition types:

```text
none       Replace the scene immediately.
fade       Fade the current scene out, then fade the target scene in.
crossfade  Temporarily overlap old and new scenes while their opacity crosses.
slide      Move between scenes horizontally; direction follows navigation.
```

A pack may define a default transition:

```json
{
  "presentation": {
    "defaultTransition": {
      "type": "fade",
      "durationMs": 450,
      "easing": "ease-in-out"
    }
  }
}
```

An individual scene may override the pack default:

```json
{
  "id": "scene-04",
  "title": "Scene title",
  "text": "Scene text.",
  "transition": {
    "type": "crossfade",
    "durationMs": 700,
    "easing": "ease-in-out"
  }
}
```

The transition declared on a scene is used when that scene is entered.

`durationMs` is optional, must be between `0` and `3000`, and defaults to a
moderate engine value for animated transition types. `none` always normalizes to
duration `0`. Supported easing values are `linear`, `ease`, `ease-in`,
`ease-out`, and `ease-in-out`; arbitrary CSS timing functions are rejected.

When `prefers-reduced-motion: reduce` is active, the Player treats animated
transitions as immediate. A pack cannot override this user preference.

If a browser animation fails or is unavailable, the Renderer displays the target
scene immediately, clears transient transition state, and keeps the story
accessible.

To add a future transition type, update the Core transition union and defaults,
the JSON Schema enum, runtime validation, Renderer behavior, unit fixtures,
browser tests, and this document in the same mission.

## Introductory threshold

A pack may provide a short opening sequence under `presentation.intro`:

```json
{
  "presentation": {
    "intro": {
      "lines": [
        "Avant les mots…",
        "il y avait le souffle."
      ],
      "actionLabel": "Franchir le seuil"
    }
  }
}
```

`lines` and `actionLabel` are required when `intro` is present. `title` is
optional; when omitted, the Player uses the pack title. The engine controls the
generic visual treatment, while the pack owns the wording and identity.

The intro is optional and backwards compatible. A pack without intro starts
directly at its `startScene`.

## Interface language

The Player selects interface copy from the pack `language` field. Narrative text
and titles are never translated by the engine; they are authored content and
remain the responsibility of the Narrative Pack.

## Compatibility

The player rejects unknown formats, unknown versions, malformed scenes,
duplicate scene identifiers, and missing start scenes before rendering. JSON
Schema supports authoring tools, while the lightweight runtime validator mirrors
its foundation constraints and additionally checks duplicate scene identifiers
the `startScene` reference, allowed image display modes, transition contracts,
and intro structure.
