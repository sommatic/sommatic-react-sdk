# `command_center.exec.ui.set_fields`

**Label:** `/set-fields`  
**Category:** Exec  
**File:** `commands/exec/setFields.action.js`

---

## Purpose

Fills one or more form fields by calling a surface's `setFields` handler with a key-value map. This is a high-level alternative to calling `exec.ui.act` on individual targets, designed for form surfaces that expose a batch-set API.

---

## When to Use

- When the user asks to pre-fill a form: "Fill in the form with name 'Test Project' and status 'active'."
- As part of a flow: open modal → set fields → submit form.
- When a form surface is registered with a `setFields` handler that accepts a `fields` object.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `surface_id` | `string` | Yes | The ID of the form surface. |
| `fields` | `object` | Yes | Key-value map of field names to values. |

---

## Return Value

```js
{
  ok: true,
  title: "Set fields on [create-project-form]",
  fields_set: ["name", "status", "organization"],
  receipt_id: "rcpt_1772075473717_abc"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_SURFACE_ID", message: "surface_id is required" } }
{ ok: false, error: { code: "MISSING_FIELDS", message: "fields object is required" } }
{ ok: false, error: { code: "SURFACE_NOT_FOUND", message: "Surface [xyz] not found" } }
{ ok: false, error: { code: "NO_SET_FIELDS_HANDLER", message: "Surface [xyz] has no setFields handler" } }
{ ok: false, error: { code: "SET_FIELDS_FAILED", message: "Handler threw: ..." } }
```

---

## Implementation

```js
// commands/exec/setFields.action.js
export const action = async (args, registry) => {
  const { surface_id, fields } = args || {};

  if (!surface_id) return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };
  if (!fields || typeof fields !== 'object') {
    return { ok: false, error: { code: 'MISSING_FIELDS', message: 'fields object is required' } };
  }

  const surface = registry?.getSurface?.(surface_id);
  if (!surface) return { ok: false, error: { code: 'SURFACE_NOT_FOUND', message: `Surface [${surface_id}] not found` } };

  if (!surface.handlers?.setFields) {
    return { ok: false, error: { code: 'NO_SET_FIELDS_HANDLER', message: `Surface [${surface_id}] has no setFields handler` } };
  }

  try {
    await surface.handlers.setFields(fields);
  } catch (err) {
    return { ok: false, error: { code: 'SET_FIELDS_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.set_fields',
    args,
    reversible: false,
    fields_set: Object.keys(fields),
  });

  return {
    ok: true,
    title: `Set fields on [${surface_id}]`,
    fields_set: Object.keys(fields),
    receipt_id: receipt?.id,
  };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.ui.set_fields',
  label: '/set-fields',
  description: 'Fill form fields with a key-value map',
  schema: {
    type: 'object',
    properties: {
      surface_id: { type: 'string', description: 'ID of the form surface.' },
      fields: {
        type: 'object',
        description: 'Key-value map of fields to fill (e.g. { "name": "My Project", "status": "active" }).'
      }
    },
    required: ['surface_id', 'fields']
  },
  action: (args) => Exec.setFields(args, registry),
}
```

---

## Registering a Form With `setFields`

```jsx
const [name, setName] = useState('');
const [status, setStatus] = useState('active');

useSommaticSurface({
  id: 'create-project-form',
  type: 'form',
  label: 'Create Project Form',
  handlers: {
    setFields: (fields) => {
      if (fields.name !== undefined) setName(fields.name);
      if (fields.status !== undefined) setStatus(fields.status);
    },
    submit: () => handleSubmit(),
  },
}, []);
```

---

## Notes

- `setFields` is a surface-level batch setter. Individual target-level setters are handled via `exec.ui.act` with method `fill`.
- The `setFields` handler in the surface is responsible for deciding which fields to update — unknown keys can be silently ignored.
- After calling `set_fields`, you can validate the values with `extract.from_targets` before submitting.
