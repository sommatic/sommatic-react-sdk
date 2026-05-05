# Command Center — Architecture

> EN · also available in [architecture.es.md](architecture.es.md)

## What the Command Center is

A deterministic + inference-assisted operations surface inside `@sommatic/react-sdk`. It takes a natural-language user prompt, classifies it into a structured plan composed of registered actions, and executes them step-by-step against a registry of published Surfaces and Targets. It is the realization in code of the manifesto's principle that **"Sommatic does not 'converse' to exist. Sommatic interprets, decides and operates."**

Two modes coexist:
- **Explicit execution** — the user (or a feature) emits a command directly. No inference required.
- **Inference-assisted routing** — the user types a prompt; an LLM classifies it into a plan. The system MUST remain operable in explicit-execution mode without inference.

## High-level dataflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Host webapp                                                            │
│                                                                         │
│  <CommandCenterProvider>                                                │
│    ├── registry      ← Surfaces, Targets, ContextSources, Receipts      │
│    ├── executeIntent ← entry point from chat UI                         │
│    │                                                                    │
│    │   useCommandCenterAgent.classifyIntent                             │
│    │     ├── builds envelope { user_prompt, tool_definitions, client }  │
│    │     ├── executionService.executeStream  (SSE)                      │
│    │     │   ├── onChunk → thought streaming                            │
│    │     │   └── onDone  → { execution_plan, thought, output }          │
│    │     └── (fallback) executionService.execute                        │
│    │                                                                    │
│    │   useCommandCenterAgent.executePlan                                │
│    │     ├── for each step: cmdDef.action(args, registry)               │
│    │     ├── delays after open_surface (700ms) and set_fields (350ms)   │
│    │     └── pushes results + receipts                                  │
│    │                                                                    │
│    └── debug logs, receipt stack (last 100), undo                       │
│                                                                         │
│  <CommandCenterSidebar>  ← right-side panel, chat UI                    │
│  <CommandCenterTrigger>  ← button / hotkey to toggle                    │
│  <AppEmbedCard> / <AppEscalatedCard>  ← embedded App Engine apps        │
└─────────────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  bsh.sommatic.backend.svc                                               │
│                                                                         │
│  POST /command-center/classify                                          │
│    ├── MessagingCommandCenterRequestPayloadModel                        │
│    └── MessagingCommandCenterResponsePayloadModel                       │
│        → { execution_plan, thought, output }                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Provider — `CommandCenterProvider`

Source: `src/features/command-center/context/CommandCenter.context.jsx` (~883 lines).

Exposes via `useCommandCenterContext()`:

| Slot | Purpose |
|---|---|
| `registry` | Single object passed into every action. Holds `resolveTarget`, `resolveTargetFuzzy`, `getTargets`, `getSurfaces`, `getSurface`, `pushReceipt`, `taskService`, `currentUser`, etc. |
| `allCommands` | Concatenation of `getReadCommands(deps)` + `getExecCommands(deps)`. |
| `registerContextSource(source)` | Add a context source (called by `useSommaticContextSource`). |
| `registerSurface(surface)` | Add/update a surface (called by `useSommaticSurface`). |
| `executeIntent(userQuery, opts)` | Top-level entry for the chat UI: runs `classifyIntent` then `executePlan`, surfaces progress and final state. |
| `providers` | List of available LLM providers (selected by the chat UI). |
| `debugLogs` | Router decisions and execution log entries. |
| `receipts` | Stack of last ~100 results, indexed by receipt ID for undo. |

The Provider is a **single-instance component**. Mount it once near the top of the host webapp's tree, below `AuthProvider` and above the layout that contains `<CommandCenterSidebar>`.

## Registry semantics

### Surfaces

A Surface is a published UI region (panel, form, grid, modal). It has an `id`, a `type`, an optional `description`, optional `targets`, and optional surface-level `handlers` (e.g. `submit`, `cancel`, `setFields`).

The registry stores surfaces in a `Map<id, Surface>`. Lookups: `getSurface(id)`, `getSurfaces()`.

### Targets

A Target is an act-able control inside a Surface (input, link, button, row). It has an `id`, `type`, `label`, optional `aliases`, optional `methods` array, and `handlers` map.

Targets are scoped under their Surface. Resolution by `surface_id::target_id`:
- **Exact** — direct lookup.
- **Fuzzy** — alias / label / id substring + token overlap + trigram Dice.
- **Semantic bridge** — cross-language pairs (e.g. `nombre`↔`name`, `tipo`↔`type`).

See [target-resolution.en.md](target-resolution.en.md) for the full algorithm.

### Context sources

A context source publishes a snapshot the LLM can consult. Stored in a `Map<id, ContextSource>` with cached snapshot (default TTL 30s). Convention: every page should publish at least one source named `page-context` so the read actions that fall back to "the first registered source" still work.

### Receipts and undo

Every successful exec action SHOULD call `registry.pushReceipt({ command_id, args, reversible, result })`. The stack keeps the last 100 entries. `command_center.exec.undo` accepts a `receipt_id` and reverses if the receipt was marked `reversible: true`.

## Pipeline: prompt → plan → results

### 1. Build the envelope

`useCommandCenterAgent.classifyIntent` constructs:

```javascript
{
  type: 'command-center.request',
  organization_id,
  context: { session_id: conversationId, client: clientContext },
  payload: {
    user_prompt,
    llm_provider_id,
    conversation_id,
    tool_definitions: availableCommands.map(({ id, label, description, app, schema, skills }) => ({...})),
    attachments: [],
  },
}
```

`clientContext` is the host's snapshot — surfaces, targets, context sources, navigation catalogs (`available_apps`, `available_pages`). The LLM uses it both to decide which command to call and to fill arguments (slugs, paths, target refs).

### 2. Send via SSE if available

If `executionService.executeStream` is a function, the agent uses it with callbacks:
- `onOpen()` — stream opened, signal "thinking" UI.
- `onChunk(chunk)` — incremental thought text; `chunk.text` appended to a buffer.
- `onDone(payload)` — final inner result; resolved as `{ success: true, result: payload }`.
- `onError(err)` — abort and surface error.

Otherwise, it falls back to `executionService.execute(envelope)` (single-shot POST).

### 3. Parse the response

The backend returns `{ execution_plan, thought, output }`. Three branches:

1. **`execution_plan` is a non-empty array** — proceed to `executePlan`.
2. **`execution_plan` is `[]` and `output.text` parses as JSON `{ plan, thought }`** — use the parsed plan.
3. **`execution_plan` is `[]` and `output.text` is plain text** — synthesize a single `{ command_id: 'reply', args: { text } }` step. The chat manager renders the text directly; **a second backend round-trip would re-enter a model whose history is poisoned by previous synthesis prompts and yield generic answers** (see comment in `useCommandCenterAgent.js`).

### 4. Execute step-by-step

`executePlan` iterates the plan:
- 300 ms pause before each step (lets prior UI commit).
- Looks up the command definition by `id`.
- If `step.command_id === 'reply'`, treats `args` as the rendered output and continues.
- Otherwise, calls `cmdDef.action(step.args)`.
- On success, pushes a result, calls `onProgress` (for live UI), and inserts a settle delay if the command was `*.open_surface` (700 ms) or `*.set_fields` (350 ms).
- On error, captures the error message; the chat surfaces it.

The final return is `{ results, finalPlan }`.

## Sidebar / Chat / Trigger

| Component | File | Purpose |
|---|---|---|
| `CommandCenterSidebar` | `src/components/command-center/CommandCenterSidebar.jsx` | Right-side panel container. Listens for DOM events (`sommatic:open-command-center`, `sommatic:command-center-opened`/`closed`) and toggles itself. |
| `CommandCenterChat` | `src/components/command-center/CommandCenterChat.jsx` | The chat UI inside the sidebar (header, close/new-chat buttons, message list, input). Uses `CognitiveEntryManagerComponent` from `@link-loom/react-sdk`. |
| `CommandCenterTrigger` | `src/components/command-center/CommandCenterTrigger.jsx` | Button to open/close the sidebar; emits `sommatic:open-command-center`. |
| `AppEmbedCard` / `AppEscalatedCard` | same folder | Render an App Engine app inside the chat (compact / escalated modes). |

## DOM event namespace

The Command Center coordinates with the host via `sommatic:*` CustomEvents:

| Event | Direction | Detail |
|---|---|---|
| `sommatic:open-command-center` | host/feature → Sidebar | `{ conversationId?, initialMessage?, appEmbed?, prefillEntry? }` |
| `sommatic:command-center-opened` | Sidebar → world | (broadcast) |
| `sommatic:command-center-closed` | Sidebar → world | (broadcast) |
| `sommatic:app:request-escalation` | App → host | `{ sessionId, targetMode }` |
| `sommatic:app:escalation-closed` | host → host | clean-up |
| `sommatic:app:request-de-escalation` | fullscreen → host | request close |
| `sommatic:app:fullscreen-route-change` | App → host | `{ pathname }` |
| `sommatic:app:output` | App → host | execution output |
| `sommatic:app:create-embed-from-escalation` | escalation → host | re-embed in sidebar |

Use only this namespace for cross-feature signaling. Do not introduce a global event bus or a Redux-like store.

## Two-mode invariant

The system MUST be operable without inference. Concretely:

- Every read/exec action has a deterministic schema and can be invoked directly by ID via `command_center.exec.command.invoke`.
- The chat UI exposes the slash labels (`/page-outline`, `/open-surface`, ...) so power users can bypass classification.
- Removing the LLM provider must not break feature operation — only the inference path.

## Recent additions

See [changelog-recent.en.md](changelog-recent.en.md). Highlights you should not miss:

- HITL tasks: `claim`, `complete`, `comment`, `create`, `transition`.
- `openApp` natural-language resolution against `context.client.navigation.available_apps`.
- `navigate` natural-language resolution against `context.client.navigation.available_pages`.
- SSE streaming via `executeStream`.

## Cross-references

- [provider-integration.en.md](provider-integration.en.md) — wiring a host webapp.
- [sommatic-jsx-authoring.en.md](sommatic-jsx-authoring.en.md) — exposing pages.
- [agent-and-inference.en.md](agent-and-inference.en.md) — payload models, SSE protocol, debug logs.
- [target-resolution.en.md](target-resolution.en.md) — how targets are matched.
- Per-command reference: `src/features/command-center/docs/commands/`.
