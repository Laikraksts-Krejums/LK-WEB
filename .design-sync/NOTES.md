# design-sync notes for LK-WEB

## Not a published component library

LK-WEB is a Next.js app, not a design-system package: `package.json` has no
`main`/`module`/`exports` and there is no `dist/` build. The sync runs in
synth-entry mode (`package-build.mjs` with `--entry` pointed at a
non-existent path under `src/components/reader` purely so it walks up to the
repo's own `package.json` for `PKG_DIR`) and reads `.tsx` source directly.

## Excluded: IssueCard, IssueNav, Masthead

`cfg.srcDir` is scoped to `src/components/reader` — it deliberately excludes
`src/components/IssueCard.tsx`, `IssueNav.tsx`, and `Masthead.tsx` (which
imports `IssueNav`).

**Why:** the synth-entry generator does `export * from <every .tsx file
under srcDir>` in one shared entry, bundled into a single IIFE. `IssueCard`
and `IssueNav` import `next/link` / `next/navigation`, whose compiled code
reads `process.env.__NEXT_*` at module-load time (e.g.
`next/dist/client/has-base-path.js`). `process` doesn't exist in a browser
IIFE, so this throws a `ReferenceError` the instant those modules load —
which happens during the *whole bundle's* initial evaluation, breaking
`window.LkWeb` entirely (all 12 components, not just the 3 that import
`next/*`). Confirmed via a Playwright probe loading `_ds_bundle.js` directly:
`ReferenceError: process is not defined` at
`next/dist/client/has-base-path.js`, reached through `next/link`.

Fixing this properly would mean shimming a `process` global at bundle time —
that requires forking `lib/bundle.mjs`, which the skill explicitly protects
("the app contract surface — agent never edits... use config overrides or
cfg.dtsPropsFor instead"). No config override exists for excluding specific
files from the synth-entry file list (`componentSrcMap` only filters the
*component list*, not which source files get `export *`'d into the entry),
so scoping `srcDir` away from the offending files was the only sanctioned
fix.

## Preview gotcha: lazy hidden images hang the capture harness

`PageList` (and `Reader`, which composes it) keep **every** page mounted and
set `loading="lazy"` on all but the first, hiding the non-current ones with
`display:none` (this is deliberate — instant page flips with no re-decode).

`package-capture.mjs`'s `settle()` step does
`Promise.all(document.images.map(i => i.decode()))` with no timeout. A lazy
image inside a `display:none` container never loads, so its `decode()`
promise never settles and `page.evaluate` hangs **forever** (observed: a full
capture run wedged for 25 min on `PageList`). `package-validate.mjs` does not
hang — it screenshots after a bounded wait rather than awaiting decode.

**Fix applied:** the `PageList` and `Reader` previews pass only the pages that
are actually visible in the cell (one page per `PageList` cell; a single-page
issue for `Reader`), so every mounted `<img>` is on-screen and loads. Do NOT
give these previews multi-page `pages` arrays with off-view pages — it will
hang capture again. A live multi-page issue in the real app is fine; this is
purely a static-capture constraint.

## Re-sync risks

- If `IssueCard`/`IssueNav`/`Masthead` should ever be added back, the
  `process is not defined` crash will resurface unless Next.js ships a
  browser-safe build of `next/link`/`next/navigation`, or the app adopts a
  routing-agnostic nav component design-sync could bundle standalone.
- This repo has no build step (`buildCmd`) — re-sync always re-reads `.tsx`
  source directly (synth-entry mode), so `[DTS]` contracts stay weaker than
  a real `dist/` + shipped `.d.ts` would give (no `buildCmd` to run first).
- Tokens come from `src/app/globals.css` (`cfg.cssEntry`) appended verbatim
  into `_ds_bundle.css` — if the app ever splits tokens into a separate
  tokens file/package, update `cfg.cssEntry`/`cfg.tokensGlob` accordingly.
- Components use CSS Modules (`*.module.css`) scoped per-component; no
  design-tokens package exists separately from `globals.css`.
