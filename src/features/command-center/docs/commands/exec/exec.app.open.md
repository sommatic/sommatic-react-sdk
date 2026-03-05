# `command_center.exec.app.open`

**Label:** `/open-app`  
**Category:** Exec  
**File:** `commands/exec/openApp.action.js`

---

## Purpose

Opens a HITL (Human-in-the-Loop) App surface and waits for its outputs. Unlike `exec.ui.open_surface` (which is fire-and-forget), this command awaits the app's completion and returns the outputs produced by the user's interaction within the app.

HITL App surfaces are complex UIs (wizards, multi-step forms, embedded tools) that the agent launches to collect structured input from the user.

---

## When to Use

- When a workflow requires structured human input before continuing.
- When launching a wizard or a multi-step data collection form that the agent cannot fill automatically.
- When `exec.ui.set_fields` + `exec.ui.submit_form` is not sufficient and the user needs to interact with a complex UI.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `app_id` | `string` | Yes | The surface ID of the app to open. The surface must have type `'app'` and an `open` handler. |
| `initial_state` | `object` | No | Optional state to pre-populate the app with before showing it to the user. |

---

## Return Value

```js
{
  ok: true,
  title: "Opened app [create-project-wizard]",
  outputs: {
    name: "My New Project",
    status: "active",
    organization: "org-232121",
    confirmed: true
  },
  receipt_id: "rcpt_1772075473717_abc"
}
```

If the user cancels the app:

```js
{
  ok: true,
  title: "Opened app [create-project-wizard]",
  outputs: { cancelled: true },
  receipt_id: "..."
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_APP_ID", message: "app_id is required" } }
{ ok: false, error: { code: "APP_NOT_FOUND", message: "App [xyz] not found in surface registry" } }
{ ok: false, error: { code: "NO_OPEN_HANDLER", message: "App [xyz] has no open handler" } }
{ ok: false, error: { code: "APP_OPEN_FAILED", message: "App threw: ..." } }
```

---

## Implementation

```js
// commands/exec/openApp.action.js
export const action = async (args, registry) => {
  const { app_id, initial_state } = args || {};

  if (!app_id) return { ok: false, error: { code: 'MISSING_APP_ID', message: 'app_id is required' } };

  const surface = registry?.getSurface?.(app_id);
  if (!surface) return { ok: false, error: { code: 'APP_NOT_FOUND', message: `App [${app_id}] not found` } };

  if (!surface.handlers?.open) {
    return { ok: false, error: { code: 'NO_OPEN_HANDLER', message: `App [${app_id}] has no open handler` } };
  }

  let outputs;
  try {
    outputs = await surface.handlers.open(initial_state);
  } catch (err) {
    return { ok: false, error: { code: 'APP_OPEN_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.app.open',
    args,
    reversible: false,
    outputs,
  });

  return { ok: true, title: `Opened app [${app_id}]`, outputs, receipt_id: receipt?.id };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.app.open',
  label: '/open-app',
  description: 'Open a HITL app surface and wait for user outputs',
  schema: {
    type: 'object',
    properties: {
      app_id: { type: 'string', description: 'Surface ID of the app to open.' },
      initial_state: { type: 'object', description: 'Optional initial state to pre-populate the app.' }
    },
    required: ['app_id']
  },
  action: (args) => Exec.openApp(args, registry),
}
```

---

## Implementing an App Surface

The `open` handler must return a Promise that resolves when the user completes or cancels the app:

```jsx
const [isOpen, setIsOpen] = useState(false);
const [resolveOutputs, setResolveOutputs] = useState(null);

useSommaticSurface({
  id: 'create-project-wizard',
  type: 'app',
  label: 'Create Project Wizard',
  handlers: {
    open: (initialState) => new Promise((resolve) => {
      if (initialState?.name) setPrefillName(initialState.name);
      setIsOpen(true);
      setResolveOutputs(() => resolve);  // Store resolver for later
    }),
  },
}, []);

// When user completes the wizard:
const handleComplete = (outputs) => {
  setIsOpen(false);
  resolveOutputs?.(outputs);  // Resolves the promise → command returns
};

// When user cancels:
const handleCancel = () => {
  setIsOpen(false);
  resolveOutputs?.({ cancelled: true });
};
```

---

## Notes

- The `open` handler must be an async function (or return a Promise). The command `await`s it, so the Command Center will appear to "think" until the user completes the app.
- This pattern enables true Human-in-the-Loop: the agent pauses and waits for structured human input before continuing the plan.
- `outputs` shape is entirely defined by the app — the Command Center does not enforce a schema.
