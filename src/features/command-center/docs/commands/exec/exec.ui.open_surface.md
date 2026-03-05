# `command_center.exec.ui.open_surface`

**Label:** `/open-surface`  
**Category:** Exec  
**File:** `commands/exec/openSurface.action.js`

---

## Purpose

Opens a registered surface — typically a modal, drawer, or side panel — by calling its `open` handler. The surface must be registered with an `open` handler that controls its visibility.

---

## When to Use

- When the user asks to open a form, modal, or panel: "Open the create project form."
- As a prerequisite to `exec.ui.set_fields` or `exec.ui.submit_form` when the form lives inside a modal.
- For HITL app surfaces, prefer `exec.app.open` which supports async outputs.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `surface_id` | `string` | Yes | The ID of the surface to open. |
| `params` | `object` | No | Optional parameters to pass to the `open` handler (e.g., initial form values). |

---

## Return Value

```js
{
  ok: true,
  title: "Opened surface [create-project-form]",
  receipt_id: "rcpt_1772075473717_abc"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_SURFACE_ID", message: "surface_id is required" } }
{ ok: false, error: { code: "SURFACE_NOT_FOUND", message: "Surface [xyz] not found" } }
{ ok: false, error: { code: "NO_OPEN_HANDLER", message: "Surface [xyz] has no open handler" } }
{ ok: false, error: { code: "OPEN_FAILED", message: "Handler threw: ..." } }
```

---

## Implementation

```js
// commands/exec/openSurface.action.js
export const action = async (args, registry) => {
  const { surface_id, params } = args || {};

  if (!surface_id) return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };

  const surface = registry?.getSurface?.(surface_id);
  if (!surface) return { ok: false, error: { code: 'SURFACE_NOT_FOUND', message: `Surface [${surface_id}] not found` } };

  if (!surface.handlers?.open) {
    return { ok: false, error: { code: 'NO_OPEN_HANDLER', message: `Surface [${surface_id}] has no open handler` } };
  }

  try {
    await surface.handlers.open(params);
  } catch (err) {
    return { ok: false, error: { code: 'OPEN_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.open_surface',
    args,
    reversible: false,
  });

  return { ok: true, title: `Opened surface [${surface_id}]`, receipt_id: receipt?.id };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.ui.open_surface',
  label: '/open-surface',
  description: 'Open a modal, drawer, or panel surface',
  schema: {
    type: 'object',
    properties: {
      surface_id: { type: 'string', description: 'ID of the surface to open.' },
      params: { type: 'object', description: 'Optional parameters to pass to the open handler.' }
    },
    required: ['surface_id']
  },
  action: (args) => Exec.openSurface(args, registry),
}
```

---

## Registering an Openable Surface

```jsx
const [isOpen, setIsOpen] = useState(false);

useSommaticSurface({
  id: 'create-project-modal',
  type: 'modal',
  label: 'Create Project',
  handlers: {
    open: (params) => {
      if (params?.initialName) setProjectName(params.initialName);
      setIsOpen(true);
    },
    close: () => setIsOpen(false),
    submit: () => handleSubmit(),
  },
}, []);
```

---

## Typical Chained Flow

```
1. exec.ui.open_surface { surface_id: "create-project-modal" }
2. exec.ui.set_fields { surface_id: "create-project-modal", fields: { name: "New Project", status: "active" } }
3. exec.ui.submit_form { surface_id: "create-project-modal" }
```
