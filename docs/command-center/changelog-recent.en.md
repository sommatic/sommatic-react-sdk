# Recent Changes

> EN · also available in [changelog-recent.es.md](changelog-recent.es.md)

Itemized changes the documentation must reflect. If you are catching up on the Command Center, read this first.

## HITL Tasks — full lifecycle commands

The Command Center exposes the full HITL task lifecycle as first-class actions:

| Command | Slash | Purpose |
|---|---|---|
| `command_center.read.tasks.inbox` | `/tasks-inbox` | List HITL tasks assigned to the current user. Optional `status` filter. |
| `command_center.read.tasks.detail` | `/task-detail` | One task with required-input schema (so the LLM knows what to fill). |
| `command_center.exec.tasks.claim` | `/claim-task` | Take ownership of a pending task. |
| `command_center.exec.tasks.complete` | `/complete-task` | Submit validated outputs and close the task. |
| `command_center.exec.tasks.comment` | `/comment-task` | Append a comment. |
| `command_center.exec.tasks.create` | `/create-task` | Create a brand new HITL task (title, type, priority, required_output, optional assignee/sla/payload). |
| `command_center.exec.tasks.transition` | `/task-transition` | Apply a lifecycle transition: `assign`, `claim`, `start`, `complete`, `reject`, `invalidate`, `expire`. |

These tie to `WorkManagementTaskService` on `bsh.sommatic.backend.svc`. Tasks are not notifications — they are contractual gates inside workflow runtime.

**Per-command docs:** look under `src/features/command-center/docs/commands/{read,exec}/` for each task action.

## `openApp` — natural-language resolution

`command_center.exec.app.open` (`/open-app`) resolves the user's phrasing semantically against `context.client.navigation.available_apps`. Each available app entry has:

```javascript
{ slug, name, description, tags, default_route }
```

The LLM is instructed (in the action description itself) to:

1. Match the user's intent semantically (any language, any phrasing or spelling).
2. Emit the matched `slug` as `app_slug`.
3. If the matched entry has `default_route`, use it as `route_path` unless the user explicitly asked for another route.
4. As a last-resort fallback, emit `app_name` (the human-readable name) and the runtime resolves it from the catalog.

The full action description (verbatim from `definitions.js`):

> "Open a Sommatic App in the Command Center. Semantically match the user's intent (any language, any phrasing or spelling) against `context.client.navigation.available_apps` — each entry has `slug`, `name`, `description`, `tags`, and `default_route`. Emit the matched `slug` as `app_slug`. If the matched entry has a `default_route`, use it as `route_path` unless the user explicitly asks for another route. As a last-resort fallback you may also pass `app_name` (the human-readable name) and the runtime will resolve it from the catalog."

This is why the Provider needs an `appCatalog` prop — the catalog is what populates `available_apps`.

## `navigate` — natural-language resolution

`command_center.exec.navigate` (`/navigate`) does the same trick for routes. It matches against `context.client.navigation.available_pages`, where each entry has:

```javascript
{ path, description }
```

The LLM picks the path of the best matching page and emits it exactly as `route`. Requires `pageCatalog` on the Provider.

## SSE streaming via `executeStream`

`useCommandCenterAgent` now prefers SSE when the execution service exposes `executeStream`. Callbacks:

- `onOpen()` — stream opened.
- `onChunk({ text })` — incremental thought chunk.
- `onDone(payload)` — final inner result (note: the payload is the inner result, NOT the `{ success, result }` wrapper — the hook normalizes it).
- `onError(err)` — abort.

Falls back to single-shot `execute(envelope)` if `executeStream` is not a function. Backends without SSE keep working without code changes.

## Plain-text reply synthesis

When the model returns no plan and just plain `output.text`, the agent **synthesizes** a single step:

```javascript
[{ command_id: 'reply', args: { text: outputText.trim() } }]
```

The chat manager renders the text directly. **It does NOT re-prompt.** Re-prompting at this point would re-enter a model whose history has been poisoned by prior synthesis prompts and produce generic answers (see the inline comment in `useCommandCenterAgent.js`).

This is flagged with `synthesized_from_plain_text: true` in the router log so debug tools can distinguish synthetic plans from real ones.

## `getCurrentScope` and `getPageOutline` improvements

Both fall back to the first registered InsightSource if `page-context` is not published. The action descriptions now include multilingual hints:

- `/get-current-scope` — *"Use this whenever the user asks 'where am I?', 'what page is this?', 'dime el nombre de la página', 'qué página es esta', or similar."*
- `/page-outline` — *"Use when the user asks 'what can I do here?', 'qué puedo hacer aquí', 'qué hay en esta página'."*

If your page exposes `page-context` correctly, these always work. If your page does not, they fall back gracefully — but the recommended pattern is to always publish `page-context`.

## Target resolution heuristics

The fuzzy resolver scores layers:

| Layer | Score |
|---|---|
| Alias exact | 0.9 |
| Label/id substring | 0.75–0.85 |
| Token overlap (stop-word filtered) | 0.5–0.8 |
| Trigram Dice | ~0.78 |
| Semantic bridge (cross-language) | 0.65–0.75 |

Aliases are by far the strongest lever. See [target-resolution.en.md](target-resolution.en.md) for tuning advice.

## Provider catalogs

The Provider now expects two catalogs as props:

- `appCatalog: Array<{ slug, name, description, tags, default_route }>` — feeds `openApp` NL resolution.
- `pageCatalog: Array<{ path, description }>` — feeds `navigate` NL resolution.

Both must be present and current; otherwise the LLM can't emit valid slugs/paths. Update them whenever you add a new app or route.

## Migration notes

If you were previously using the SDK before these changes:

- **`openApp` callers** — drop any hand-rolled slug-matching logic in your features. The backend resolves via the catalog now.
- **Task UIs** — if you have custom buttons for "claim/complete/comment", prefer dispatching the slash command via `command_center.exec.command.invoke` so all paths go through the same audited execution.
- **Stream-aware UIs** — wire the `onThoughtChunk` callback to a typing-buffer to render incremental thought.
- **Routing** — register a `pageCatalog` if you want `/navigate` to work via natural language.

## Cross-references

- [architecture.en.md](architecture.en.md) — full pipeline.
- [agent-and-inference.en.md](agent-and-inference.en.md) — payload, SSE, debug logs.
- [provider-integration.en.md](provider-integration.en.md) — Provider props and catalogs.
- Per-command reference: `src/features/command-center/docs/commands/`.
