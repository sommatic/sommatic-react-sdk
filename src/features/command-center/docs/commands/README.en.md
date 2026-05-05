# Command Center — Per-Command Reference

> EN · also available in [README.es.md](README.es.md)

This folder contains one markdown file per Command Center action. Each doc covers purpose, when to use it, arguments, return value, error cases, implementation reference, and the command definition.

For architecture, provider integration, `*.sommatic.jsx` authoring, target resolution and the inference flow, see [docs/command-center/](../../../../../docs/command-center/).

## Convention

- One `.md` per action, named after the command ID's last segments.
- Existing docs are in English. New docs may add a Spanish sibling (`<name>.es.md`); going forward, prefer bilingual pairs.
- Each doc must mirror the action's actual `definitions.js` schema. If the schema changes, update the doc in the same commit.

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
| `command_center.exec.tasks.transition` | `/task-transition` | (TBD) |
| `command_center.exec.undo` | `/undo` | [exec.undo.md](exec/exec.undo.md) |

## Verifying the inventory

To confirm every action has a doc:

```bash
ls src/features/command-center/commands/{read,exec}/*.action.js   # 36 files
ls src/features/command-center/docs/commands/{read,exec}/*.md     # should be 36 docs (excluding READMEs)
```

Any mismatch is a documentation gap. After filling `exec.tasks.create.md`, the only remaining gap is `exec.tasks.transition` (action `taskTransition.action.js` has no per-command doc yet — it's listed as TBD above).

## See Also

- [Architecture](../../../../../docs/command-center/architecture.en.md)
- [Provider integration](../../../../../docs/command-center/provider-integration.en.md)
- [`*.sommatic.jsx` authoring](../../../../../docs/command-center/sommatic-jsx-authoring.en.md)
- [Target resolution](../../../../../docs/command-center/target-resolution.en.md)
- [Agent and inference](../../../../../docs/command-center/agent-and-inference.en.md)
- [Recent changes](../../../../../docs/command-center/changelog-recent.en.md)
