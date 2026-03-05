# `command_center.exec.ui.act`

**Label:** `/act`  
**Category:** Exec  
**File:** `commands/exec/actUi.action.js`

---

## Purpose

Triggers a single action on a registered UI target — the most granular UI interaction command. It resolves a target reference and calls one of its registered handler methods.

---

## When to Use

- When the LLM needs to click a button, fill an input, or trigger any specific target handler.
- For single, precise interactions (vs `exec.ui.act_batch` for multiple steps).
- After discovering available targets via `observe.ui` or `read.ui.targets.list`.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `target_ref` | `string` | Yes | Target reference in format `{surface_id}::{target_id}`. |
| `method` | `string` | Yes | Handler method to call (e.g., `click`, `fill`, `getValue`, `select`). |
| `arguments` | `any[]` | No | Arguments to pass to the handler method. |

---

## Return Value

```js
{
  ok: true,
  title: "Executed [click] on [create-project-form::submit-btn]",
  result: { /* whatever the handler returned */ },
  receipt_id: "rcpt_1772075473717_abc123"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_TARGET_REF", message: "target_ref is required" } }
{ ok: false, error: { code: "MISSING_METHOD", message: "method is required" } }
{ ok: false, error: { code: "TARGET_NOT_FOUND", message: "Target [xyz::btn] not found" } }
{ ok: false, error: { code: "METHOD_NOT_FOUND", message: "Method [click] not supported on target [xyz::btn]" } }
{ ok: false, error: { code: "ACTION_FAILED", message: "Handler threw: ..." } }
```

---

## Implementation

```js
// commands/exec/actUi.action.js
export const action = async (args, registry) => {
  const { target_ref, method, arguments: methodArgs } = args || {};

  if (!target_ref) return { ok: false, error: { code: 'MISSING_TARGET_REF', message: 'target_ref is required' } };
  if (!method) return { ok: false, error: { code: 'MISSING_METHOD', message: 'method is required' } };

  const resolved = registry?.resolveTarget?.(target_ref);
  if (!resolved) return { ok: false, error: { code: 'TARGET_NOT_FOUND', message: `Target [${target_ref}] not found` } };

  const handler = resolved.target.handlers?.[method];
  if (!handler) return { ok: false, error: { code: 'METHOD_NOT_FOUND', message: `Method [${method}] not supported` } };

  let result;
  try {
    result = await handler(...(methodArgs || []));
  } catch (err) {
    return { ok: false, error: { code: 'ACTION_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.act',
    args,
    reversible: false,
    result,
  });

  return { ok: true, title: `Executed [${method}] on [${target_ref}]`, result, receipt_id: receipt?.id };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.ui.act',
  label: '/act',
  description: 'Trigger a single UI action on a registered target',
  schema: {
    type: 'object',
    properties: {
      target_ref: {
        type: 'string',
        description: "Target reference: 'surface_id::target_id' (e.g. 'create-project-form::submit-btn')"
      },
      method: {
        type: 'string',
        description: "Handler method to call (e.g. 'click', 'fill', 'select')"
      },
      arguments: {
        type: 'array',
        description: "Optional arguments to pass to the handler"
      }
    },
    required: ['target_ref', 'method']
  },
  action: (args) => Exec.actUi(args, registry),
}
```

---

## Example Usages

```js
// Click a button
{ target_ref: "create-project-form::submit-btn", method: "click" }

// Fill an input
{ target_ref: "create-project-form::name-input", method: "fill", arguments: ["My New Project"] }

// Select an option
{ target_ref: "create-project-form::status-dropdown", method: "select", arguments: ["active"] }
```

---

## Notes

- `resolveTarget(targetRef)` parses the `::` separator to find the surface and target.
- The `receipt` is always `reversible: false` because individual UI actions generally can't be trivially undone.
- For sequential multi-step UI interactions, prefer `exec.ui.act_batch`.
