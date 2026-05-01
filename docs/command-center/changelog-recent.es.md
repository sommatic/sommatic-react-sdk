# Cambios Recientes

> ES · también disponible en [changelog-recent.en.md](changelog-recent.en.md)

Cambios itemizados que la documentación debe reflejar. Si te estás poniendo al día con el Command Center, lee esto primero.

## HITL Tasks — ciclo de vida completo en comandos

El Command Center expone el ciclo de vida completo de tasks HITL como acciones de primera clase:

| Comando | Slash | Propósito |
|---|---|---|
| `command_center.read.tasks.inbox` | `/tasks-inbox` | Lista tasks HITL asignadas al usuario actual. Filtro `status` opcional. |
| `command_center.read.tasks.detail` | `/task-detail` | Una task con su schema de inputs requeridos (para que el LLM sepa qué llenar). |
| `command_center.exec.tasks.claim` | `/claim-task` | Toma ownership de una task pendiente. |
| `command_center.exec.tasks.complete` | `/complete-task` | Envía outputs validados y cierra la task. |
| `command_center.exec.tasks.comment` | `/comment-task` | Apendea un comentario. |
| `command_center.exec.tasks.create` | `/create-task` | Crea una task HITL nueva (title, type, priority, required_output, opcional assignee/sla/payload). |
| `command_center.exec.tasks.transition` | `/task-transition` | Aplica una transición de ciclo: `assign`, `claim`, `start`, `complete`, `reject`, `invalidate`, `expire`. |

Estos se conectan a `WorkManagementTaskService` en `bsh.sommatic.backend.svc`. Las tasks no son notificaciones — son gates contractuales dentro del runtime de workflow.

**Docs por comando:** ver `src/features/command-center/docs/commands/{read,exec}/` para cada acción de tasks.

## `openApp` — resolución por lenguaje natural

`command_center.exec.app.open` (`/open-app`) resuelve semánticamente el fraseo del usuario contra `context.client.navigation.available_apps`. Cada entrada disponible tiene:

```javascript
{ slug, name, description, tags, default_route }
```

Al LLM se le instruye (en la propia descripción de la acción):

1. Matchear semánticamente la intención del usuario (cualquier idioma, fraseo o ortografía).
2. Emitir el `slug` matcheado como `app_slug`.
3. Si la entrada matcheada tiene `default_route`, usarlo como `route_path` salvo que el usuario pida otra explícitamente.
4. Como fallback de último recurso, emitir `app_name` (nombre legible) y el runtime lo resuelve del catálogo.

Descripción completa de la acción (verbatim de `definitions.js`):

> "Open a Sommatic App in the Command Center. Semantically match the user's intent (any language, any phrasing or spelling) against `context.client.navigation.available_apps` — each entry has `slug`, `name`, `description`, `tags`, and `default_route`. Emit the matched `slug` as `app_slug`. If the matched entry has a `default_route`, use it as `route_path` unless the user explicitly asks for another route. As a last-resort fallback you may also pass `app_name` (the human-readable name) and the runtime will resolve it from the catalog."

Por eso el Provider necesita un prop `appCatalog` — el catálogo es lo que popula `available_apps`.

## `navigate` — resolución por lenguaje natural

`command_center.exec.navigate` (`/navigate`) hace lo mismo para rutas. Matchea contra `context.client.navigation.available_pages`, donde cada entrada tiene:

```javascript
{ path, description }
```

El LLM elige el path de la página que mejor matchea y lo emite tal cual como `route`. Requiere `pageCatalog` en el Provider.

## Streaming SSE vía `executeStream`

`useCommandCenterAgent` ahora prefiere SSE cuando el execution service expone `executeStream`. Callbacks:

- `onOpen()` — stream abierto.
- `onChunk({ text })` — chunk incremental del thought.
- `onDone(payload)` — inner result final (nota: el payload ES el inner result, NO el envoltorio `{ success, result }` — el hook lo normaliza).
- `onError(err)` — aborta.

Hace fallback a `execute(envelope)` single-shot si `executeStream` no es función. Los backends sin SSE siguen funcionando sin cambios de código.

## Síntesis de respuesta plana

Cuando el modelo no devuelve plan y solo `output.text` plano, el agente **sintetiza** un único paso:

```javascript
[{ command_id: 'reply', args: { text: outputText.trim() } }]
```

El manager del chat pinta el texto directo. **NO re-promptea.** Re-promptear aquí re-entraría a un modelo cuya historia está envenenada por prompts de síntesis previos y daría respuestas genéricas (ver comentario inline en `useCommandCenterAgent.js`).

Se marca con `synthesized_from_plain_text: true` en el router log para que las herramientas de debug distingan planes sintéticos de los reales.

## Mejoras a `getCurrentScope` y `getPageOutline`

Ambas hacen fallback a la primera InsightSource registrada si `page-context` no está publicada. Las descripciones ahora incluyen hints multilingües:

- `/get-current-scope` — *"Use this whenever the user asks 'where am I?', 'what page is this?', 'dime el nombre de la página', 'qué página es esta', or similar."*
- `/page-outline` — *"Use when the user asks 'what can I do here?', 'qué puedo hacer aquí', 'qué hay en esta página'."*

Si tu página expone `page-context` correctamente, siempre funcionan. Si no, hacen fallback graceful — pero el patrón recomendado es publicar siempre `page-context`.

## Heurísticas de target resolution

El resolver fuzzy puntúa por capas:

| Capa | Score |
|---|---|
| Alias exacto | 0.9 |
| Substring de label/id | 0.75–0.85 |
| Token overlap (filtrado de stopwords) | 0.5–0.8 |
| Dice de trigramas | ~0.78 |
| Puente semántico (cross-language) | 0.65–0.75 |

Los aliases son por lejos la palanca más fuerte. Ver [target-resolution.es.md](target-resolution.es.md) para guía de tuneo.

## Catálogos del Provider

El Provider ahora espera dos catálogos como props:

- `appCatalog: Array<{ slug, name, description, tags, default_route }>` — alimenta resolución NL de `openApp`.
- `pageCatalog: Array<{ path, description }>` — alimenta resolución NL de `navigate`.

Ambos deben estar presentes y al día; si no, el LLM no puede emitir slugs/paths válidos. Actualízalos cuando agregues una nueva app o ruta.

## Notas de migración

Si venías usando el SDK antes de estos cambios:

- **Callers de `openApp`** — quita la lógica casera de matching de slug en tus features. El backend resuelve vía el catálogo ahora.
- **UIs de tasks** — si tienes botones custom para "claim/complete/comment", prefiere dispatchar el slash command vía `command_center.exec.command.invoke` para que todos los caminos pasen por la misma ejecución auditada.
- **UIs stream-aware** — cablea el callback `onThoughtChunk` a un buffer de typing para pintar thought incremental.
- **Routing** — registra un `pageCatalog` si quieres que `/navigate` funcione por lenguaje natural.

## Referencias cruzadas

- [architecture.es.md](architecture.es.md) — pipeline completo.
- [agent-and-inference.es.md](agent-and-inference.es.md) — payload, SSE, debug logs.
- [provider-integration.es.md](provider-integration.es.md) — props y catálogos del Provider.
- Referencia por comando: `src/features/command-center/docs/commands/`.
