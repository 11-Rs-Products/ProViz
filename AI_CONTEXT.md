# AI_CONTEXT.md — Working memory for AI sessions on ProViz

> **Read this first in any new session.** Dense, hands-on context: what the product is, what has
> been built, how it works, the user's preferences, hard-won gotchas and how to verify changes.
> The human-facing reference is `PROJECT_OVERVIEW.md`; coding conventions are in `CLAUDE.md`;
> long-form architecture is in `brain.md`. **Keep this file current: update the "State" and
> "Change log" sections at the end of every work session.**

---

## 0. State (as of 2026-10-08)

- **Repo:** `/Users/itz_ats_sama/ProViz` · GitHub `11-Rs-Products/ProViz` · base branch `main`.
- **Committed:** `feat/ide-elevation` was merged to `main` via PR #3. That covers the landing page, auth, roles, legal pages, 3D world, theme work and the fluid hero.
- **Uncommitted on `main`:** the universal-visualisation round. That's the tracer rewrite, tables, the examples catalog, `PROJECT_OVERVIEW.md`, this file and `test/test_world_tables.mjs`.
  - **Do not commit unless the user asks.** If they do, branch first (never commit straight to `main`).
- **Tests:** `node test/run_all_tests.mjs` → **39/39 files, 965 checks**. Stage 29/35 timing benchmarks can flake under CPU load; re-run.
- **Build:** `npx vite build` is clean. The app bundle is about 2.4 MB, and the size warning is expected.
- **Dev server:** `npm run dev`, or the `.claude/launch.json` config `proviz-dev` (port 5173, strictPort).

---

## 1. The user and how they want to work

- The user owns ProViz and is building it for the **world**, not for one college. Organisation: **11Rs Products** (footer: "Built by 11Rs Products", links to `github.com/11-Rs-Products`).
- **Wants a production-grade, premium product,** not a beta. They react strongly to things that "feel AI-generated": generic eyebrow labels, icon-tile grids, checkmark lists, filler copy.
- **Loves the Velvet theme.** Keep it. Ivory/wine light, plum/rose dark, Instrument Serif headings, Inter UI, JetBrains Mono code.
- **Communication:** short updates with occasional "~X% done". Clear final summaries: what changed, why, how it was verified.
- **Verify visually and functionally** before claiming done, in **both themes** and at many widths. They test on Chrome on a retina Mac. They notice misalignment, overlap, stutter and wasted space.
- **Product decisions already made:**
  - **Sign-in:** any Google account, plus a "Try without signing in" guest mode.
  - **Roles:** email allowlists in `.env`; Firebase custom claims may raise a role.
  - **Role tiers:** Guest / General (`user`) / Admin / Super admin. Public copy talks only about **General vs Guest access**. Admin and Super admin are internal developer roles: don't advertise them on the landing page.
  - **Languages:** Python today. Java, C++ and JavaScript are planned. Don't claim "Python only" as the identity ("currently supports Python").
  - **No mention of a future app version** in the product copy.
  - Don't use instructor / classroom / student language.

---

## 2. Product functionality (what exists)

### Public site
- **`/` landing page:**
  - Split hero (big serif headline, then the description and CTAs).
  - A full-width **replica of the workspace** whose 3D pane is a **real render** (`public/landing/world-*.webp`).
  - **Features bento:** real UI fragments (timeline, inline values, refs, breakpoint, error card, narration, languages).
  - How it works.
  - **Access:** Guest vs General only.
  - Privacy callout.
  - **FAQ:** sticky intro, +/− list, GitHub contact.
  - Final CTA, then the footer.
- **`/privacy/` and `/terms/`:** full legal pages (effective 8 Oct 2026, contact via GitHub issues).
- **Sign-in dialog:** Google or guest. `/app/` without a session redirects to `/?from=app`.
- **Theme toggle with the "wave":** a View Transition circular reveal from the toggle plus two ripple rings, about 560ms with accelerating easing. There's no theme switch in the footer (the user asked to remove it).
- **Fluid layout:**
  - `.site-wrap` uses `--wrap-pad: clamp(16px, 4.2vw, 72px)` and a 1480px content max.
  - `body.site` is `zoom`ed at 1.08 / 1.16 / 1.3 / 1.5 / 1.85 from 1600 / 1800 / 2100 / 2500 / 3200px.

### App (`/app/`)
- **Boot gate:** waits for the session, then applies the role (nav, capabilities, user menu, Team page).
- **Header:**
  - Brand; the studio nav (hidden for single-studio roles, which show a "Visualizer" crumb instead).
  - ⌘K search, status badge (admin+), theme toggle, user chip with role pill, and a user menu (identity, access type, role summary, theme, sign in/out, legal links, credit).
- **Studios:** Visualizer (all); Control Center, Release Gates, Continuous, Insights (admin+); Team & roles (super admin).
- **Capabilities:** gated with `data-cap`. Admins see the autonomy picker locked; safe mode and certificate are hidden.
- **Visualizer:**
  - CodeMirror 6 editor: breakpoints gutter, exec-line pulse, inline value badges, error line, variable cross-highlight.
  - Explanation panel; inspector (Variables / Call stack / Output); transport (first, back, play, over, into, out, continue).
  - Timeline scrubber with call/breakpoint/error ticks; speed slider.
  - 3D canvas with legend, Fit and step chip; diagnostic error card; runtime overlay (also used for package downloads).
- **Examples menu** (`src/examples/catalog.js`):
  - **Your code:** Scratchpad (persisted in `proviz.scratchpad`, restored on return and on reload).
  - **Examples · Algorithms:** 5 programs from `src/questions/registry.js`.
  - **Examples · Data structures:** linked list; dict/set/Counter.
  - **Examples · Data & tables:** matrix, records, pandas, numpy.
  - **Examples are only starting code.** Run always executes the editor contents.
- **Shortcuts:** F5 / ⌘↵ run · F10/→ over · F11/↓ into · ⇧F11/↑ out · ← back · F8 continue · Space play · Home/End · F fit · ⌘K palette · Esc.

---

## 3. Architecture cheat-sheet

```text
editor text → PythonExecutor.run(code)
  ├─ _prepareImports(): pyodide.loadPackagesFromImports + _proviz_preimport (untraced)
  ├─ _run_user_code(): sys.settrace(_ProVizTracer.trace) — traces ONLY '<user_code>' frames
  │    (trace() returns None for other files; user callbacks from libraries still get 'call')
  ├─ per event: locals via _serialize_value(), heap snapshot, mutations, changed vars
  └─ → UET trace (src/trace, TraceTransformer)
PlaybackEngine/StateReconstructor → RuntimeState (callStack, scopes, Heap of HeapObject)
WorldModel.buildWorldModel(state, frame) → {frames, objects (incl. grid tables), edges}
SpatialWorld.update(world) → keyed Three.js reconciliation + GSAP tweens
main.js renderStep() syncs editor highlight, badges, explanation, inspector, transport
```

**Key files:**
- **Auth:** `src/auth/roles.js` (pure, tested); `src/auth/session.js` (Firebase / guest / `?preview=` dev role); `src/firebase.js` (lazy-loaded).
- **Public site behaviour:** `src/site/site.js`; `src/site/themeTransition.js` (the wave).
- **Shared HTML:** `partials/*.html`, expanded by the `proviz-html-partials` plugin in `vite.config.js` (`<!--@name-->`).
- **Styles:** `style.css` (tokens + app); `site.css` (public pages).
- **Value serialization:** `src/engine/PythonExecutor.js` (Python source lives inside a JS template literal; mind the backslashes and `${}`).
- **Heap model:** `src/runtime/HeapObject.js` supports `list | tuple | set | dict | instance | table`.
- **World model:** `src/rendering/WorldModel.js` — `tableOf()` detects tracer tables, matrices (lists of equal primitive rows) and records (lists of same-key dicts). Absorbed rows aren't drawn twice.
- **Renderer:** `src/rendering/SpatialWorld.js`:
  - Every tray is a 0.12-high plate on the floor (`TRAY_Y` / `BLOCK_Y` / `SOCKET_Y` / `CELL_Y`).
  - Tables go through `_upsertGrid` (rows back→front, cols left→right, headers, per-cell type colour).
  - Labels are sprites with `depthTest: false` (always on top).
  - Arrows are solid tubes (opaque after fade-in).
  - Auto-frame: fit on the first step; re-fit when the bounds outgrow the framed area, unless the user has orbited.
  - No pedestals, rings or outline boxes (the user found them weird).

**Value coverage:**
- **Scalars:** big ints are sent as text; inf/nan as text; complex, Decimal, Fraction, dates, Enum, bytes and numpy scalars become primitives.
- **Containers:** built-ins and their subclasses keep their className (deque, Counter, defaultdict, range, bytearray…).
- **Objects:** namedtuple and `__slots__` objects are shown with their field names.
- **Data:** DataFrame and 2-D ndarray become `type: 'table'`; a Series shows as dict entries.
- **Everything else** (iterators, generators, functions) gets a readable primitive. **Nothing is "opaque".**

**Limits:**
- 50k steps, 8s run time (import time excluded).
- Depth 8; 64 items per container; table capture 12×10.
- World drawing: 12 cells per object, 10×8 table cells, 40 objects.

---

## 4. Responsive and layout systems (non-obvious)

- **App shell:** `html.app-root body` is a flex column, so the header height is free (no `--header-h` maths).
- **Header compaction:** `main.js#fitHeader`, driven by a ResizeObserver, applies steps in order only while the row overflows:
  1. `hd-offcenter`: grid becomes `auto 1fr auto`.
  2. `hd-compact-search`
  3. `hd-no-badge`
  4. `hd-tight`
  5. `hd-active-only`: only the active tab is labelled.
  6. `hd-icons`

  At ≤720px it skips this; the CSS uses two rows with a scrollable labelled nav. The side columns use `minmax(max-content, 1fr)` so the nav can't overlap the logo. It re-fits on role apply, studio switch, safe-mode toggle and `fonts.ready`.
- **Editor toolbar:** `main.js#fitEditorToolbar` drops steps one at a time (`tb-no-kbd` → `tb-dot` → `tb-no-file`), measured against `.editor-file` overflow with the select's min-width at 130px.
- **Container queries:** `.viz-sidebar-left { container: ide }` (playback legend wrapping); `.viz-canvas-area { container: canvas }` (legend shrink/wrap/hide, shortcut strip hidden below 640px).
- **IDE stacks at ≤900px:** the sidebar is set to `display: contents` and `order` puts the editor first, then the sticky transport, the canvas and the inspector.
- **Dashboards:** `.page` max width is `calc(1680px + 2*clamp(20px, 3.4vw, 64px))`.

---

## 5. Gotchas learned the hard way (read before touching these areas)

1. **Never read `import.meta.env` as a whole object** (e.g. `const env = import.meta.env`). Vite inlines **every** `VITE_*` var into the bundle, which leaked the Sanity token once. Use `import.meta.env.VITE_X` directly. The dev-only preview path is gated by `const PREVIEW_ENABLED = Boolean(import.meta.env?.DEV)` so it tree-shakes.
2. **Theme wave coordinates:**
   - The clip-path circle must use **percentages** of the viewport. Pixel values landed at x/DPR on the user's retina Chrome.
   - The ripple element must be appended to **`<html>`, not `<body>`**: the body is `zoom`ed on large screens, which multiplies `left/top`.
   - `::view-transition-group(root)` animation is disabled.
3. **Headless screenshots of view transitions or WebGL lie:**
   - `page.screenshot({clip})` resizes the viewport (`captureBeyondViewport`), which re-triggers resize handlers and distorts VT snapshots. Use `captureBeyondViewport: false`.
   - To inspect a VT frame, pause `document.getAnimations()` and set `currentTime`. **Never leave the user's browser pane frozen.** It happened once and looked like a bug to the user.
4. **WebGL in headless Chrome:** use `args: ['--use-angle=metal', '--ignore-gpu-blocklist']` (best on this Mac), or swiftshader with `--enable-unsafe-swiftshader`.
5. **The Claude Browser pane is narrow** (~636px) and scales emulated viewports. Use Puppeteer at real sizes for visual checks; use the pane for interaction checks and the user's-eye view.
6. **CSS rule order:** a later rule with equal specificity overrides a container/media rule (e.g. `.file-tab { display: inline-flex }` beat the container query). Raise specificity, e.g. `.editor-header-bar .file-tab`.
7. **`[hidden] { display: none !important; }`** is global in `style.css`. Elements with display styles still honour `hidden`.
8. **`HeapObject` only keeps known fields.** Any new heap shape must be added to its constructor, clone, toJSON, equals and getOutboundReferences, or the data silently disappears (that's what happened with tables at first).
9. **The tracer must not step into libraries.** Before the fix, the dataclass, Fraction, date, random and namedtuple programs crashed or produced thousands of internal steps. Also: JSON with `NaN`/`-Infinity` from Python breaks `JSON.parse`, so non-finite floats are sent as text.
10. **zsh in Bash calls:** glob patterns like `--include=*.js` must be quoted. `timeout` isn't installed. Prefer the scratchpad dir for temp files. `rm` with globs after `cd` is blocked by safety checks.
11. **The overlap detector has known false positives:** inline links wrapping onto two lines, and the scrollable phone nav's off-screen tabs.

---

## 6. How to verify (recipes)

- **Tests:** `node test/run_all_tests.mjs`. Add tests for any new pure logic; there are role, world-model and table tests to extend.
- **Dev-only debug handle** (`window.__proviz`, development builds only): `world`, `playback`, `executor`, `editor`, `lastWorld`, `lastTrace`.
  - Load code with `__proviz.editor.dispatch({changes:{from:0,to:doc.length,insert:code}})`.
  - Click `#btn-run`, then wait until it's no longer disabled.
  - Seek with `__proviz.playback.seek(i)`.
  - Read `__proviz.lastWorld` to inspect the rendered model.
- **Layout sweep** (Puppeteer; script was in the session scratchpad):
  - For each page, width (1920, 1440, 1280, 1024, 820, 768, 390) and theme: load with `localStorage.proviz.theme` / `proviz.studio` set and `?preview=<role>`.
  - Flag horizontal overflow, elements past the right edge, clipped buttons/tags, and pairwise overlaps of leaf text elements (skip closed `<details>`).
- **Program benchmark:** about 33 programs:
  - primitives, list/dict/set/tuple/frozenset, nested matrix, records, recursion, memoised fib;
  - classes, inheritance, dataclass, `__slots__`, namedtuple, deque/Counter/defaultdict;
  - range/enumerate/zip/map, generator, lambda sort, closures, exceptions;
  - Fraction/Decimal/complex/big int, strings/bytes, random, math, datetime/Enum;
  - bubble sort, BFS, a 200-item list, cycles, print-only, numpy, pandas;
  - a syntax error and a runtime error.

  **Expect:** no errors except the two intentional ones, no library function names in the step list, no opaque values.
- **3D check:** run a program, seek to the last step, `world.fitView(true)`, then screenshot `#canvas-container`. Also orbit the camera (`world.camera.position.set(...)`; `controls.update()`) to check labels/trays from side and top angles.
- **Theme-wave check:** after clicking the toggle, compare the toggle's centre, the circle centre (keyframe % × innerWidth/Height) and the `.theme-ripple` rect centre. They must be equal at widths 1440/1728/1920/2560 and when scrolled.
- **Landing hero renders:** `node scripts/capture-landing-renders.mjs` (dev server must be running).

---

## 7. Open follow-ups / ideas (not done)

- **Real protection** for any future server data: Firebase rules checking the same role claims.
- **Code-splitting** the 2.4 MB app bundle (lazy-load the verification studios and Three.js).
- **Remove legacy unused files:** `src/CodeRunner.js`, `src/VisualizerAPI.js`, `src/visualizers/`, `src/sanity.js` (the token must never be bundled), root `test_*.cjs` / `test_screenshot.js`.
- **`input()` support** (would need a prompt bridge); multi-language runners (Java / C++ / JS adapters onto the UET).
- **Roadmap items in CLAUDE.md:** live AST/CFG minimap; multi-tab studio polish.
- **Privacy contact:** currently GitHub issues; the user may want a real contact email.
- **"How it works" landing section:** still uses plain cards. It could get the same product-fragment treatment as Features.

---

## 8. Change log (session history, newest last)

1. **IDE elevation:**
   - `WorldModel` + `SpatialWorld` (3D world from the UET trace); `StepNavigator` debugger semantics; CodeMirror decorations; shortcuts and command palette; splitters.
   - Pyodide status, timeouts and execution limits; diagnostic cards.
   - The Velvet redesign (light + dark).
2. **Landing, auth, roles, legal:**
   - Multi-page Vite build with HTML partials; Google sign-in + guest; role model and tests; role-gated studios, user menu, Team page.
   - Footers; privacy and terms; boot gate; dev `?preview=`.
   - Responsive pass at 7 widths × 2 themes. Fixed the `import.meta.env` leak and the idle orb.
3. **Copy and roles:**
   - Language-neutral copy ("currently supports Python"); `student` → `user` ("General"); no classroom wording.
   - Removed skewed outline boxes on 3D trays; labels drawn on top; auto-framing.
4. **3D consistency:** solid arrows (no grid bleed); all trays on the floor; removed pedestals and rings; the editor toolbar now measures its own space.
5. **Header:** measured stepwise compaction (`fitHeader`); off-centre step; active-tab-only labels; the canvas legend never collides with Fit.
6. **Theme:** removed the footer theme switch; added the wave transition. Fixed its timing (accelerating, 560ms), DPR offset (percentages) and zoom offset (ripple on `<html>`).
7. **Landing redesign:** fluid width + large-screen zoom; product-first hero with a real 3D render; features bento; Access (Guest vs General only); FAQ redesign; wider dashboards.
8. **Universal visualisation:**
   - Confirmed Run is already universal. Tracer limited to user code; auto package loading (numpy/pandas).
   - Value coverage broadened; tables (DataFrame, ndarray, matrix, records) rendered as grids with typed cell colours.
   - Grouped examples catalog; scratchpad persistence; 7 new tests.
   - Benchmark: 33/33 behave as expected.
9. **Docs:** `PROJECT_OVERVIEW.md` (for humans) and this `AI_CONTEXT.md` (for AI sessions); CLAUDE.md now points here.
