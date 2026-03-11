# `command_center.exec.ui.act_batch`

**Label:** `/act-batch`  
**Category:** Exec  
**File:** `commands/exec/actBatchUi.action.js`

---

## Purpose

Executes a sequence of UI actions on registered targets, one step at a time. Useful when the user wants to fill multiple form fields or interact with several targets in a single command.

All steps are attempted sequentially. If a step fails, execution continues for independent steps but the overall result will report `ok: false`.

---

## When to Use

- When a form requires multiple fields to be filled before submission.
- When the LLM generates a plan that involves clicking several targets.
- For batch automation: "Fill in name, status, and organization, then click submit."

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `steps` | `object[]` | Yes | Array of action steps. |
| `steps[].target_ref` | `string` | Yes | Target reference (`surface_id::target_id`). |
| `steps[].method` | `string` | Yes | Handler method to call. |
| `steps[].arguments` | `any[]` | No | Arguments for the method. |

---

## Return Value

```js
{
  ok: true,
  title: "Executed 3/3 steps",
  step_results: [
    { target_ref: "create-form::name-input", method: "fill", ok: true, result: undefined },
    { target_ref: "create-form::status-select", method: "fill", ok: true, result: undefined },
    { target_ref: "create-form::submit-btn", method: "click", ok: true, result: { submitted: true } }
  ],
  receipt_id: "rcpt_1772075473717_xyz"
}
```

With partial failure:

```js
{
  ok: false,
  title: "Executed 2/3 steps",
  step_results: [
    { target_ref: "form::name-input", method: "fill", ok: true, result: undefined },
    { target_ref: "form::unknown-btn", method: "click", ok: false, error: "Target [form::unknown-btn] not found" },
    { target_ref: "form::submit-btn", method: "click", ok: true, result: { submitted: true } }
  ],
  receipt_id: "..."
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_STEPS", message: "steps array is required and must not be empty" } }
```

---

## Implementation

```js
// commands/exec/actBatchUi.action.js
export const action = async (args, registry) => {
  const { steps } = args || {};

  if (!Array.isArray(steps) || steps.length === 0) {
    return { ok: false, error: { code: 'MISSING_STEPS', message: 'steps array is required and must not be empty' } };
  }

  const stepResults = [];
  let hasError = false;

  for (const step of steps) {
    const { target_ref, method, arguments: methodArgs } = step;

    if (!target_ref || !method) {
      stepResults.push({ target_ref, method, ok: false, error: 'Missing target_ref or method' });
      hasError = true;
      continue;
    }

    const resolved = registry?.resolveTarget?.(target_ref);
    if (!resolved) {
      stepResults.push({ target_ref, method, ok: false, error: `Target [${target_ref}] not found` });
      hasError = true;
      continue;
    }

    const handler = resolved.target.handlers?.[method];
    if (!handler) {
      stepResults.push({ target_ref, method, ok: false, error: `Method [${method}] not supported` });
      hasError = true;
      continue;
    }

    try {
      const result = await handler(...(methodArgs || []));
      stepResults.push({ target_ref, method, ok: true, result });
    } catch (err) {
      stepResults.push({ target_ref, method, ok: false, error: err.message });
      hasError = true;
    }
  }

  const receipt = registry?.pushReceipt?.({
    command_id: 'command_center.exec.ui.act_batch',
    args,
    reversible: false,
    step_count: steps.length,
    success_count: stepResults.filter((r) => r.ok).length,
  });

  return {
    ok: !hasError,
    title: `Executed ${stepResults.filter((r) => r.ok).length}/${steps.length} steps`,
    step_results: stepResults,
    receipt_id: receipt?.id,
  };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.ui.act_batch',
  label: '/act-batch',
  description: 'Execute multiple UI actions sequentially',
  schema: {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            target_ref: { type: 'string' },
            method: { type: 'string' },
            arguments: { type: 'array' }
          },
          required: ['target_ref', 'method']
        }
      }
    },
    required: ['steps']
  },
  action: (args) => Exec.actBatchUi(args, registry),
}
```

---

## Notes

- Execution does **not** halt on failure — all steps are attempted regardless of errors.
- The `ok` field in the top-level response is `false` if **any** step failed.
- For independent steps, errors in one step do not affect subsequent steps.
- Steps requiring data from a previous step's result are not supported (use multiple single `exec.ui.act` commands in a plan instead).
