---
name: sommatic-command-center
description: Use when working with the Sommatic React SDK Command Center subsystem — provider setup, hook usage (useCommandCenter, useCommandCenterAgent), intent classification, executePlan/executeStream, debug logs, receipt stack/undo, sidebar/chat/trigger components, or wiring an app to consume the Command Center. Triggers on mentions of CommandCenterProvider, CommandCenterSidebar, CommandCenterChat, classifyIntent, executePlan, ConversationExecutionService, `/command-center/classify`, or the `sommatic:*` DOM event namespace.
---

# Sommatic Command Center

This skill loads when you are wiring, debugging or extending the Command Center subsystem in `@sommatic/react-sdk`.

## What it is

The Command Center turns a natural-language user prompt into a deterministic execution plan composed of registered **read** (observational) and **exec** (side-effecting) actions. It runs the plan step-by-step against a **registry** of published Surfaces and Targets, with an undo receipt stack and debug logs.

```
user prompt
   │
   ▼ useCommandCenterAgent.classifyIntent
   │   → builds envelope { user_prompt, tool_definitions, client context }
   │   → POST /command-center/classify (or executeStream SSE)
   ▼
{ execution_plan, thought }   ← LLM output
   │
   ▼ useCommandCenterAgent.executePlan
   │   → step.command_id resolved against availableCommands
   │   → action(step.args) invoked sequentially with UI-settle delays
   │   → progress streamed via onProgress callback
   ▼
{ results, finalPlan }   ← rendered in chat / surfaced as receipts
```

## Canonical files

- Provider: `src/features/command-center/context/CommandCenter.context.jsx` (`CommandCenterProvider`, `useCommandCenterContext`).
- Hooks: `src/features/command-center/hooks/{useCommandCenter, useCommandCenterAgent, useSommaticContextSource, useSommaticSurface, useSommaticSelection, useSommaticFocus}.{js,hook.js}`.
- Components: `src/components/command-center/{CommandCenterSidebar, CommandCenterChat, CommandCenterTrigger, AppEmbedCard, AppEscalatedCard}.jsx`.
- Command factories: `src/features/command-center/commands/definitions.js` — `getReadCommands({ getContext, icons, registry })`, `getExecCommands({ navigate, icons, registry })`.

## Shape of an execution envelope

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

The backend returns `{ execution_plan: [...], thought, output }`. If `execution_plan` is `[]` and `output.text` is plain text, the agent synthesizes a single `{ command_id: 'reply', args: { text } }` step so the chat renders the plain answer without a second backend round-trip.

## Step delays (do not remove)

After each successful step, `executePlan` waits to let React commit:
- `*.open_surface` → 700 ms
- `*.set_fields` → 350 ms
- Any step start → 300 ms

Removing these delays produces "target not found" errors on the next step because the surface DOM has not registered yet.

## Receipts and undo

Every successful exec action SHOULD push a receipt via `registry.pushReceipt({ command_id, args, reversible, result })`. `command_center.exec.undo` accepts a `receipt_id` and reverses if `reversible: true`. Receipt stack keeps last 100 entries.

## When to load this skill

Examples that should trigger it:
- "How do I mount the CommandCenterProvider in a new webapp?"
- "Why is `executeStream` falling back to `execute`?"
- "Add a new exec command that calls our archival service."

Examples that should NOT trigger it:
- "Style the chat bubble background." → That's `src/components/chat/`, not Command Center proper.
- "Set up a Storybook story." → That's tooling.

## See also

- [docs/command-center/architecture.en.md](../../../docs/command-center/architecture.en.md)
- [docs/command-center/provider-integration.en.md](../../../docs/command-center/provider-integration.en.md)
- [docs/command-center/agent-and-inference.en.md](../../../docs/command-center/agent-and-inference.en.md)
- [docs/command-center/changelog-recent.en.md](../../../docs/command-center/changelog-recent.en.md)

---

## Sommatic Command Center (Español)

Este skill se carga cuando estás cableando, depurando o extendiendo el subsistema Command Center en `@sommatic/react-sdk`.

### Qué es

Convierte un prompt en lenguaje natural en un plan de ejecución determinístico compuesto por acciones registradas **read** (observacionales) y **exec** (con efectos). Ejecuta el plan paso a paso contra un **registry** de Surfaces y Targets publicados, con stack de receipts para undo y logs de debug.

### Archivos canónicos

- Provider: `src/features/command-center/context/CommandCenter.context.jsx`.
- Hooks: `src/features/command-center/hooks/`.
- Componentes: `src/components/command-center/`.
- Factories de comandos: `src/features/command-center/commands/definitions.js`.

### Delays de paso

No eliminar:
- `*.open_surface` → 700 ms
- `*.set_fields` → 350 ms
- Inicio de cualquier paso → 300 ms

Sin estos delays, el siguiente paso falla con "target not found" porque el DOM de la surface aún no se registró.

### Receipts y undo

Cada exec exitosa debería empujar un receipt via `registry.pushReceipt({...})`. `command_center.exec.undo` acepta un `receipt_id` y revierte si `reversible: true`. El stack guarda 100 entradas.

### Ver también

- [docs/command-center/architecture.es.md](../../../docs/command-center/architecture.es.md)
- [docs/command-center/provider-integration.es.md](../../../docs/command-center/provider-integration.es.md)
- [docs/command-center/agent-and-inference.es.md](../../../docs/command-center/agent-and-inference.es.md)
- [docs/command-center/changelog-recent.es.md](../../../docs/command-center/changelog-recent.es.md)
