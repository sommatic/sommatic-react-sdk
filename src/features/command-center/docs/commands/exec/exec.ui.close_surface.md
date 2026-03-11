# `command_center.exec.ui.close_surface`

**Label:** `/close-surface`  
**Category:** Exec  
**File:** `commands/exec/closeSurface.action.js`

---

## Purpose

Closes a registered surface — a modal, drawer, or side panel — by calling its `close` handler.

---

## When to Use

- After completing or canceling a form inside a modal.
- When the user says "close this" or "dismiss this panel."
- As a cleanup step after `exec.ui.submit_form`.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `surface_id` | `string` | Yes | The ID of the surface to close. |

---

## Return Value

```js
{
  ok: true,
  title: "Closed surface [create-project-modal]",
  receipt_id: "rcpt_1772075473717_xyz"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_SURFACE_ID", message: "surface_id is required" } }
{ ok: false, error: { code: "SURFACE_NOT_FOUND", message: "Surface [xyz] not found" } }
{ ok: false, error: { code: "NO_CLOSE_HANDLER", message: "Surface [xyz] has no close handler" } }
{ ok: false, error: { code: "CLOSE_FAILED", message: "Handler threw: ..." } }
```

---

## Implementation

```js
// commands/exec/closeSurface.action.js
export const action = async (args, registry) => {
  const { surface_id } = args || {};

  if (!surface_id) return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };

  const surface = registry?.getSurface?.(surface_id);
  if (!surface) return { ok: false, error: { code: 'SURFACE_NOT_FOUND', message: `Surface [${surface_id}] not found` } };

  if (!surface.handlers?.close) {
    return { ok: false, error: { code: 'NO_CLOSE_HANDLER', message: `Surface [${surface_id}] has no close handler` } };
  }

  try {
    await surface.handlers.close();
  } catch (err) {
    return { ok: false, error: { code: 'CLOSE_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.close_surface',
    args,
    reversible: false,
  });

  return { ok: true, title: `Closed surface [${surface_id}]`, receipt_id: receipt?.id };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.ui.close_surface',
  label: '/close-surface',
  description: 'Close a modal, drawer, or panel surface',
  schema: {
    type: 'object',
    properties: {
      surface_id: { type: 'string', description: 'ID of the surface to close.' }
    },
    required: ['surface_id']
  },
  action: (args) => Exec.closeSurface(args, registry),
}
```

---

## Notes

- The surface must be registered with a `close` handler. If the surface controls its own visibility via a `useState` setter, the handler should call it.
- After closing, the surface remains registered in the Command Center until its host component unmounts. The `getSurface(id)` call will still return the surface object.
