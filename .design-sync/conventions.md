## LK-WEB reader components

A small set of components from *lk-web* — a Latvian digital-magazine reader.
Everything is exported on `window.LkWeb`. The palette is cream + black with a
single orange accent, set in a serif (Georgia) with a mono (Courier New)
accent for numeric UI.

### Setup — no provider

These components need **no provider or theme wrapper**. Import and render them
directly. They are client components that use browser APIs (`matchMedia`,
`requestFullscreen`, pointer/wheel listeners), so they run only in the
browser, never in a server render.

`Reader` is the top-level piece: give it `pages` (a `ReaderPage[]` — each has
`src`, `width`, `height`, `isSpread`) and optional `hotspots`
(`ReaderHotspot[]`). It owns its own paging, zoom, and control bar; you do not
compose `PageList` or `ReaderControls` yourself unless you are rebuilding the
shell. The five `Icon*` components are the reader's toolbar glyphs — render one
inside a round pill button (see the snippet).

### Styling idiom — CSS custom properties (design tokens)

This is a **token-based CSS system**, not a utility-class or styled-prop one.
Each component ships its own styles (CSS Modules, class names already baked
in), so you never write class names for the library components. Style **your
own** surrounding layout with the design tokens below — they are real
`var(--*)` custom properties defined globally in the bundle:

| Token | Value / role |
|---|---|
| `--cream` | `#fbf7f0` page background |
| `--cream-deep` | `#f2e8d9` recessed surfaces |
| `--ink` | `#30302e` primary text / lines |
| `--ink-soft` | `#5a5a58` secondary text |
| `--orange` | `#f05322` the single accent |
| `--orange-deep` | `#c9421a` accent pressed/hover |
| `--rule` | `rgba(48,48,46,.15)` hairline borders |
| `--font-serif` | body serif (Georgia stack) |
| `--font-mono` | numeric/UI mono (Courier New stack) |
| `--bp-mobile` | `780px` mobile breakpoint |

Do not invent other token names — these are the whole vocabulary. Use `--ink`
on `--cream`, reserve `--orange` for a single emphasis per view.

### Where the truth lives

Read the compiled stylesheet the agent has bound — `_ds/<folder>/styles.css`,
which `@import`s `_ds_bundle.css` (the components' own CSS, and where the
tokens above are defined). Each component's `<Name>.d.ts` is its exact prop
contract and `<Name>.prompt.md` its usage notes — read those before composing.

### Idiomatic build snippet

```tsx
import { Reader } from "window.LkWeb"; // exported on window.LkWeb at runtime

export function IssueView({ pages }) {
  return (
    <main style={{ background: "var(--cream)", color: "var(--ink)",
                   fontFamily: "var(--font-serif)", minHeight: "100vh" }}>
      <h1 style={{ fontFamily: "var(--font-mono)", color: "var(--orange)" }}>
        nr. 12
      </h1>
      {/* Reader owns its stage, zoom and control bar. */}
      <Reader pages={pages} />
    </main>
  );
}
```

The look is **hand-drawn** (the Krējums sketch language): no shadows anywhere,
wobbly single-stroke icons, and a live wobble on hover. For a standalone icon
button, render an `Icon*` glyph **alone** — no container, no outline: a
transparent `border: none` button (resetting the native button border is
load-bearing), `color: var(--ink)`, turning `var(--orange)` with a gentle
rotate wobble on hover. The glyph is a single `currentColor` stroke; never
add a two-tone fill or a ring around it.
