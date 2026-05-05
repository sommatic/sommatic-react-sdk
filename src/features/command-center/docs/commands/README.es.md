# Command Center — Referencia por Comando

> ES · también disponible en [README.en.md](README.en.md)

Esta carpeta contiene un markdown por cada acción del Command Center. Cada doc cubre propósito, cuándo usarla, argumentos, return value, casos de error, referencia de implementación y la definición del comando.

Para arquitectura, integración del provider, autoría de `*.sommatic.jsx`, target resolution y flujo de inferencia, ver [docs/command-center/](../../../../../docs/command-center/).

## Convención

- Un `.md` por acción, con nombre derivado de los últimos segmentos del command ID.
- Los docs existentes están en inglés. Los nuevos pueden añadir un sibling en español (`<name>.es.md`); de aquí en adelante, preferir parejas bilingües.
- Cada doc debe reflejar el schema real en `definitions.js`. Si el schema cambia, actualizar el doc en el mismo commit.

## Read actions (18) — `commands/read/`

| Command ID | Slash | Doc |
|---|---|---|
| `command_center.read.scope.get` | `/get-current-scope` | [read.scope.get.md](read/read.scope.get.md) |
| `command_center.read.insights.list` | `/list-insights` | [read.insights.list.md](read/read.insights.list.md) |
| `command_center.read.insights.describe` | `/describe-insight` | [read.insights.describe.md](read/read.insights.describe.md) |
| `command_center.read.insights.snapshot` | `/snapshot-insight` | [read.insights.snapshot.md](read/read.insights.snapshot.md) |
| `command_center.read.context.pack` | `/context-pack` | [read.context.pack.md](read/read.context.pack.md) |
| `command_center.read.page.outline` | `/page-outline` | [read.page.outline.md](read/read.page.outline.md) |
| `command_center.read.selection.get` | `/get-selection` | [read.selection.get.md](read/read.selection.get.md) |
| `command_center.read.focus.get` | `/get-focus` | [read.focus.get.md](read/read.focus.get.md) |
| `command_center.read.ui.surfaces.list` | `/list-surfaces` | [read.ui.surfaces.list.md](read/read.ui.surfaces.list.md) |
| `command_center.read.ui.targets.list` | `/list-targets` | [read.ui.targets.list.md](read/read.ui.targets.list.md) |
| `command_center.observe.ui` | `/observe-ui` | [observe.ui.md](read/observe.ui.md) |
| `command_center.extract.from_insight` | `/extract-from-insight` | [extract.from_insight.md](read/extract.from_insight.md) |
| `command_center.extract.from_targets` | `/extract-from-targets` | [extract.from_targets.md](read/extract.from_targets.md) |
| `command_center.read.debug.router_log` | `/debug-router-log` | [read.debug.router_log.md](read/read.debug.router_log.md) |
| `command_center.read.debug.execution_log` | `/debug-exec-log` | [read.debug.execution_log.md](read/read.debug.execution_log.md) |
| `command_center.read.tasks.inbox` | `/tasks-inbox` | [read.tasks.inbox.md](read/read.tasks.inbox.md) |
| `command_center.read.tasks.detail` | `/task-detail` | [read.tasks.detail.md](read/read.tasks.detail.md) |
| `command_center.read.capabilities` | `/capabilities` | [read.capabilities.md](read/read.capabilities.md) |

## Exec actions (18) — `commands/exec/`

| Command ID | Slash | Doc |
|---|---|---|
| `command_center.exec.ui.act` | `/act-ui` | [exec.ui.act.md](exec/exec.ui.act.md) |
| `command_center.exec.ui.act_batch` | `/act-batch-ui` | [exec.ui.act_batch.md](exec/exec.ui.act_batch.md) |
| `command_center.exec.ui.open_surface` | `/open-surface` | [exec.ui.open_surface.md](exec/exec.ui.open_surface.md) |
| `command_center.exec.ui.close_surface` | `/close-surface` | [exec.ui.close_surface.md](exec/exec.ui.close_surface.md) |
| `command_center.exec.ui.set_fields` | `/set-fields` | [exec.ui.set_fields.md](exec/exec.ui.set_fields.md) |
| `command_center.exec.ui.submit_form` | `/submit-form` | [exec.ui.submit_form.md](exec/exec.ui.submit_form.md) |
| `command_center.exec.ui.apply_filter` | `/apply-filter` | [exec.ui.apply_filter.md](exec/exec.ui.apply_filter.md) |
| `command_center.exec.ui.select_rows` | `/select-rows` | [exec.ui.select_rows.md](exec/exec.ui.select_rows.md) |
| `command_center.exec.command.invoke` | `/invoke-command` | [exec.command.invoke.md](exec/exec.command.invoke.md) |
| `command_center.exec.app.open` | `/open-app` | [exec.app.open.md](exec/exec.app.open.md) |
| `command_center.exec.navigate` | `/navigate` | [exec.navigate.md](exec/exec.navigate.md) |
| `command_center.exec.clipboard.copy` | `/copy` | [exec.clipboard.copy.md](exec/exec.clipboard.copy.md) |
| `command_center.exec.tasks.claim` | `/claim-task` | [exec.tasks.claim.md](exec/exec.tasks.claim.md) |
| `command_center.exec.tasks.complete` | `/complete-task` | [exec.tasks.complete.md](exec/exec.tasks.complete.md) |
| `command_center.exec.tasks.comment` | `/comment-task` | [exec.tasks.comment.md](exec/exec.tasks.comment.md) |
| `command_center.exec.tasks.create` | `/create-task` | [exec.tasks.create.md](exec/exec.tasks.create.md) |
| `command_center.exec.tasks.transition` | `/task-transition` | (Pendiente) |
| `command_center.exec.undo` | `/undo` | [exec.undo.md](exec/exec.undo.md) |

## Verificación del inventario

Para confirmar que cada acción tiene su doc:

```bash
ls src/features/command-center/commands/{read,exec}/*.action.js   # 36 archivos
ls src/features/command-center/docs/commands/{read,exec}/*.md     # debería ser 36 docs (excluyendo READMEs)
```

Cualquier discrepancia es un gap de documentación. Tras cubrir `exec.tasks.create.md`, el único gap restante es `exec.tasks.transition` (la acción `taskTransition.action.js` aún no tiene per-command doc — listada como TBD arriba).

## Ver también

- [Arquitectura](../../../../../docs/command-center/architecture.es.md)
- [Integración del provider](../../../../../docs/command-center/provider-integration.es.md)
- [Autoría `*.sommatic.jsx`](../../../../../docs/command-center/sommatic-jsx-authoring.es.md)
- [Target resolution](../../../../../docs/command-center/target-resolution.es.md)
- [Agente e inferencia](../../../../../docs/command-center/agent-and-inference.es.md)
- [Cambios recientes](../../../../../docs/command-center/changelog-recent.es.md)
