# CLAUDE.md — ProViz: Autonomous Verification OS & 3D Execution IDE

> **Primary Purpose:** This guide serves as the single source of truth for Claude Code (and any AI pair programmer) to understand, develop, test, fix, and elevate **ProViz** into a world-class, production-grade 3D Code Visualizer and Autonomous Verification Operating System.

---

## 1. Product Vision & Architecture North Star

**ProViz** is a universal, interactive, browser-based 3D IDE and Autonomous Verification Operating System. Users write arbitrary Python code (and in the future, other languages), execute it in-browser via WebAssembly, inspect live runtime state in 3D space, time-travel step through execution with synchronized AST/code highlights, and govern code health via autonomous multi-domain verification gates.

### 🌟 Core Architectural Philosophy
1. **Execution Decoupled from Visualization:** The execution layer describes *what the program did* (Universal Execution Trace - UET). The visualization layer decides *how that state looks in 3D/2D space*.
2. **Zero Prior Configuration for Ordinary Code:** Users can type arbitrary code (`x = 10; y = 20; z = x + y`) and immediately observe state in 3D without manually declaring visualizer hooks.
3. **Universal Trace Pipeline:**
   ```text
   Source Code (Python / Polyglot)
       ↓
   Language Adapter (Pyodide Wasm + sys.settrace)
       ↓
   Universal Execution Trace (UET Events: lines, calls, returns, allocations, mutations)
       ↓
   Runtime State Snapshot Engine (Call Stack, Heap Graph, Scope Frames)
       ↓
   Scene Graph & Diff Engine (Node reconciliation, spatial layouts, pointer meshes)
       ↓
   3D WebGL / Three.js World + GSAP Animations + CodeMirror 6 Editor Sync
   ```
4. **Autonomous Verification OS (Stages 1–36):** Beyond visualization, ProViz incorporates 36 layers of verification intelligence: Symbolic Execution, Concolic Testing, Automated Program Repair, Mutation Testing, Multi-Domain Release Gates, and L0–L5 Policy-Controlled Continuous Autonomy.

---

## 2. Quick Start & Common Development Commands

ProViz is built using **Vite** + **Pure ES Modules (ESM)** + **Vanilla CSS/JS** + **Three.js** + **CodeMirror 6** + **Pyodide**.

### Run Dev Server
```bash
npm run dev
# Starts Vite local server (usually http://localhost:5173)
```

### Run Full Test Suite (38 files, 958 assertions)
```bash
node test/run_all_tests.mjs
```

### Run Individual Stage Tests
```bash
# Example: Stage 1 (UET), Stage 4 (Scene Graph), Stage 36 (Autonomous OS)
node test/test_stage1_uet.mjs
node test/test_stage4_scene_graph.mjs
node test/test_stage36_os.mjs
```

### Build & Preview Production Bundle
```bash
npm run build
npm run preview
```

---

## 3. Project Directory Map & Subsystem Architecture

```text
ProViz/
├── index.html                   # Public landing page (/) — hero, features, roles, FAQ, footer
├── app/index.html               # The IDE (/app/) — header, five studios + Team, boot gate
├── privacy/index.html           # Privacy Policy (/privacy/)
├── terms/index.html             # Terms of Service (/terms/)
├── partials/                    # Shared HTML injected at build time via <!--@name--> (vite.config.js)
├── style.css                    # Velvet design tokens, primitives and all app styles
├── site.css                     # Public-site styles (landing, legal, auth dialog) on top of style.css
├── main.js                      # IDE entrypoint & UI/3D orchestrator (role-aware navigation)
├── brain.md                     # Comprehensive 36-stage engineering roadmap & deep architecture
├── package.json                 # Dependencies (Three.js, GSAP, CodeMirror, Pyodide, Vite)
├── test/
│   ├── run_all_tests.mjs        # Master test runner
│   └── test_stage1_uet.mjs ... test_stage36_os.mjs  # 36 complete test suites
└── src/
    ├── engine/                  # Execution engine & trace transformation
    │   ├── PythonExecutor.js    # In-browser Pyodide runtime & trace extractor
    │   └── TraceTransformer.js  # Raw trace -> Universal Execution Trace (UET)
    ├── trace/                   # UET event types, execution requests, step records
    ├── runtime/                 # Memory models, call-stack frames, heap representation
    ├── scene/                   # 3D Scene graph, spatial nodes, camera managers
    ├── visualizers/             # Specialized 3D visualizers (Variables, Arrays, CallStack)
    ├── debugger/                # Time-travel debugger, breakpoints, step controls
    ├── inspection/              # Deep object inspection, pointer/reference topology
    ├── animation/               # GSAP interpolation, keyframing, smooth state diffs
    ├── layout/                  # 3D force-directed, grid, and memory stack layouts
    ├── PlaybackEngine.js        # Timeline scrubber, speed multiplier, pause/resume
    ├── ExplanationEngine.js     # Natural-language execution narratives
    ├── dataflow/                # Def-use chains, live variable analysis, taint tracking
    ├── analysis/                # Static/dynamic control flow graphs (CFG), complexity
    ├── typeflow/                # Runtime type inference & contracts
    ├── verification/            # Invariant validation, precondition/postcondition checks
    ├── symbolic/                # Symbolic state tracking, path constraint collector
    ├── testing/                 # Automated test case generation, fuzzing
    ├── concolic/                # Combined concrete + symbolic path exploration
    ├── repair/                  # Automated patch generation & semantic synthesis
    ├── mutation/                # Mutation score calculation & fault injection
    ├── regression/              # Regression test selection & test suite reduction
    ├── specification/           # Formal temporal & behavioural specification checks
    ├── exploration/             # State-space exploration & boundary search
    ├── probabilistic/           # Probabilistic execution modeling & flakiness analysis
    ├── planning/                # Multi-step verification plan generation
    ├── orchestration/           # Parallel verification pipelines & async job scheduling
    ├── federation/              # Multi-node/distributed worker verification network
    ├── knowledge/               # Bug pattern graph & semantic verification memory
    ├── semantic/                # Cross-module semantic dependency tracking
    ├── evolution/               # Codebase lineage & structural drift detection
    ├── security/                # Vulnerability audit, sanitizer validation, policy checks
    ├── performance/             # Algorithmic time/space complexity & hot-spot profiling
    ├── concurrency/             # Race condition, deadlock & thread interleaving detection
    ├── continuous/              # Continuous daemon loop & self-healing verification
    ├── auth/                    # roles.js (pure role/capability model) + session.js (Firebase/guest/preview)
    ├── site/                    # site.js — public-page behaviour (theme, session-aware CTAs, sign-in dialog)
    ├── project/                 # Multi-file project workspace & dependency graph
    └── os/                      # Stage 36: Autonomous Verification OS & L0-L5 policy controller
```

---

## 3a. Pages, Sign-in & Roles

* **Routes:** `/` landing → `/app/` IDE → `/privacy/`, `/terms/`. Vite multi-page build (`build.rollupOptions.input`). Shared head, icon sprite, header/footers live in `partials/` and are expanded by the `proviz-html-partials` plugin — edit the partial, not every page.
* **Sign-in:** any Google account via Firebase Auth (`src/firebase.js`, lazily imported by `src/auth/session.js`), or "Try without signing in" (guest, Visualizer only). `/app/` with no session redirects to `/?from=app`, which opens the sign-in dialog.
* **Roles:** `guest < user (General access) < admin < superadmin` (admin + superadmin = Developer access), resolved by `resolveRole()` in `src/auth/roles.js` from `VITE_ADMIN_EMAILS` / `VITE_SUPERADMIN_EMAILS` (see `.env.example`) and Firebase custom claims (`{ role }`, `admin`, `superadmin` — may raise, never lower). Studios and actions are gated by `STUDIOS` / `CAPABILITIES`; mark DOM with `data-cap="governance.safemode"` (hidden) or add `data-cap-mode="disable"` (locked). This is UI gating only — real protection needs server rules.
* **Role is always visible:** the header user chip shows the role pill; the user menu explains what the role can do.
* **Dev-only role preview:** `/app/?preview=user|admin|superadmin|guest` (sticky per tab, `?preview=off` to clear). Tree-shaken from production builds. Never read `import.meta.env` as a whole object — it inlines every `VITE_*` value into the bundle.

## 4. Design System & UI/UX Standards

To maintain and elevate ProViz into the **#1 visual programming IDE in the world**, all UI/UX additions and modifications must strictly follow these design standards:

### 🎨 Design System: "Velvet" (light + dark)
ProViz ships two hand-tuned themes that share one token vocabulary (defined at the top of `style.css`):
* **Velvet (light, default for light-OS users):** warm ivory paper (`--bg #F6F1EA`, cards `--surface #FFFCF8`), wine ink brand (`--brand #7A2E4A`), terracotta (`--accent #C2643C`) and antique gold (`--gold #B48646`).
* **Velvet Night (dark):** warm plum-black (`--bg #121014`, `--surface #19161B`), rose brand (`--brand #E08FAB`), amber accent (`#E3A77C`).
* **Semantic tokens:** `--success`, `--warning`, `--danger`, `--info` (each with a `-soft` tint). Data-type colours `--t-number`, `--t-str`, `--t-bool`, `--t-ref`, `--t-obj` are shared by the legend, inspector and 3D scene.
* **Theme switching:** `<html data-theme="light|dark">` is resolved pre-paint in `index.html` (saved choice → OS preference). `main.js#applyTheme` persists the choice and calls `SpatialWorld#setTheme`, whose `WORLD_THEMES` palettes mirror the CSS tokens.
* **No neon or glow:** depth comes from layered soft shadows (`--shadow-xs…lg`) and 1px borders, not coloured glows or gradients. No emoji in the UI; use the inline SVG icon sprite (`<svg class="i"><use href="#i-…"/></svg>`).

### 🔤 Typography & Hierarchy
* **UI & numerals:** `'Inter'` (cv11/ss01/ss03), 14px base, 550–620 weights for labels and titles.
* **Display headings:** `'Instrument Serif'` for page titles and editorial accents (italic `<em>` in brand colour). Never for numbers (its "1" reads as "l").
* **Code, values & addresses:** `'JetBrains Mono'`.

### 🕹️ 3D Viewport Interaction & Visualizer Polish
1. **Three.js Scene:** Must render with anti-aliasing enabled, device pixel ratio capped at 2, and smooth OrbitControls damping.
2. **Synchronized Layouts:** Variables and arrays appear as sleek 3D blocks/nodes on a spatial dark grid with glowing pedestals.
3. **Pointers & References:** Curved glowing Three.js Bezier curves connecting references to heap objects.
4. **GSAP Interpolation:** When the debugger steps forward or backward, 3D meshes smoothly lerp/morph to their new coordinates over 250–400ms rather than teleporting abruptly.

### 💻 CodeMirror 6 Editor Integration
1. **Active Step Line Highlight:** The current executing line is highlighted with a soft accent pulse and a 3px left bar (`cm-highlightLine`, `--exec-line-bg` / `--exec-bar`).
2. **Breakpoints:** Clickable gutter with red breakpoint dots.
3. **Syntax colours** come from `velvetHighlight` in `main.js`, which resolves `--syn-*` CSS tokens so both themes recolour the editor instantly.
4. **Execution Badges:** Inline variable value hints showing live variable states directly at the end of code lines during stepping.

### ⌨️ Standard Keyboard Shortcuts
* `F5`: Run Code / Start Debugging
* `F10` / `ArrowRight`: Step Over (Next Step)
* `F11` / `ArrowDown`: Step Into
* `Shift + F11` / `ArrowUp`: Step Out
* `ArrowLeft`: Step Backward (Time Travel)
* `Space`: Play / Pause Auto-step
* `Ctrl/Cmd + K`: Command Palette / Switch Studio Tab

---

## 5. Engineering Principles & Code Quality Rules

When Claude Code edits or extends the codebase:

1. **Maintain Pure ESM & No Broken Imports:** Ensure all imports use exact relative file paths with `.js` or `.mjs` extensions.
2. **Preserve 100% Test Pass Rate:** Always verify after changes by running `node test/run_all_tests.mjs`. All 36 test stages (935+ assertions) must pass cleanly.
3. **Zero Leaks in WebGL Context:** Dispose geometries, materials, and textures when re-initializing scenes or running new code traces to prevent memory bloat.
4. **Defensive Pyodide Handling:** Handle Pyodide initialization asynchronously with clear UI loading indicators and graceful recovery if execution times out.
5. **Responsive Resizing:** Any change affecting pane sizes must trigger `camera.aspect` updates and `renderer.setSize(w, h)` to prevent aspect distortion.
6. **No Ad-Hoc Styling:** Use the design tokens from `style.css` rather than hardcoded colours, and verify every UI change in **both** themes.

---

## 6. Priority Enhancements & Elevation Checklist

For Claude Code tasks aimed at making ProViz the undisputed best visual IDE:

- [x] **Unified Multi-Pane Splitter:** Implement smooth drag-to-resize splitters between CodeMirror editor, 3D Canvas, and OS Telemetry panels.
- [x] **Interactive 3D Node Raycasting:** Hovering or clicking a 3D variable cube highlights the corresponding variable in the editor, call-stack panel, and object inspector.
- [x] **Time-Travel Visual Scrubber:** Enhance the playback progress bar with mini tick marks indicating loops, function calls, and exception points.
- [ ] **Live AST / CFG Minimap:** Floating mini-overlay displaying the real-time Control Flow Graph branch transitions as execution unfolds.
- [ ] **Multi-Tab Studio Polish:** Ensure instant switching between Autonomous OS View, 3D Visualizer View, Gate Matrix Studio, and Continuous Loop Dashboard with zero state loss.
- [x] **Landing, Sign-in & Role-based Studios:** Public landing + legal pages, Google sign-in / guest mode, General access (guest, user) vs Developer access (admin, super admin) views with a Team & roles page.
- [x] **Responsive Pass:** Verified at 1920 / 1440 / 1280 / 1024 / 820 / 768 / 390 in both themes; IDE stacks (editor → transport → 3D → inspector) below 900px, header gains a second nav row below 720px.
- [x] **Error Boundary & Pyodide Crash Shield:** Render visually stunning diagnostic cards when Python code throws syntax/runtime errors, pin-pointing the exact line and stack trace.
