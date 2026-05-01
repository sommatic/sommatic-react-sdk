---
name: sommatic-command-reference
description: Use when invoking, debugging, or extending Sommatic Command Center read/exec actions — answers "what does command X do?", "which command should I emit for Y?", "where is the implementation of Z?". Triggers on action names like `command_center.read.*` / `command_center.exec.*`, slash labels (`/page-outline`, `/open-app`, `/set-fields`, `/create-task`, etc.), task HITL flow questions, openApp natural-language resolution, navigation, SSE streaming, or undo/receipt questions.
---

# Sommatic Command Reference

This skill loads when you need a definitive answer about a specific Command Center action — its ID, label, schema, when to emit it, and where its implementation/doc lives.

## Catalog at a glance

### Read actions (18) — `src/features/command-center/commands/read/`

| ID | Slash label | Purpose |
|---|---|---|
| `command_center.read.scope.get` | `/get-current-scope` | Where am I (route/module/focus) |
| `command_center.read.insights.list` | `/list-insights` | List published InsightSources |
| `command_center.read.insights.describe` | `/describe-insight` | Metadata + schema of one source |
| `command_center.read.insights.snapshot` | `/snapshot-insight` | Pull cached snapshot (TTL) |
| `command_center.read.context.pack` | `/context-pack` | Multi-source pack (top-N or by IDs) |
| `command_center.read.page.outline` | `/page-outline` | What's on the page (non-DOM) |
| `command_center.read.selection.get` | `/get-selection` | Opt-in user selection |
| `command_center.read.focus.get` | `/get-focus` | Active focus entity/panel |
| `command_center.read.ui.surfaces.list` | `/list-surfaces` | Published surfaces |
| `command_center.read.ui.targets.list` | `/list-targets` | Targets of one surface |
| `command_center.observe.ui` | `/observe-ui` | Discover candidates from instruction |
| `command_center.extract.from_insight` | `/extract-from-insight` | Pull structured fields from a source |
| `command_center.extract.from_targets` | `/extract-from-targets` | Pull values from target list |
| `command_center.read.debug.router_log` | `/debug-router-log` | Last N router decisions |
| `command_center.read.debug.execution_log` | `/debug-exec-log` | Last N executions + receipts |
| `command_center.read.tasks.inbox` | `/tasks-inbox` | HITL tasks assigned to user |
| `command_center.read.tasks.detail` | `/task-detail` | One task + required-input schema |
| `command_center.read.capabilities` | `/capabilities` | What's enabled on host |

### Exec actions (18) — `src/features/command-center/commands/exec/`

| ID | Slash label | Purpose |
|---|---|---|
| `command_center.exec.ui.act` | `/act-ui` | Single action on a target (click/fill/...) |
| `command_center.exec.ui.act_batch` | `/act-batch-ui` | Sequence of UI actions |
| `command_center.exec.ui.open_surface` | `/open-surface` | Open modal/drawer/panel |
| `command_center.exec.ui.close_surface` | `/close-surface` | Close surface |
| `command_center.exec.ui.set_fields` | `/set-fields` | Bulk-fill form fields |
| `command_center.exec.ui.submit_form` | `/submit-form` | Submit form |
| `command_center.exec.ui.apply_filter` | `/apply-filter` | Filter a grid/list |
| `command_center.exec.ui.select_rows` | `/select-rows` | Select rows by id or by `match_field` |
| `command_center.exec.command.invoke` | `/invoke-command` | Invoke a feature-published command |
| `command_center.exec.app.open` | `/open-app` | Open an App Engine app (NL-resolved) |
| `command_center.exec.navigate` | `/navigate` | Navigate to a route (NL-resolved) |
| `command_center.exec.clipboard.copy` | `/copy` | Copy text/JSON to clipboard |
| `command_center.exec.tasks.claim` | `/claim-task` | Take ownership of a HITL task |
| `command_center.exec.tasks.complete` | `/complete-task` | Complete with validated outputs |
| `command_center.exec.tasks.comment` | `/comment-task` | Add comment to task |
| `command_center.exec.tasks.create` | `/create-task` | Create a new HITL task |
| `command_center.exec.tasks.transition` | `/task-transition` | Apply lifecycle transition |
| `command_center.exec.undo` | `/undo` | Reverse a reversible receipt |

## Recent additions (read these first)

- **HITL tasks** — full set: `claim`, `complete`, `comment`, `create`, `transition`. Read inbox/detail via the corresponding `read.tasks.*` actions.
- **Natural-language `openApp`** — `command_center.exec.app.open` resolves the user's phrasing against `context.client.navigation.available_apps[].slug` and emits the matched `slug` as `app_slug`. If the matched entry has a `default_route`, use it as `route_path` unless the user asks otherwise. Fallback: pass `app_name` (human label).
- **NL `navigate`** — `command_center.exec.navigate` matches against `context.client.navigation.available_pages[].path` and emits the exact `path`.
- **SSE streaming** — `useCommandCenterAgent` calls `executionService.executeStream` when available, with `onOpen` / `onChunk` / `onDone` / `onError` callbacks. Falls back to `execute()` when not.
- **Plain-text reply path** — when the model returns no plan but plain `output.text`, the agent synthesizes `[{ command_id: 'reply', args: { text } }]` so the chat renders the answer without a second backend round-trip.

## Schema details — key actions

### `/open-app` (`command_center.exec.app.open`)
```json
{
  "app_slug": "from context.client.navigation.available_apps[].slug",
  "app_name": "optional human-readable fallback",
  "surface_id": "optional legacy HITL surface ID",
  "input_data": "object payload to prefill the app",
  "route_path": "internal route; defaults to default_route from the matched entry"
}
```

### `/navigate` (`command_center.exec.navigate`)
```json
{ "route": "absolute path from context.client.navigation.available_pages[].path" }
```

### `/select-rows` (`command_center.exec.ui.select_rows`)
```json
{
  "surface_id": "grid surface (e.g. project-list-grid)",
  "row_ids": ["explicit IDs"],
  "identifiers": ["values to match when IDs unknown"],
  "match_field": "field to match identifiers against (e.g. slug, name; default id)"
}
```
Requires the page-context snapshot to expose an `items` array when using `match_field`.

### `/create-task` (`command_center.exec.tasks.create`)
Required: `title`, `type` (object with id/name; one of approval, data_completion, review, resolution, delegation), `priority` (object with id/name; low/medium/high/critical), `required_output` (with schema and optional ui_hint).
Optional: `assignee` (with `assignee_type`: user|group), `sla` (with `due_at` Unix-ms string and `sla_ms`), `payload` (with summary, evidence[], linked_entities[]).

### `/undo` (`command_center.exec.undo`)
```json
{ "receipt_id": "from a previous exec result" }
```
Only reversible receipts succeed; non-reversible return `{ ok: false }`.

## Step delays inserted by `executePlan`

| After step matching | Delay | Why |
|---|---|---|
| `*.open_surface` | 700 ms | Wait for modal/form to mount |
| `*.set_fields` | 350 ms | Let React commit field values |
| (any step start) | 300 ms | Let prior step settle |

## Per-command reference docs

Each action has a markdown doc under `src/features/command-center/docs/commands/{read,exec}/` — open the matching file for examples and edge cases. Index: [README.en.md](../../../src/features/command-center/docs/commands/README.en.md).

## When to load this skill

Examples that should trigger it:
- "Which command should I use to fill multiple fields at once?" → `/set-fields`.
- "What's the difference between `/observe-ui` and `/list-targets`?"
- "Why does `/open-app` need `app_slug` and `route_path` separately?"

Examples that should NOT trigger it:
- "How do I expose my form to the Command Center?" → `sommatic-jsx-authoring`.
- "Where is the Provider mounted?" → `sommatic-command-center`.

## See also

- [docs/command-center/changelog-recent.en.md](../../../docs/command-center/changelog-recent.en.md)
- [docs/command-center/agent-and-inference.en.md](../../../docs/command-center/agent-and-inference.en.md)

---

## Referencia de comandos del Command Center (Español)

Este skill se carga cuando necesitas una respuesta definitiva sobre una acción específica — su ID, label, schema, cuándo emitirla y dónde vive su implementación/doc.

### Catálogo

(Mismo catálogo de IDs y labels listado arriba en EN.)

### Adiciones recientes — léelas primero

- **HITL tasks**: set completo `claim`, `complete`, `comment`, `create`, `transition`.
- **`openApp` por lenguaje natural**: matching semántico contra `context.client.navigation.available_apps[].slug`. Si la entrada matchea trae `default_route`, úsala como `route_path` salvo que el usuario pida otra. Fallback: `app_name`.
- **`navigate` por lenguaje natural**: matching contra `context.client.navigation.available_pages[].path`.
- **SSE streaming**: `useCommandCenterAgent` usa `executionService.executeStream` con callbacks `onOpen`/`onChunk`/`onDone`/`onError` y fallback a `execute()`.
- **Camino de respuesta plana**: si no hay plan pero hay `output.text`, el agente sintetiza `[{ command_id: 'reply', args: { text } }]`.

### Delays de paso en `executePlan`

| Paso | Delay |
|---|---|
| `*.open_surface` | 700 ms |
| `*.set_fields` | 350 ms |
| Inicio de cualquier paso | 300 ms |

### Referencia por comando

Cada acción tiene su `.md` bajo `src/features/command-center/docs/commands/{read,exec}/`.

### Ver también

- [docs/command-center/changelog-recent.es.md](../../../docs/command-center/changelog-recent.es.md)
- [docs/command-center/agent-and-inference.es.md](../../../docs/command-center/agent-and-inference.es.md)
