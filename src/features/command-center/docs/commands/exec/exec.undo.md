# `command_center.exec.undo`

**Label:** `/undo`  
**Category:** Exec  
**File:** `commands/exec/undo.action.js`

---

## Purpose

Reverses the last reversible action in the receipt stack. Looks for the most recent receipt where `reversible: true` and calls its `undo` handler.

---

## When to Use

- When the user says "Undo that" or "Revert the last action."
- After accidentally applying a filter or selecting rows the user didn't intend.
- For quick rollback in automated flows.

---

## Arguments

None.

---

## Return Value

```js
{
  ok: true,
  title: "Undone: exec.ui.apply_filter",
  undone_receipt_id: "rcpt_1772075473717_abc",
  receipt_id: "rcpt_1772075480000_undo"
}
```

If no reversible action exists:

```js
{
  ok: false,
  error: { code: "NOTHING_TO_UNDO", message: "No reversible action found in receipt stack" }
}
```

If undo fails:

```js
{
  ok: false,
  error: { code: "UNDO_FAILED", message: "Undo handler threw: ..." }
}
```

---

## Implementation

```js
// commands/exec/undo.action.js
export const action = async (args, registry) => {
  const stack = registry?.getReceiptStack?.() || [];

  const reversibleReceipt = stack.find((receipt) => receipt.reversible && receipt.undo);

  if (!reversibleReceipt) {
    return { ok: false, error: { code: 'NOTHING_TO_UNDO', message: 'No reversible action found in receipt stack' } };
  }

  try {
    await reversibleReceipt.undo();
  } catch (err) {
    return { ok: false, error: { code: 'UNDO_FAILED', message: err.message } };
  }

  // Remove the undone receipt from the stack
  registry?.removeReceipt?.(reversibleReceipt.id);

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.undo',
    args: {},
    reversible: false,
    undone_command: reversibleReceipt.command_id,
  });

  return {
    ok: true,
    title: `Undone: ${reversibleReceipt.command_id}`,
    undone_receipt_id: reversibleReceipt.id,
    receipt_id: receipt?.id,
  };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.undo',
  label: '/undo',
  description: 'Undo the last reversible action',
  schema: {},
  action: () => Exec.undo(registry),
}
```

---

## Which Commands Are Reversible?

| Command | Reversible | Undo Action |
|---------|-----------|-------------|
| `exec.ui.apply_filter` | Yes | `applyFilter('')` (clear filter) |
| `exec.ui.select_rows` | Yes | `selectRows([])` (clear selection) |
| `exec.ui.act` | No | — |
| `exec.ui.act_batch` | No | — |
| `exec.ui.open_surface` | No | — |
| `exec.ui.close_surface` | No | — |
| `exec.ui.set_fields` | No | — |
| `exec.ui.submit_form` | No | — |
| `exec.navigate` | No | — |
| `exec.clipboard.copy` | No | — |
| `exec.app.open` | No | — |
| `exec.command.invoke` | No | — |
| `exec.tasks.*` | No | — |

---

## Making a Command Reversible

When implementing an exec command, pass `reversible: true` and an `undo` function to `pushReceipt`:

```js
const receipt = registry.pushReceipt?.({
  command_id: 'command_center.exec.ui.apply_filter',
  args,
  reversible: true,
  undo: async () => {
    await surface.handlers.applyFilter('');
  },
});
```

The `undo` function must be a closure that captures everything needed to reverse the action.

---

## Notes

- The receipt stack is searched from most recent to oldest for the first `reversible: true` entry.
- The `exec.undo` receipt itself is not reversible (you can't "undo an undo").
- The undo stack is in-memory only — it is lost on page refresh.
- Complex state mutations (API calls, database changes) should not be marked as reversible unless a true rollback mechanism exists on the backend.
