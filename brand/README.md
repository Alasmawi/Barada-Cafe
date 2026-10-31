# Finjan · فنجان — brand assets

Night-majlis identity for the Barada Collab Board: gold-line "hologram" finjans and a dallah on deep ink.
Open `preview.html` in a browser to see every asset moving.

## The idea

| App moment | Art | File |
|---|---|---|
| Collab spots | A leaning stack of cups. One cup = one spot. | `src/finjan-art.js` → `stackSVG()` |
| Accept a creator | The top cup leaves the stack, the dallah pours, the cup is served | `svg/state-accepted.svg` (plays once), `svg/scene-serve.svg` (loop) |
| Collab full | Stack gone, dashed ghost cup, tray full | `svg/spots-full.svg` |
| Visit pass | The collab's own cup, filled | `cupSVG({ seed, fill: .85 })` |
| Mark done | The hazz — the cup shake that says "I'm served", then a cardamom check | `svg/state-done.svg` |
| Loading / Empty / Error | Dallah pouring · dallah waiting, no cups · the tower tips a cup | `svg/state-loading.svg`, `svg/state-empty.svg`, `svg/state-error.svg` |

Each collab gets its own foil pattern (fronds, dots, stripes, waves, stars, feathers), picked from the collab id,
so the same collab always looks the same — like the mixed stack in a real majlis.

## Files

```
svg/
  finjan-mark.svg            animated mark (3-cup tower, sway + hologram flicker)
  finjan-mark-static.svg     same, no motion
  finjan-mark-light.svg      for light backgrounds
  finjan-lockup.svg          mark + Finjan + فنجان + tagline (on dark)
  finjan-lockup-light.svg    on light
  finjan-wordmark.svg        "Finjan" (outlined Unbounded)
  finjan-wordmark-ar.svg     "فنجان" (outlined Reem Kufi)
  scene-serve.svg            signature loop for landing / switch-user screen
  state-*.svg                loading, empty, error, accepted, done
  spots-*.svg                spots-meter examples
  pattern-gallery.svg        all six foil patterns
icons/                       app-icon (svg + 180/192/512 png), maskable 512, favicon (svg + 32 png)
src/finjan-art.js            the art engine — pure functions returning SVG strings, no dependencies
src/FinjanStack.tsx          React spots meter (animates the newest cup onto the tray)
tokens.css                   colours, status colours, fonts, spacing, motion
preview.html                 self-contained showcase
```

## Using them

- **Animated SVGs work as plain images**: `<img src="/brand/state-loading.svg" alt="">`. Motion is CSS inside the file and
  stops automatically for users with *Reduce Motion* on.
- **To replay a play-once SVG** (accepted, done), change its `src` (e.g. append `#` + timestamp) or re-mount the element.
- **Live, per-collab art**: `import { stackSVG, cupSVG } from './finjan-art.js'` or use `<FinjanStack spots taken seed={collab.id} />`.
  Only numbers and a hashed seed go into the markup — no user text — so `innerHTML` is safe here.
- **Text is outlined to paths** in logo files, so they render identically without the fonts installed. UI text uses the
  fonts from `tokens.css`.

## Status labels (UI only — code keeps plain status names)

| status | label | colour token |
|---|---|---|
| pending | Brewing | `--status-pending` |
| accepted | Your cup's ready | `--status-accepted` |
| submitted | Posted | `--status-submitted` |
| done | Served | `--status-done` |
| declined | Not this time | `--status-declined` |

## Fonts (all SIL Open Font License, Google Fonts)

Unbounded (Latin display) · Reem Kufi (Arabic display, logo) · IBM Plex Sans Arabic (body, both scripts).
