# Command Center — Arquitectura

> ES · también disponible en [architecture.en.md](architecture.en.md)

## Qué es el Command Center

Una superficie de operaciones determinística + asistida por inferencia, dentro de `@sommatic/react-sdk`. Toma un prompt en lenguaje natural, lo clasifica en un plan estructurado de acciones registradas y las ejecuta paso a paso contra un registry de Surfaces y Targets publicados. Es la materialización en código del principio del manifiesto: **"Sommatic no 'conversa' para existir. Sommatic interpreta, decide y opera."**

Coexisten dos modos:
- **Ejecución explícita** — el usuario (o una feature) emite un comando directo. No requiere inferencia.
- **Routing asistido por inferencia** — el usuario escribe; un LLM clasifica en un plan. El sistema DEBE seguir siendo operable sin inferencia.

## Flujo a alto nivel

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Webapp host                                                            │
│                                                                         │
│  <CommandCenterProvider>                                                │
│    ├── registry      ← Surfaces, Targets, ContextSources, Receipts      │
│    ├── executeIntent ← entry point desde la UI del chat                 │
│    │                                                                    │
│    │   useCommandCenterAgent.classifyIntent                             │
│    │     ├── arma el envelope { user_prompt, tool_definitions, client } │
│    │     ├── executionService.executeStream  (SSE)                      │
│    │     │   ├── onChunk → streaming del thought                        │
│    │     │   └── onDone  → { execution_plan, thought, output }          │
│    │     └── (fallback) executionService.execute                        │
│    │                                                                    │
│    │   useCommandCenterAgent.executePlan                                │
│    │     ├── por cada paso: cmdDef.action(args, registry)               │
│    │     ├── delays tras open_surface (700ms) y set_fields (350ms)      │
│    │     └── empuja resultados + receipts                               │
│    │                                                                    │
│    └── debug logs, stack de receipts (últimos 100), undo                │
│                                                                         │
│  <CommandCenterSidebar>  ← panel derecho con la UI del chat             │
│  <CommandCenterTrigger>  ← botón / hotkey para abrir/cerrar             │
│  <AppEmbedCard> / <AppEscalatedCard>  ← apps del App Engine embebidas   │
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

Fuente: `src/features/command-center/context/CommandCenter.context.jsx` (~883 líneas).

Expone vía `useCommandCenterContext()`:

| Slot | Propósito |
|---|---|
| `registry` | Único objeto que se pasa a cada acción. Contiene `resolveTarget`, `resolveTargetFuzzy`, `getTargets`, `getSurfaces`, `getSurface`, `pushReceipt`, `taskService`, `currentUser`, etc. |
| `allCommands` | Concatenación de `getReadCommands(deps)` + `getExecCommands(deps)`. |
| `registerContextSource(source)` | Añade una fuente de contexto (lo llama `useSommaticContextSource`). |
| `registerSurface(surface)` | Añade/actualiza una surface (lo llama `useSommaticSurface`). |
| `executeIntent(userQuery, opts)` | Entry point del chat: corre `classifyIntent` y luego `executePlan`, expone progreso y estado final. |
| `providers` | LLM providers disponibles (los selecciona la UI del chat). |
| `debugLogs` | Decisiones del router y entradas de log de ejecución. |
| `receipts` | Stack de los últimos ~100 resultados, indexado por receipt ID para undo. |

El Provider es **single-instance**. Móntalo una sola vez cerca del top del árbol del webapp host, debajo de `AuthProvider` y arriba del layout que contiene `<CommandCenterSidebar>`.

## Semántica del registry

### Surfaces

Una Surface es una región publicada de UI (panel, form, grid, modal). Tiene `id`, `type`, `description` opcional, `targets` opcionales y `handlers` opcionales a nivel de surface (p.ej. `submit`, `cancel`, `setFields`).

El registry guarda surfaces en un `Map<id, Surface>`. Búsquedas: `getSurface(id)`, `getSurfaces()`.

### Targets

Un Target es un control accionable dentro de una Surface (input, link, button, row). Tiene `id`, `type`, `label`, `aliases` opcionales, `methods` opcionales y mapa de `handlers`.

Los targets viven bajo su surface. Resolución por `surface_id::target_id`:
- **Exacto** — lookup directo.
- **Fuzzy** — alias / substring de label / id + token overlap + Dice de trigramas.
- **Puente semántico** — pares cross-language (p.ej. `nombre`↔`name`, `tipo`↔`type`).

Ver [target-resolution.es.md](target-resolution.es.md) para el algoritmo completo.

### Fuentes de contexto

Una fuente de contexto publica un snapshot que el LLM puede consultar. Se guarda en `Map<id, ContextSource>` con snapshot cacheado (TTL por defecto 30s). Convención: cada página debería publicar al menos una fuente llamada `page-context` para que las acciones read que hacen fallback a "la primera fuente registrada" funcionen.

### Receipts y undo

Toda exec exitosa DEBERÍA llamar `registry.pushReceipt({ command_id, args, reversible, result })`. El stack guarda los últimos 100. `command_center.exec.undo` acepta un `receipt_id` y revierte si el receipt fue marcado `reversible: true`.

## Pipeline: prompt → plan → resultados

### 1. Construir envelope

`useCommandCenterAgent.classifyIntent` construye:

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

`clientContext` es el snapshot del host — surfaces, targets, fuentes de contexto, catálogos de navegación (`available_apps`, `available_pages`). El LLM lo usa tanto para decidir el comando como para llenar argumentos (slugs, paths, refs de target).

### 2. Enviar por SSE si está disponible

Si `executionService.executeStream` es función, el agente lo usa con callbacks:
- `onOpen()` — stream abierto, señal "pensando".
- `onChunk(chunk)` — texto incremental del thought; `chunk.text` se concatena.
- `onDone(payload)` — resultado interno final; se resuelve como `{ success: true, result: payload }`.
- `onError(err)` — aborta y propaga el error.

Si no, hace fallback a `executionService.execute(envelope)` (POST single-shot).

### 3. Parsear la respuesta

El backend devuelve `{ execution_plan, thought, output }`. Tres ramas:

1. **`execution_plan` array no vacío** — al `executePlan`.
2. **`execution_plan` `[]` y `output.text` parsea como JSON `{ plan, thought }`** — usar el plan parseado.
3. **`execution_plan` `[]` y `output.text` es texto plano** — sintetizar un único paso `{ command_id: 'reply', args: { text } }`. El manager del chat pinta el texto directo; **un segundo round-trip al backend re-entraría a un modelo cuya historia ya está envenenada por prompts previos de síntesis y daría respuestas genéricas** (ver comentario en `useCommandCenterAgent.js`).

### 4. Ejecutar paso a paso

`executePlan` itera el plan:
- 300 ms de pausa antes de cada paso (deja que la UI previa commitee).
- Busca la definición del comando por `id`.
- Si `step.command_id === 'reply'`, trata `args` como el output renderizado y sigue.
- Si no, llama `cmdDef.action(step.args)`.
- En éxito, empuja un resultado, llama `onProgress` (para UI live) e inserta delay de settle si el comando fue `*.open_surface` (700 ms) o `*.set_fields` (350 ms).
- En error, captura el mensaje; el chat lo expone.

Devolución final: `{ results, finalPlan }`.

## Sidebar / Chat / Trigger

| Componente | Archivo | Propósito |
|---|---|---|
| `CommandCenterSidebar` | `src/components/command-center/CommandCenterSidebar.jsx` | Contenedor del panel derecho. Escucha eventos DOM (`sommatic:open-command-center`, `sommatic:command-center-opened/closed`) y se abre/cierra. |
| `CommandCenterChat` | `src/components/command-center/CommandCenterChat.jsx` | UI del chat (header, botones close/new-chat, lista de mensajes, input). Usa `CognitiveEntryManagerComponent` de `@link-loom/react-sdk`. |
| `CommandCenterTrigger` | `src/components/command-center/CommandCenterTrigger.jsx` | Botón para abrir/cerrar el sidebar; emite `sommatic:open-command-center`. |
| `AppEmbedCard` / `AppEscalatedCard` | misma carpeta | Renderizan una app del App Engine dentro del chat (modos compact / escalated). |

## Namespace de eventos DOM

El Command Center coordina con el host vía CustomEvents `sommatic:*`:

| Evento | Dirección | Detail |
|---|---|---|
| `sommatic:open-command-center` | host/feature → Sidebar | `{ conversationId?, initialMessage?, appEmbed?, prefillEntry? }` |
| `sommatic:command-center-opened` | Sidebar → mundo | (broadcast) |
| `sommatic:command-center-closed` | Sidebar → mundo | (broadcast) |
| `sommatic:app:request-escalation` | App → host | `{ sessionId, targetMode }` |
| `sommatic:app:escalation-closed` | host → host | limpieza |
| `sommatic:app:request-de-escalation` | fullscreen → host | pedido de cierre |
| `sommatic:app:fullscreen-route-change` | App → host | `{ pathname }` |
| `sommatic:app:output` | App → host | output de ejecución |
| `sommatic:app:create-embed-from-escalation` | escalación → host | re-embed en sidebar |

Usar solo este namespace para señales cross-feature. No introducir un event bus global ni un store tipo Redux.

## Invariante de doble modo

El sistema DEBE poder operarse sin inferencia. En concreto:

- Cada acción read/exec tiene un schema determinístico y se puede invocar directo por ID vía `command_center.exec.command.invoke`.
- La UI del chat expone los slash labels (`/page-outline`, `/open-surface`, ...) para que un power user evada la clasificación.
- Quitar el LLM provider no debe romper la operación de las features — solo el camino de inferencia.

## Adiciones recientes

Ver [changelog-recent.es.md](changelog-recent.es.md). Imprescindibles:

- HITL tasks: `claim`, `complete`, `comment`, `create`, `transition`.
- Resolución NL de `openApp` contra `context.client.navigation.available_apps`.
- Resolución NL de `navigate` contra `context.client.navigation.available_pages`.
- Streaming SSE vía `executeStream`.

## Referencias cruzadas

- [provider-integration.es.md](provider-integration.es.md) — cableo en un webapp host.
- [sommatic-jsx-authoring.es.md](sommatic-jsx-authoring.es.md) — exposición de páginas.
- [agent-and-inference.es.md](agent-and-inference.es.md) — modelos de payload, protocolo SSE, debug logs.
- [target-resolution.es.md](target-resolution.es.md) — cómo se resuelven los targets.
- Referencia por comando: `src/features/command-center/docs/commands/`.
