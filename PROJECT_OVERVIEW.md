# ProViz — Project Overview

A single reference for running, understanding and extending ProViz: what it is, how to run it, how the pages and roles work, how a program becomes a 3D picture, and what every part of the codebase contains.

Built by **11Rs Products**.

---

## Contents

1. [What ProViz is](#1-what-proviz-is)
2. [Running the project](#2-running-the-project)
3. [Configuration](#3-configuration)
4. [Pages and the user journey](#4-pages-and-the-user-journey)
5. [Roles and access](#5-roles-and-access)
6. [The app: studios and what they are for](#6-the-app-studios-and-what-they-are-for)
7. [Using the Visualizer](#7-using-the-visualizer)
8. [How a program becomes a 3D world](#8-how-a-program-becomes-a-3d-world)
9. [Project structure](#9-project-structure)
10. [Design system and theming](#10-design-system-and-theming)
11. [Testing and quality checks](#11-testing-and-quality-checks)
12. [Deployment](#12-deployment)
13. [Known limits and notes](#13-known-limits-and-notes)
14. [Where to change common things](#14-where-to-change-common-things)

---

## 1. What ProViz is

ProViz is a browser-based visual code IDE. You write a program, run it entirely inside the browser, and step through it **forwards and backwards in time** while every variable, list, object and reference is drawn in a live 3D world.

- **Language today:** Python (real CPython compiled to WebAssembly via Pyodide). Java, C++ and JavaScript are planned.
- **Privacy:** code runs on the user's device and is never uploaded.
- **Two audiences:**
  - **General access** (guests and anyone signed in with Google): the Visualizer and debugger.
  - **Developer access** (Admin, Super admin): additionally the verification "studios" (Control Center, Release Gates, Continuous, Insights, Team).

**Tech stack:** Vite (multi-page build), plain ES modules, vanilla CSS, CodeMirror 6 (editor), Three.js + GSAP (3D and animation), Pyodide (Python in WebAssembly), Firebase Authentication (Google sign-in).

---

## 2. Running the project

### Prerequisites

- **Node.js 18+** (developed on Node 26) and npm
- An internet connection on first run: Pyodide, numpy/pandas and fonts are loaded from CDNs.

### First-time setup

```bash
cd /Users/itz_ats_sama/ProViz
npm install
```

Make sure a `.env` file exists in the project root (see [Configuration](#3-configuration)). A template is in `.env.example`.

### Start the development server

```bash
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`. If 5173 is busy, Vite uses the next free port.

| URL | What opens |
|---|---|
| `/` | Landing page |
| `/app/` | The IDE (requires sign-in or "Try without signing in") |
| `/privacy/` | Privacy Policy |
| `/terms/` | Terms of Service |

Stop the server with `Ctrl + C`.

### Preview every role without real accounts (development only)

| URL | Simulates |
|---|---|
| `/app/?preview=guest` | Guest |
| `/app/?preview=user` | General (signed-in) user |
| `/app/?preview=admin` | Admin |
| `/app/?preview=superadmin` | Super admin |
| `/app/?preview=off` | Back to normal behaviour |

The preview sticks for that browser tab. It is removed from production builds.

### Run the tests

```bash
node test/run_all_tests.mjs
```

Expected: **39/39 files, 965 checks passing.** Run a single file with `node --test test/<file>.mjs`.

Two timing benchmarks (stage 29 and stage 35) can occasionally miss their time limit on a busy machine. Re-running passes.

### Build and preview production

```bash
npm run build      # outputs to dist/
npm run preview    # serves dist/ locally
```

### Regenerate the landing page's 3D images

Only needed if the 3D look changes. It requires `npm run dev` to be running:

```bash
node scripts/capture-landing-renders.mjs
```

This writes `public/landing/world-light.webp` and `world-dark.webp`.

---

## 3. Configuration

### Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key (Google sign-in) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project id |
| `VITE_ADMIN_EMAILS` | Comma-separated Google e-mails that get the **Admin** role |
| `VITE_SUPERADMIN_EMAILS` | Comma-separated Google e-mails that get the **Super admin** role |

**After changing `.env`, restart the dev server or rebuild.** `VITE_*` values are compiled into the public JavaScript, so never put secrets there.

### Firebase console (one-time)

1. **Authentication → Sign-in method:** enable **Google**.
2. **Authentication → Settings → Authorised domains:** add every production domain. `localhost` is allowed by default.

### Browser storage used by the app

| Key | Stored in | Purpose |
|---|---|---|
| `proviz.theme` | localStorage | Light / dark choice |
| `proviz.studio` | localStorage | Last opened studio |
| `proviz.sidebarWidth`, `proviz.editorHeight` | localStorage | Pane sizes |
| `proviz.speed` | localStorage | Playback speed |
| `proviz.scratchpad` | localStorage | The user's own code in the Scratchpad |
| `proviz.guest` | localStorage | User chose "Try without signing in" |
| `proviz.previewRole` | sessionStorage | Dev-only role preview |
| Firebase session | localStorage | Keeps the user signed in |

---

## 4. Pages and the user journey

```text
            ┌──────────────────────────── Landing page  /  ────────────────────────────┐
            │  "Start with Google"      "Try without signing in"      "Get started"    │
            └───────────┬──────────────────────────┬────────────────────────┬──────────┘
                        │ Google popup             │ sets guest flag        │ opens sign-in dialog
                        ▼                          ▼                        │
                 signed-in session            guest session  ◄──────────────┘
                        └────────────┬─────────────┘
                                     ▼
                              The app  /app/
                 role decided → studios + controls shown for that role
                                     │
                       User menu → Sign out / Leave guest mode
                                     ▼
                              back to Landing  /
```

- **Opening `/app/` with no session** redirects to `/?from=app`, which shows a notice and opens the sign-in dialog.
- **Sign-in:** a Google popup, falling back to a full-page redirect if the browser blocks popups. Any Google account works.
- **A boot screen** ("Opening your workspace…") shows in the app while the session resolves, so the wrong role's studios never flash on screen.
- **Footers:** the public pages (landing, privacy, terms) have a full footer with Privacy, Terms and "Built by 11Rs Products". Dashboard pages have a slim footer. In the Visualizer, these links are in the user menu.

### Landing page sections

1. **Hero:** headline, description, sign-in / guest buttons, and a full-width replica of the workspace. Its 3D view is a real render from the app.
2. **Features:** each feature shown as a small piece of the real UI (timeline, inline values, references, breakpoints, error card, narration, languages).
3. **How it works:** three steps.
4. **Access:** Guest vs General (signed in).
5. **Privacy callout**
6. **FAQ:** with a contact link.
7. **Final call to action**, then the footer.

---

## 5. Roles and access

### The four roles

| Role | Access type | How someone gets it | Badge |
|---|---|---|---|
| **Guest** | General | "Try without signing in" | Guest |
| **General** (`user`) | General | Sign in with any Google account | General |
| **Admin** | Developer | E-mail listed in `VITE_ADMIN_EMAILS`, or Firebase claim `role: "admin"` / `admin: true` | Admin |
| **Super admin** | Developer | E-mail listed in `VITE_SUPERADMIN_EMAILS`, or claim `role: "superadmin"` / `superadmin: true` | Super admin |

Rules (in `src/auth/roles.js#resolveRole`):

- Super admin wins over Admin if an e-mail appears in both lists.
- Firebase custom claims can **raise** a role but never lower one granted by the allowlist.
- The role is always visible: as a badge in the header user chip, and with a description in the user menu.

### What each role can see and do

| Studio or action | Guest | General | Admin | Super admin |
|---|:-:|:-:|:-:|:-:|
| Visualizer (editor, run, debugger, 3D view, examples) | ✓ | ✓ | ✓ | ✓ |
| Control Center | — | — | ✓ | ✓ |
| Release Gates | — | — | ✓ | ✓ |
| Continuous | — | — | ✓ | ✓ |
| Insights | — | — | ✓ | ✓ |
| Team & roles page | — | — | — | ✓ |
| Run verification loop, evaluate release, synthesize repair | — | — | ✓ | ✓ |
| Export audit trail | — | — | ✓ | ✓ |
| Change autonomy level | — | — | locked (visible) | ✓ |
| Safe mode on/off | — | — | hidden | ✓ |
| Issue certificate | — | — | hidden | ✓ |

- **Single-studio roles** (Guest, General) don't get a studio switcher. The header shows "Visualizer".
- **The ⌘K command palette** only lists studios the role can open.

> **Important:** roles control what the **interface** shows. They are not a security boundary. Anything that must truly be protected (future server data) needs Firebase security rules or a backend that checks the same claims.

---

## 6. The app: studios and what they are for

| Studio | Who | Purpose |
|---|---|---|
| **Visualizer** | Everyone | The IDE: code editor, run, time-travel debugger, inspector and 3D memory world. |
| **Control Center** | Admin+ | Overview of the verification engine: health numbers, the 12-phase verification pipeline, release-gate checklist, event journal (with filters), decision engine, resources, certificate. Actions: run verification loop, evaluate release, synthesize repair, export audit, plus (Super admin) issue certificate, safe mode and autonomy level. |
| **Release Gates** | Admin+ | Security, performance and concurrency sign-off cards. |
| **Continuous** | Admin+ | Recent changes and automatically proposed, verified fixes. |
| **Insights** | Admin+ | Project health ring and architecture-boundary rules. |
| **Team & roles** | Super admin | Who holds developer roles, how to change roles, and the full permission matrix. |

The verification studios are driven by the "Autonomous Verification OS" engines in `src/` (see `brain.md` and `docs/` for the 36-stage design).

---

## 7. Using the Visualizer

### Layout

- **Left pane:** toolbar (file tab, example menu, runtime status, reset, Run) → code editor → step explanation → inspector tabs (Variables · Call stack · Output) → playback bar.
- **Right pane:** the 3D world (legend, Fit button, step caption, keyboard hints).
- **The splitter** between the panes, and the one under the editor, can be dragged; sizes are remembered.
- **Below 900px wide** the layout stacks: editor → playback controls (sticky) → 3D view → inspector.

### Examples menu

- **Your code → Scratchpad:** your own code, saved automatically and restored when you return to it or reload.
- **Examples · Algorithms:** Sum of squares, Two Sum, Fibonacci, Binary Search, Bubble Sort.
- **Examples · Data structures:** Linked list (classes); Dictionaries, sets & Counter.
- **Examples · Data & tables:** Matrix (2-D list), Records (list of dicts), pandas DataFrame, NumPy arrays.

Examples are only starting code. **Any** Python program you type is visualised the same way.

### Debugging features

- **Breakpoints:** click the gutter left of a line number.
- **Inline values:** changed values appear at the end of the line that changed them.
- **Current line:** highlighted with an accent bar; an error line is highlighted in red.
- **Timeline:** drag the scrubber to any step. Ticks mark calls (purple), breakpoints (amber) and errors (red).
- **Cross-highlighting:** clicking a 3D block or an inspector card highlights that variable everywhere in the editor.
- **Errors:** syntax and runtime errors appear as a diagnostic card with the exact line and traceback ("Go to line").

### Keyboard shortcuts

| Key | Action |
|---|---|
| `F5` or `⌘/Ctrl + Enter` | Run |
| `F10` or `→` | Step over |
| `F11` or `↓` | Step into |
| `Shift + F11` or `↑` | Step out |
| `←` | Step back (time travel) |
| `F8` | Continue to next breakpoint |
| `Space` | Play / pause |
| `Home` / `End` | First / last step |
| `F` | Fit the 3D view |
| `⌘/Ctrl + K` | Command palette |
| `Esc` | Close dialogs / error card |

---

## 8. How a program becomes a 3D world

```text
Editor text
   │  executor.run(code)                                   main.js → src/engine/PythonExecutor.js
   ▼
1. Prepare imports: auto-download Pyodide packages the code imports (numpy, pandas…)
   and import them untraced
   ▼
2. Run under sys.settrace — ONLY the user's code is traced (library frames skipped;
   user callbacks such as sort keys are still traced). Each line/call/return records
   locals + a heap snapshot
   ▼
3. Raw events → Universal Execution Trace (UET)               src/trace/*, src/engine/TraceTransformer.js
   ▼
4. PlaybackEngine + StateReconstructor rebuild the RuntimeState (call stack, scopes, heap)
   for any step                                                src/PlaybackEngine.js, src/playback/, src/runtime/
   ▼
5. WorldModel: RuntimeState → plain data (frames, variables, heap objects, tables, edges)
                                                               src/rendering/WorldModel.js
   ▼
6. SpatialWorld: Three.js scene, reconciled by id, animated with GSAP
                                                               src/rendering/SpatialWorld.js
   ▼
Editor highlights, inline badges, inspector and explanation update in sync   main.js, src/ExplanationEngine.js
```

### What gets visualised

| Python value | Shown as |
|---|---|
| int, float, str, bool, None, complex, Decimal, Fraction, dates, Enum members, bytes, numpy scalars | A coloured block with its value (numbers blue, text green, booleans amber) |
| list, tuple, set, frozenset, dict, and subclasses (deque, Counter, defaultdict, OrderedDict, range, bytearray) | A tray of cells with its real class name (e.g. `deque`, `Counter`) |
| Class instances, dataclasses, named tuples, `__slots__` classes | A tray whose cells are the field names |
| **Tables:** pandas DataFrame, 2-D numpy array, list of equal-length lists, list of same-key dicts | **One grid** with column headers and row labels, each cell coloured by type |
| pandas Series | Index → value entries |
| Generators, iterators (map/zip/enumerate), functions | A readable value such as `<generator gen>` |
| References between objects | Curved arcs from variable/cell to the object, with travelling pulses |
| Call stack | One tray per active function; the active one is tinted and labelled |

### Safety limits

| Limit | Value | Where |
|---|---|---|
| Max trace steps | 50,000 (then stopped with a clear message) | `PythonExecutor.js` |
| Max run time | 8 s (excludes package download/import) | `PythonExecutor.js` |
| Nesting depth captured | 8 | `PythonExecutor.js` |
| Items per container captured | 64 | `PythonExecutor.js` |
| Table capture | 12 rows × 10 columns | `PythonExecutor.js` |
| Cells drawn per object | 12 (then "+N more") | `WorldModel.js` |
| Table cells drawn | 10 rows × 8 columns (then "+N rows / cols") | `WorldModel.js` |
| Objects drawn per step | 40 | `WorldModel.js` |

Runaway loops raise `ExecutionLimitExceeded`, which user code can't catch with `except Exception`.

---

## 9. Project structure

```text
ProViz/
├── index.html                 Landing page (/)
├── app/index.html             The IDE (/app/): header, studios, Team page, boot gate, dialogs
├── privacy/index.html         Privacy Policy (/privacy/)
├── terms/index.html           Terms of Service (/terms/)
├── partials/                  Shared HTML injected at build time via <!--@name--> (see vite.config.js)
│   ├── head.html              Meta tags, theme pre-paint script, fonts, style.css
│   ├── icons.html             Inline SVG icon sprite (<use href="#i-…">)
│   ├── brand.html             ProViz logo mark + word
│   ├── site-header.html       Public-site header (nav, theme toggle, sign-in / open app)
│   ├── site-footer.html       Public-site footer (product, company, legal, "Built by 11Rs Products")
│   ├── auth-dialog.html       "Welcome to ProViz" sign-in / guest dialog + toast region
│   └── app-footer.html        Slim footer for dashboard pages
├── main.js                    App entry: editor, debugger, 3D world, inspector, studios, roles, menus,
│                              shortcuts, command palette, responsive header/toolbar fitting
├── style.css                  Velvet design tokens + all app styles (shared base for the site)
├── site.css                   Landing / legal / auth-dialog styles (on top of style.css)
├── vite.config.js             Multi-page build inputs + the HTML partials plugin
├── package.json               Scripts: dev, build, preview; dependencies
├── .env / .env.example        Firebase keys and role allowlists
├── public/                    Static files served as-is
│   └── landing/               world-light.webp / world-dark.webp (real 3D renders for the hero)
├── scripts/
│   └── capture-landing-renders.mjs   Regenerates the hero's 3D renders from the real app
├── CLAUDE.md                  Engineering guide for AI pair-programming (conventions, design rules)
├── brain.md                   Long-form architecture and 36-stage roadmap
├── PROJECT_OVERVIEW.md        This document
├── docs/                      Design notes for each engine/stage (trace, debugger, verification …)
├── test/                      39 Node test files (node:test) + run_all_tests.mjs
└── src/
    ├── auth/
    │   ├── roles.js           Pure role model: roles, studios, capabilities, resolveRole(), helpers
    │   └── session.js         Session source: Firebase user / guest / dev preview → role
    ├── firebase.js            Firebase app + Google sign-in (popup with redirect fallback)
    ├── site/
    │   ├── site.js            Public pages: theme toggle, session-aware buttons, sign-in dialog
    │   └── themeTransition.js The theme "wave" (circular reveal + ripple rings)
    ├── examples/
    │   └── catalog.js         Example menu groups (Algorithms, Data structures, Data & tables)
    ├── questions/registry.js  The original algorithm programs (used as examples)
    ├── engine/
    │   ├── PythonExecutor.js  Pyodide loading, package auto-load, Python tracer + value serializer
    │   └── TraceTransformer.js Raw tracer output → canonical trace
    ├── trace/                 Universal Execution Trace schema, requests, legacy frame adapter
    ├── runtime/               RuntimeState, CallFrame, Scope, Heap, HeapObject (incl. tables), Value
    ├── PlaybackEngine.js      Timeline, seek/play/pause, speed, step events
    ├── playback/              State reconstruction for any step
    ├── debugger/              Debugger core, breakpoints, StepNavigator (over/into/out/continue, markers)
    ├── ExplanationEngine.js   Plain-English narration of each step
    ├── rendering/
    │   ├── WorldModel.js      RuntimeState → frames, variables, objects, tables, edges (pure, tested)
    │   ├── SpatialWorld.js    Three.js renderer: trays, blocks, grids, arcs, labels, camera, themes
    │   └── SceneRenderer.js   Earlier scene renderer (used by tests/older paths)
    ├── scene/, layout/, animation/, inspection/, inspector/, workspace/
    │                          Scene graph, layouts, animation runtime, inspection and workspace models
    └── analysis/, dataflow/, typeflow/, verification/, symbolic/, testing/, concolic/, repair/,
        mutation/, regression/, specification/, exploration/, probabilistic/, planning/,
        orchestration/, federation/, knowledge/, semantic/, evolution/, security/,
        performance/, concurrency/, continuous/, project/, os/
                               The verification engines (stages 2–36) behind the developer studios;
                               os/ is the Autonomous Verification OS (autonomy levels, approvals, audit)
```

### Legacy / currently unused files

Kept for reference, not loaded by the app:
- `src/CodeRunner.js`, `src/VisualizerAPI.js`, `src/visualizers/`
- `src/sanity.js` (Sanity CMS client)
- Root-level `test_run.cjs`, `test_screenshot.cjs`, `test_screenshot.js`, `test_solution.cjs` (old Puppeteer scripts)

They can be removed in a clean-up.

---

## 10. Design system and theming

**"Velvet"** comes in two themes that share one set of tokens, defined at the top of `style.css`:

| | Velvet (light) | Velvet Night (dark) |
|---|---|---|
| Background | warm ivory `#F6F1EA` | plum-black `#121014` |
| Brand | wine `#7A2E4A` | rose `#E08FAB` |
| Accents | terracotta, antique gold | amber |

Rules:
- **Fonts:** Inter for UI and numbers; Instrument Serif for headings (never for numbers); JetBrains Mono for code and values.
- **No neon, glows or emoji.** Depth comes from soft shadows and 1px borders. Icons come from the SVG sprite.
- **Colours come from tokens only.** The 3D palettes in `SpatialWorld.js` (`WORLD_THEMES`) mirror the CSS tokens.
- **Theme choice:** resolved before paint (saved choice, else OS setting). Switching plays the "wave": the new theme spreads in a circle from the toggle, with ripple rings.
- **Responsive behaviour:**
  - The public site uses a fluid width and scales up in steps on screens from 1600px to 3200px+.
  - The app header compacts step by step only when space runs out: off-centre tabs → search label hidden → status badge hidden → tighter tabs → only the active tab labelled → icons only.
  - On phones the header gets a second, scrollable nav row.
  - The editor toolbar compacts by measuring its own panel width.

---

## 11. Testing and quality checks

- **Unit/integration tests:** `node test/run_all_tests.mjs` (39 files, 965 checks). Notable files:
  - `test_auth_roles.mjs`: role resolution, studios, capabilities.
  - `test_ide_world_model.mjs`: world projection and debugger stepping.
  - `test_world_tables.mjs`: table detection, table heap objects, class-name display.
  - `test_stage1…36_*.mjs`: the verification engines.
- **Production build:** `npm run build` must finish with no errors.
- **Manual checks worth repeating after UI changes:**
  - Both themes.
  - Widths 1920 / 1440 / 1280 / 1024 / 820 / 768 / 390.
  - Every role via `?preview=`.
  - A spread of Python programs: primitives, containers, classes, recursion, generators, standard library, numpy, pandas, plus deliberate syntax and runtime errors.

---

## 12. Deployment

1. Set the production `.env` values, then run `npm run build`.
2. Deploy the `dist/` folder to any static host (Firebase Hosting, Netlify, Vercel, GitHub Pages…).
3. Serve it as a **multi-page** site: `/app/`, `/privacy/` and `/terms/` are real folders with their own `index.html`. Do **not** add a "rewrite every route to `/index.html`" SPA rule.
4. Add the production domain to Firebase **Authorised domains**.

---

## 13. Known limits and notes

- **Roles gate the UI only.** Real protection needs server-side rules.
- **Python only for now.** Interactive `input()` isn't supported. Only packages available in Pyodide can be imported.
- **Very large data is shortened** (see [Safety limits](#safety-limits)).
- **First numpy/pandas use downloads packages** (a few seconds; a loading card is shown).
- **`VITE_*` variables end up in the browser bundle.** Never store secrets there. `src/sanity.js` reads a Sanity token from the environment; it's unused today, but should move to a server before it's used.
- **The main app bundle is large** (~2.4 MB). Code-splitting is a future optimisation.
- **Dev-only debug handle:** in development, `window.__proviz` exposes the world, playback, executor and editor for debugging. It doesn't exist in production builds.

---

## 14. Where to change common things

| I want to… | Edit |
|---|---|
| Give someone Admin / Super admin | `.env` → `VITE_ADMIN_EMAILS` / `VITE_SUPERADMIN_EMAILS`, then rebuild |
| Change what a role can open or do | `src/auth/roles.js` (`STUDIOS`, `CAPABILITIES`) and `data-cap` attributes in `app/index.html` |
| Add an example program | `src/examples/catalog.js` (or `src/questions/registry.js` for algorithms) |
| Support a new Python value type | `_scalar` / `_serialize_value` in `src/engine/PythonExecutor.js` |
| Change how data is laid out in 3D | `src/rendering/WorldModel.js` (what) and `src/rendering/SpatialWorld.js` (how it looks) |
| Change colours, fonts, spacing | Tokens at the top of `style.css` (and `WORLD_THEMES` in `SpatialWorld.js` for 3D) |
| Edit landing-page content | `index.html` (+ `site.css`); shared header/footer in `partials/` |
| Edit the privacy policy or terms | `privacy/index.html`, `terms/index.html` |
| Change execution limits | Constants at the top of `src/engine/PythonExecutor.js` |
| Change the theme-switch animation | `src/site/themeTransition.js` and the `.theme-ripple` rules in `style.css` |
