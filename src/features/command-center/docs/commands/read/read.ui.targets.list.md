# `command_center.read.ui.targets.list`

**Label:** `/list-targets`  
**Category:** Read  
**File:** `commands/read/listTargets.action.js`

---

## Purpose

Lists all actionable targets within a specific surface. A target represents an individual UI element (button, input field, dropdown, etc.) that the Command Center can interact with via the `exec.ui.act` or `extract.from_targets` commands.

---

## When to Use

- Before calling `exec.ui.act` to discover valid `target_ref` values.
- When the user asks "What actions are available in this form?"
- To understand what fields are available in a form surface before `exec.ui.set_fields`.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `surface_id` | `string` | Yes | The ID of the surface to inspect. |

---

## Return Value

Each target includes **`target_ref`** in the format `surface_id::target_id`. Use this exact string in `exec.ui.act` and `extract.from_targets` (do not concatenate manually).

```js
{
  ok: true,
  surface_id: "create-project-form",
  targets: [
    {
      ref: "project-name-input",
      id: "project-name-input",
      label: "Project Name",
      type: "input",
      methods: ["getValue", "fill"],
      target_ref: "create-project-form::project-name-input"
    },
    {
      ref: "submit-btn",
      id: "submit-btn",
      label: "Submit",
      type: "button",
      methods: ["click"],
      target_ref: "create-project-form::submit-btn"
    },
    {
      ref: "status-dropdown",
      id: "status-dropdown",
      label: "Status",
      type: "select",
      methods: ["getValue", "fill"],
      target_ref: "create-project-form::status-dropdown"
    }
  ]
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_SURFACE_ID", message: "surface_id is required" } }
{ ok: false, error: { code: "SURFACE_NOT_FOUND", message: "Surface [xyz] not found" } }
```

---

## Implementation

```js
// commands/read/listTargets.action.js
export const action = (args, registry) => {
  const { surface_id } = args || {};

  if (!surface_id) {
    return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };
  }

  if (!registry?.getTargets) {
    return { surface_id, targets: [] };
  }

  const rawTargets = registry.getTargets(surface_id);
  const targets = rawTargets.map((t) => {
    const ref = t.ref || t.id || '';
    return {
      ref,
      id: ref,
      label: t.label || '',
      type: t.type || 'unknown',
      methods: t.methods || [],
      target_ref: `${surface_id}::${ref}`,
    };
  });

  return { surface_id, targets };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.ui.targets.list',
  label: '/list-targets',
  description: 'List all actionable targets within a surface',
  schema: {
    type: 'object',
    properties: {
      surface_id: {
        type: 'string',
        description: 'ID of the surface to inspect.'
      }
    },
    required: ['surface_id']
  },
  action: (args) => Read.listTargets(args, registry),
}
```

---

## Target Definition in Host Applications

Targets are specified in the `targets` array of a surface:

```jsx
useSommaticSurface({
  id: 'create-agent-form',
  type: 'form',
  label: 'Create Agent Form',
  targets: [
    {
      id: 'agent-name-input',
      label: 'Agent Name',
      type: 'input',
      handlers: {
        getValue: () => nameValue,
        fill: (value) => setNameValue(value),
      },
    },
    {
      id: 'submit-btn',
      label: 'Submit',
      type: 'button',
      handlers: {
        click: () => handleSubmit(),
      },
    },
  ],
  handlers: {
    setFields: (fields) => { if (fields.name) setNameValue(fields.name); },
    submit: () => handleSubmit(),
  },
}, []);
```

---

## Target Reference Format

The response of `read.ui.targets.list` includes a **`target_ref`** for each target in the format `{surface_id}::{target_id}`. Use this exact string when calling `exec.ui.act` or `extract.from_targets`:

```
{surface_id}::{target_id}
```

Example (from list-targets response):
```
create-agent-form::agent-name-input
create-agent-form::submit-btn
```

`registry.resolveTarget(targetRef)` parses this format and returns `{ surface, target }`.

---

## Virtual Targets

If a surface has no explicit `targets` but registers `handlers`, the `observe.ui` command generates **virtual targets** for those handlers. These won't appear in `list-targets` results because `getTargets()` only returns explicitly defined targets. Use `observe.ui` for discovering virtual targets.

---

## Notes

- Empty `targets: []` is common for grids and panels that expose functionality only through handlers. Use `observe.ui` to discover their capabilities.
- The `methods` array in the response is derived from `Object.keys(target.handlers)`.
