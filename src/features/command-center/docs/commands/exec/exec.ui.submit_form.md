# `command_center.exec.ui.submit_form`

**Label:** `/submit-form`  
**Category:** Exec  
**File:** `commands/exec/submitForm.action.js`

---

## Purpose

Submits a registered form surface programmatically by calling its `submit` handler. The surface handles all validation and submission logic internally.

---

## When to Use

- As the final step after filling a form with `exec.ui.set_fields`.
- When the user says "Submit the form" or "Save this."
- In automated flows: open modal → set fields → submit.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `surface_id` | `string` | Yes | The ID of the form surface to submit. |

---

## Return Value

```js
{
  ok: true,
  title: "Submitted form [create-project-form]",
  data: { /* whatever the submit handler returned */ },
  receipt_id: "rcpt_1772075473717_abc"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_SURFACE_ID", message: "surface_id is required" } }
{ ok: false, error: { code: "SURFACE_NOT_FOUND", message: "Surface [xyz] not found" } }
{ ok: false, error: { code: "NO_SUBMIT_HANDLER", message: "Surface [xyz] has no submit handler" } }
{ ok: false, error: { code: "SUBMIT_FAILED", message: "Handler threw: Validation error: name is required" } }
```

---

## Implementation

```js
// commands/exec/submitForm.action.js
export const action = async (args, registry) => {
  const { surface_id } = args || {};

  if (!surface_id) return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };

  const surface = registry?.getSurface?.(surface_id);
  if (!surface) return { ok: false, error: { code: 'SURFACE_NOT_FOUND', message: `Surface [${surface_id}] not found` } };

  if (!surface.handlers?.submit) {
    return { ok: false, error: { code: 'NO_SUBMIT_HANDLER', message: `Surface [${surface_id}] has no submit handler` } };
  }

  let result;
  try {
    result = await surface.handlers.submit();
  } catch (err) {
    return { ok: false, error: { code: 'SUBMIT_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.submit_form',
    args,
    reversible: false,
    result,
  });

  return { ok: true, title: `Submitted form [${surface_id}]`, data: result, receipt_id: receipt?.id };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.ui.submit_form',
  label: '/submit-form',
  description: 'Submit a registered form surface',
  schema: {
    type: 'object',
    properties: {
      surface_id: { type: 'string', description: 'ID of the form surface to submit.' }
    },
    required: ['surface_id']
  },
  action: (args) => Exec.submitForm(args, registry),
}
```

---

## Registering a Form With a Submit Handler

```jsx
const handleSubmit = async () => {
  try {
    await createProject({ name, status, organizationId });
    setIsOpen(false);
    return { success: true };
  } catch (err) {
    throw new Error(`Validation error: ${err.message}`);
  }
};

useSommaticSurface({
  id: 'create-project-form',
  type: 'form',
  label: 'Create Project Form',
  handlers: {
    submit: handleSubmit,
    setFields: (f) => { /* ... */ },
  },
}, []);
```

---

## Notes

- The `submit` handler should throw if validation fails — the error message will be returned as `SUBMIT_FAILED`.
- If the form submits successfully and closes a modal, register the `close` handler separately and call `exec.ui.close_surface` as a follow-up if needed.
- `data` in the success response is whatever `submit()` returns — useful for getting created entity IDs in follow-up steps.
