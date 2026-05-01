# Agente e Inferencia

> ES · también disponible en [agent-and-inference.en.md](agent-and-inference.en.md)

La capa de inferencia del Command Center: `useCommandCenterAgent`, el payload request/response, el protocolo SSE y las superficies de debug.

## Firma del hook

```javascript
const { classifyIntent, executePlan, isThinking, error } = useCommandCenterAgent({
  availableCommands,        // Array<CommandDef>
  executionService,         // { execute, executeStream? }
  onRouterDecision,         // (entry) => void — apendea al router log
  onExecutionComplete,      // (entry) => void — apendea al execution log
});
```

`isThinking` está en `true` mientras el LLM clasifica (útil para el typing indicator del chat). `error` lleva el último mensaje de error de clasificación.

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

### Shape del envelope (construido dentro del hook)

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

`clientContext` lo provee la UI del chat / el Provider. Contenido típico:

```javascript
{
  surfaces_by_id: { ... },
  targets_by_surface: { ... },
  sources: { ... },                     // snapshots empaquetados por /context-pack
  selection: { ... },
  focus: { ... },
  navigation: {
    available_apps: [{ slug, name, description, tags, default_route }],
    available_pages: [{ path, description }],
  },
}
```

### Transporte

El agente prefiere SSE si el execution service expone `executeStream`:

```javascript
executionService.executeStream(envelope, {
  onOpen:  () => { onStreamOpen?.(); },
  onChunk: (chunk) => { onThoughtChunk?.(chunk?.text || ''); },
  onDone:  (payload) => resolve(payload),       // payload ES el inner result
  onError: (err) => reject(new Error(err?.message || 'Streaming error')),
});
```

El evento `done` del streaming envía el inner result directamente (sin envoltorio `success: true`). El hook lo normaliza a `{ success: true, result: payload }` para que los callers vean una sola shape.

Si `executeStream` no es función, el agente llama `executionService.execute(envelope)` (POST single-shot que devuelve `{ success, result, message? }`).

### Manejo de respuesta

El `result` del backend es `{ execution_plan, thought, output }`. Tres ramas:

**1. Plan con pasos:**
```javascript
{ execution_plan: [
    { command_id: 'command_center.read.page.outline', args: { detail_level: 'high' } },
    { command_id: 'command_center.exec.ui.open_surface', args: { surface_id: 'organization-edit-form' } },
  ],
  thought: 'User wants to inspect the page and open the edit form.'
}
```
El hook devuelve `{ plan, thought }` y registra la decisión vía `onRouterDecision`.

**2. Plan vacío + JSON en `output.text`:**
El hook quita las cercas ```json, parsea, y devuelve `{ plan, thought }`. Marcado con `parsed_from_output: true` en el router log.

**3. Plan vacío + texto plano en `output.text`:**
El hook sintetiza un único paso:
```javascript
[{ command_id: 'reply', args: { text: outputText.trim() } }]
```
Y devuelve `{ plan: syntheticPlan, thought: '', isPlainTextReply: true }`.

> ¿Por qué sintetizar en lugar de re-promptear? Ver el comentario inline en `useCommandCenterAgent.js`:
> *"Re-streaming the raw user message would re-enter a model whose history is poisoned by previous synthesis prompts and yield generic answers."*

## `executePlan`

```javascript
executePlan(plan, onProgress);
```

`plan` es el array de `classifyIntent`. `onProgress(currentPlanState)` se llama en cada cambio de estado para que el chat pinte status live (`pending` → `running` → `success`/`error`).

### Ciclo de vida del paso

```
pending  →  running  →  success | error | missing_implementation
```

Por cada paso:
1. Marca `running`, llama `onProgress` con el plan actualizado.
2. Espera `STEP_START_DELAY_MS` (300 ms) para que el commit de UI del paso anterior settlée.
3. Caso especial `command_id === 'reply'` — registra los args como resultado, marca success.
4. Si no, busca `cmdDef = availableCommands.find(c => c.id === step.command_id)`.
5. Si encontrado, llama `cmdDef.action(step.args)`.
6. Empuja resultado a `results`, llama `onExecutionComplete({ command_id, args, status, result })`.
7. Inserta delay de settle si aplica:
   - `*.open_surface` → 700 ms
   - `*.set_fields` → 350 ms
8. En error lanzado, captura mensaje, marca `error`, llama `onExecutionComplete` con `status: 'error'`.
9. Si el comando no está en `availableCommands`, marca `missing_implementation` y warning.

### Shape de retorno

```javascript
{
  results: [{ command, status, result, error? }],
  finalPlan: [{ command_id, args, status, result, error? }],
}
```

## Debug logs

El Provider expone dos logs append-only (cap 100 cada uno):

| Log | Origen | Lectura vía |
|---|---|---|
| Router log | callback `onRouterDecision` | `command_center.read.debug.router_log` (`/debug-router-log`) |
| Execution log | callback `onExecutionComplete` | `command_center.read.debug.execution_log` (`/debug-exec-log`) |

Cada entrada incluye `user_prompt`, `plan` (o `command_id`/`args` por paso), `provider_id` (router log) o `status`/`result`/`error` (execution log), y un timestamp. Útil para postmortem y para lookups de `/undo`.

## Contrato del backend

Endpoint: `POST /command-center/classify` en `bsh.sommatic.backend.svc`.

| Modelo | Archivo |
|---|---|
| Request | `MessagingCommandCenterRequestPayloadModel` |
| Response | `MessagingCommandCenterResponsePayloadModel` |
| Notas de contrato | [src/features/command-center/docs/contracts/app-engine-communication.md](../../src/features/command-center/docs/contracts/app-engine-communication.md) |

El backend envuelve el call al LLM. Al LLM se le instruye a emitir un `execution_plan` array de `{ command_id, args }` o un plan JSON-stringificado en `output.text`. Texto plano se permite cuando el modelo decide responder conversacionalmente (el agente hace la síntesis).

## Errores

| Síntoma | Causa probable |
|---|---|
| `No LLM Provider ID provided for inference.` | La UI del chat no seleccionó provider. |
| `No Execution Service provided to Agent.` | Provider no configurado con `executionService`. |
| `Streaming error` | Falla del transporte SSE; revisar red y logs del backend. |
| `Command implementation not found for ID: <id>` | El backend devolvió un `command_id` que no está en `availableCommands` — desfase de versión SDK/backend. |
| Plan ejecuta pero la UI no muestra nada | Falta cablear el callback `onProgress` en la UI del chat. |

## Referencias cruzadas

- [architecture.es.md](architecture.es.md) — pipeline completo.
- [provider-integration.es.md](provider-integration.es.md) — cómo se construye `executionService`.
- `src/features/command-center/docs/contracts/app-engine-communication.md` — shape request/response en el cable.
