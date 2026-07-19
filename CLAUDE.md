# CLAUDE.md — `@sommatic/react-sdk`

> Repo map and base rules for any future Claude Code agent working in this repository.
> Bilingual: English first, Spanish below the divider.

---

## What this repo is

`@sommatic/react-sdk` is the shared React component library for the Sommatic platform. It is published to npm and consumed by both `bsh.sommatic.admin.webapp` and `bsh.sommatic.client.webapp`.

The headline feature owned here is the **Command Center**: a deterministic + inference‑assisted operations surface that classifies natural‑language intents into structured plans of read/exec actions and runs them against published Surfaces.

| Aspect | Value |
|---|---|
| Package name | `@sommatic/react-sdk` |
| Build | Rollup 4 (CJS + ESM dual output) — see `rollup.config.cjs` |
| Entry | `src/index.js` → `dist/react-sdk.cjs.js`, `dist/react-sdk.esm.js` |
| Storybook | v8.3.4 on port 6006 |
| Peer deps | React 17–19, react-dom, react-router-dom 5–7, `@mui/x-date-pickers` ^8, `luxon` ^3 |
| Lang | Pure JavaScript (`.js`, `.jsx`). No TypeScript. |

## Where things live

```
src/
├── components/
│   ├── chat/                 # ChatBubble, CognitiveEntry, SystemResponse, ThoughtProcess
│   ├── command-center/       # Sidebar, Chat, Trigger, AppEmbedCard, AppEscalatedCard
│   ├── flows/                # FlowsManager, FlowsToolbar, FlowsNodeConfigModal
│   └── shared/
├── features/
│   └── command-center/       # The Command Center subsystem
│       ├── context/          # CommandCenterProvider + useCommandCenterContext
│       ├── hooks/            # useCommandCenter, useCommandCenterAgent, useSommaticContextSource, useSommaticSurface, ...
│       ├── commands/
│       │   ├── definitions.js  # getReadCommands / getExecCommands factories
│       │   ├── read/           # 18 read-action implementations
│       │   └── exec/           # 18 exec-action implementations
│       └── docs/
│           ├── commands/{read,exec}/   # Per-command reference docs
│           └── contracts/              # Cross-system contracts (app-engine-communication.md)
├── hooks/
├── services/
├── constants/
└── styles/
```

## Top-level documentation

The architecture lives in **[docs/command-center/](docs/command-center/)**. Read order if you are new:

1. [architecture.en.md](docs/command-center/architecture.en.md) — Provider, registry, intent → plan pipeline
2. [provider-integration.en.md](docs/command-center/provider-integration.en.md) — How a host webapp wires the Provider
3. [sommatic-jsx-authoring.en.md](docs/command-center/sommatic-jsx-authoring.en.md) — Authoring `*.sommatic.jsx` files
4. [target-resolution.en.md](docs/command-center/target-resolution.en.md) — Exact / fuzzy / semantic-bridge resolution
5. [agent-and-inference.en.md](docs/command-center/agent-and-inference.en.md) — `classifyIntent`, `executePlan`, SSE
6. [changelog-recent.en.md](docs/command-center/changelog-recent.en.md) — Recent additions you should not miss
7. [record-rendering.en.md](docs/command-center/record-rendering.en.md) — How conversation records render + reload (ExecutionPlan, app cards, live app embeds); read before adding a new in-conversation control

Per‑command reference: [src/features/command-center/docs/commands/](src/features/command-center/docs/commands/) (one `.md` per action, indexed by [README.en.md](src/features/command-center/docs/commands/README.en.md)).

## Skills

Skills live under [`.claude/skills/`](.claude/skills/) inside this repo (NOT in the parent `sommatic-ai/` workspace). Three are defined:

| Skill | Triggers on |
|---|---|
| `sommatic-command-center` | Provider setup, hooks, intent classification, `/command-center/classify` endpoint |
| `sommatic-jsx-authoring` | `*.sommatic.jsx` co-located files, `useSommaticContextSource`, `useSommaticSurface` |
| `sommatic-command-reference` | Specific `read.*` / `exec.*` command questions, command IDs, recent additions (HITL tasks, openApp NL, navigate, SSE) |

## Base rules (also enforced by `sommatic-ai/.claude/rules/`)

- **Pure JavaScript only** — no TypeScript, no `tsconfig.json`.
- **Functional components only.** No classes.
- **Flat-style code.** Guard clauses first; happy path last; never nest more than one level.
- **Component file names use type suffixes** — `Foo.component.jsx`, `useFoo.hook.js`, `Foo.styles.js`. No bare `.jsx`.
- **Sommatic wrapper files are named `*.sommatic.jsx`**, return `null`, and use the `useSommatic*` hooks for registration only.
- **State management:** React Context API only — no Redux/Zustand/MobX.
- **No invention.** Do not add frameworks, abstractions, or dependencies that are not already in the stack unless the user asks.
- **Consistency > cleverness.** Match existing patterns exactly.
- **English in code, comments, and static text.** Operator‑facing user text follows the consuming webapp's locale convention.
- **Stable exports.** This is a published library; do not break public exports without coordination.

## Build / dev commands

```bash
npm run build           # Rollup CJS + ESM bundle to dist/
npm run storybook       # Storybook dev server on :6006
npm run version-patch   # bump patch version
npm run version-deploy  # npm publish
```

## Don't

- Don't add dependencies that overlap with the host webapp's runtime — the App Engine relies on `RUNTIME_EXTERNALS` resolution (see `bsh.linkloom.cloud.app-engine.svc/src/services/app/app-build/app-build.service.js`). Adding a new runtime-shared package requires coordinated changes.
- Don't introduce a global event bus. The Command Center uses DOM CustomEvents under the `sommatic:*` namespace.
- Don't refactor Command Center provider/hook signatures without updating `docs/command-center/architecture.en.md` and the corresponding skill.

---

## CLAUDE.md (Español)

### Qué es este repo

`@sommatic/react-sdk` es la librería compartida de componentes React de Sommatic. Se publica en npm y la consumen `bsh.sommatic.admin.webapp` y `bsh.sommatic.client.webapp`.

El subsistema clave que vive aquí es el **Command Center**: una superficie de operaciones determinística + asistida por inferencia que clasifica intenciones en lenguaje natural en planes estructurados de acciones read/exec y los ejecuta contra Surfaces publicadas.

### Dónde están las cosas

Mismo árbol descrito arriba en EN. La fuente de verdad son `src/features/command-center/` (subsistema) y `docs/command-center/` (arquitectura).

### Cómo navegar la documentación

Lee `docs/command-center/architecture.es.md` primero. Sigue con `provider-integration.es.md`, `sommatic-jsx-authoring.es.md`, `target-resolution.es.md`, `agent-and-inference.es.md` y `changelog-recent.es.md`.

La referencia por comando vive en `src/features/command-center/docs/commands/`.

### Reglas base

- Solo JavaScript puro, sin TypeScript.
- Solo componentes funcionales.
- Estilo plano (guard clauses primero, camino feliz al final, máximo un nivel de anidación).
- Sufijos de tipo en nombres de archivo: `Foo.component.jsx`, `useFoo.hook.js`, `Foo.styles.js`. Nunca `.jsx` pelado.
- Los archivos wrapper Sommatic se llaman `*.sommatic.jsx`, retornan `null` y solo registran via `useSommatic*` hooks.
- Estado: solo React Context API. Sin Redux/Zustand/MobX.
- No inventar. No introducir frameworks, abstracciones ni dependencias fuera del stack actual a menos que el usuario lo pida.
- Consistencia sobre creatividad. Replicar patrones existentes al pie de la letra.
- Inglés en código, comentarios y texto estático. El texto de operador sigue la convención del webapp consumidor.
- Mantener exports estables — esta librería es publicada; no romper exports públicos sin coordinación.

### No hacer

- No añadir dependencias que solapen con el runtime del host webapp — el App Engine resuelve por `RUNTIME_EXTERNALS`. Añadir un paquete compartido requiere cambios coordinados.
- No introducir un event bus global. El Command Center usa DOM CustomEvents bajo el namespace `sommatic:*`.
- No refactorizar firmas del provider/hooks del Command Center sin actualizar `docs/command-center/architecture.es.md` y el skill correspondiente.
