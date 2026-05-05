# Agent and Inference

> EN · also available in [agent-and-inference.es.md](agent-and-inference.es.md)

The Command Center's inference layer: `useCommandCenterAgent`, the request/response payload, the SSE protocol, and the debug surfaces.

## Hook signature

```javascript
const { classifyIntent, executePlan, isThinking, error } = useCommandCenterAgent({
  availableCommands,        // Array<CommandDef>
  executionService,         // { execute, executeStream? }
  onRouterDecision,         // (entry) => void — appends to debug router log
  onExecutionComplete,      // (entry) => void — appends to debug execution log
});
```

`isThinking` flips on while the LLM is mid-classification (useful for the chat UI's typing indicator). `error` carries the last classification error message.

## `classifyIntent`

```javascript
classifyIntent(
  userQuery,
  llmProviderId,
  conversationId = null,
  organizationId = null,
  clientContext = {},
  callbacks = {},               // { onThoughtChunk, onStreamOpen }
);
```

### Envelope shape (built inside the hook)

```javascript
{
  type: 'command-center.request',
  organization_id: organizationId,
  context: {
    session_id: conversationId,
    client: clientContext,
  },
  payload: {
    user_prompt: userQuery,
    llm_provider_id: llmProviderId,
    conversation_id: conversationId,
    tool_definitions: availableCommands.map((cmd) => ({
      id: String(cmd.id),
      label: String(cmd.label),
      description: String(cmd.description),
      app: cmd.app ? String(cmd.app) : undefined,
      schema: cmd.schema ? JSON.parse(JSON.stringify(cmd.schema)) : undefined,
      skills: cmd.skills ? JSON.parse(JSON.stringify(cmd.skills)) : {},
    })),
    attachments: [],
  },
}
```

`clientContext` is provided by the chat UI / Provider. Typical content:

```javascript
{
  surfaces_by_id: { ... },
  targets_by_surface: { ... },
  sources: { ... },                     // snapshots packed by /context-pack
  selection: { ... },
  focus: { ... },
  navigation: {
    available_apps: [{ slug, name, description, tags, default_route }],
    available_pages: [{ path, description }],
  },
}
```

### Transport

The agent prefers SSE if the execution service exposes `executeStream`:

```javascript
executionService.executeStream(envelope, {
  onOpen:  () => { onStreamOpen?.(); },
  onChunk: (chunk) => { onThoughtChunk?.(chunk?.text || ''); },
  onDone:  (payload) => resolve(payload),       // payload IS the inner result
  onError: (err) => reject(new Error(err?.message || 'Streaming error')),
});
```

The streaming `done` event sends the inner result object directly (without the `success: true` envelope). The hook normalizes it to `{ success: true, result: payload }` so callers see one shape.

If `executeStream` is not a function, the agent calls `executionService.execute(envelope)` (single-shot POST that returns `{ success, result, message? }`).

### Response handling

The backend's `result` is `{ execution_plan, thought, output }`. Three branches:

**1. Plan with steps:**
```javascript
{ execution_plan: [
    { command_id: 'command_center.read.page.outline', args: { detail_level: 'high' } },
    { command_id: 'command_center.exec.ui.open_surface', args: { surface_id: 'organization-edit-form' } },
  ],
  thought: 'User wants to inspect the page and open the edit form.'
}
```
The hook returns `{ plan, thought }` and logs the decision via `onRouterDecision`.

**2. Empty plan + JSON in `output.text`:**
The hook strips ```json fences, parses, and returns `{ plan, thought }`. Flagged with `parsed_from_output: true` in the router log.

**3. Empty plan + plain text in `output.text`:**
The hook synthesizes a single step:
```javascript
[{ command_id: 'reply', args: { text: outputText.trim() } }]
```
And returns `{ plan: syntheticPlan, thought: '', isPlainTextReply: true }`.

> Why synthesize a step instead of re-prompting? See the inline comment in `useCommandCenterAgent.js`:
> *"Re-streaming the raw user message would re-enter a model whose history is poisoned by previous synthesis prompts and yield generic answers."*

## `executePlan`

```javascript
executePlan(plan, onProgress);
```

`plan` is the array from `classifyIntent`. `onProgress(currentPlanState)` is called at every state change so the chat can render live status (`pending` → `running` → `success`/`error`).

### Step lifecycle

```
pending  →  running  →  success | error | missing_implementation
```

For each step:
1. Mark `running`, call `onProgress` with the updated plan.
2. Wait `STEP_START_DELAY_MS` (300 ms) so the prior step's UI commit settles.
3. Special-case `command_id === 'reply'` — record the args as result, mark success.
4. Otherwise, find `cmdDef = availableCommands.find(c => c.id === step.command_id)`.
5. If found, call `cmdDef.action(step.args)`.
6. Push result into `results`, call `onExecutionComplete({ command_id, args, status, result })`.
7. Insert UI-settle delay if applicable:
   - `*.open_surface` → 700 ms
   - `*.set_fields` → 350 ms
8. On thrown error, capture message, mark `error`, call `onExecutionComplete` with `status: 'error'`.
9. If command not found in `availableCommands`, mark `missing_implementation`, log warning.

### Returned shape

```javascript
{
  results: [{ command, status, result, error? }],
  finalPlan: [{ command_id, args, status, result, error? }],
}
```

## Debug logs

The Provider exposes two append-only logs (capped at 100 each):

| Log | Source | Read via |
|---|---|---|
| Router log | `onRouterDecision` callback | `command_center.read.debug.router_log` (`/debug-router-log`) |
| Execution log | `onExecutionComplete` callback | `command_center.read.debug.execution_log` (`/debug-exec-log`) |

Each entry includes `user_prompt`, `plan` (or `command_id`/`args` per step), `provider_id` (router log) or `status`/`result`/`error` (execution log), and a timestamp. Useful for postmortem and for `/undo` lookups.

## Backend contract

Endpoint: `POST /command-center/classify` on `bsh.sommatic.backend.svc`.

| Model | File |
|---|---|
| Request | `MessagingCommandCenterRequestPayloadModel` |
| Response | `MessagingCommandCenterResponsePayloadModel` |
| Contract notes | [src/features/command-center/docs/contracts/app-engine-communication.md](../../src/features/command-center/docs/contracts/app-engine-communication.md) |

The backend wraps the LLM call. The LLM is instructed to emit either an `execution_plan` array of `{ command_id, args }` or a JSON-stringified plan in `output.text`. Plain text is allowed when the model decides to answer conversationally (the agent handles the synthesis).

## Errors

| Symptom | Likely cause |
|---|---|
| `No LLM Provider ID provided for inference.` | Chat UI didn't select a provider. |
| `No Execution Service provided to Agent.` | Provider not configured with `executionService`. |
| `Streaming error` | SSE transport failure; check network and backend logs. |
| `Command implementation not found for ID: <id>` | Backend returned a `command_id` not in `availableCommands` — version mismatch between SDK and backend. |
| Plan executes but UI shows nothing | Missing `onProgress` callback wired into the chat UI. |

## Cross-references

- [architecture.en.md](architecture.en.md) — full pipeline.
- [provider-integration.en.md](provider-integration.en.md) — how `executionService` is constructed.
- `src/features/command-center/docs/contracts/app-engine-communication.md` — request/response shape on the wire.
