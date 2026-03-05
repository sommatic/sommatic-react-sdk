# `command_center.extract.from_targets`

**Label:** `/extract-targets`  
**Category:** Read (Extract)  
**File:** `commands/read/extractFromTargets.action.js`

---

## Purpose

Reads the current values from one or more UI targets (form fields, inputs, labels). This allows the LLM to inspect what values a user has typed or selected in a form without submitting it.

Optionally maps extracted values to a named schema for structured output.

---

## When to Use

- When the user asks "What values are in the form right now?"
- To validate or inspect form state before calling `exec.ui.submit_form`.
- As an audit step: "Read the current filter values applied to the grid."
- To pre-populate an AI suggestion based on current form state.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `targets` | `string[]` | Yes | Array of target references (`{surface_id}::{target_id}` format). |
| `schema` | `object` | No | Optional mapping schema. Keys are output field names; values have `source_ref` pointing to a target ref. |

---

## Return Value

Without schema:

```js
{
  ok: true,
  data: [
    { ref: "create-project-form::project-name-input", label: "Project Name", type: "input", value: "My New Project" },
    { ref: "create-project-form::status-dropdown", label: "Status", type: "select", value: "active" }
  ]
}
```

With schema:

```js
// schema: { name: { source_ref: "create-project-form::project-name-input" }, status: { source_ref: "create-project-form::status-dropdown" } }
{
  ok: true,
  data: {
    name: "My New Project",
    status: "active"
  }
}
```

If some targets fail:

```js
{
  ok: false,
  data: [
    { ref: "form::input-1", label: "Name", type: "input", value: "Test" },
  ],
  errors: [
    { target_ref: "form::unknown-input", error: "Target not found" }
  ]
}
```

---

## Implementation

```js
// commands/read/extractFromTargets.action.js
export const action = (args, registry) => {
  const { targets, schema } = args || {};

  if (!Array.isArray(targets) || targets.length === 0) {
    return { ok: false, error: { code: 'MISSING_TARGETS', message: 'targets array is required' } };
  }

  const extractedItems = [];
  const errors = [];

  for (const targetRef of targets) {
    const resolved = registry?.resolveTarget?.(targetRef);
    if (!resolved) {
      errors.push({ target_ref: targetRef, error: 'Target not found' });
      continue;
    }

    const { target } = resolved;
    const item = { ref: targetRef, label: target.label || '', type: target.type || 'unknown' };

    if (target.handlers?.getValue) {
      try { item.value = target.handlers.getValue(); }
      catch (err) { item.value = null; item.error = err.message; }
    } else if (target.value !== undefined) {
      item.value = target.value;
    }

    extractedItems.push(item);
  }

  // Apply schema mapping if provided
  if (schema && typeof schema === 'object' && schema.properties) {
    const mapped = {};
    for (const [key, descriptor] of Object.entries(schema.properties)) {
      const sourceRef = descriptor?.source_ref || key;
      const match = extractedItems.find((item) => item.ref === sourceRef);
      mapped[key] = match?.value ?? null;
    }
    return { ok: errors.length === 0, data: mapped, errors: errors.length > 0 ? errors : undefined };
  }

  return { ok: errors.length === 0, data: extractedItems, errors: errors.length > 0 ? errors : undefined };
};
```

---

## Command Definition

```js
{
  id: 'command_center.extract.from_targets',
  label: '/extract-targets',
  description: 'Extract current values from specified UI targets',
  schema: {
    type: 'object',
    properties: {
      targets: {
        type: 'array',
        items: { type: 'string' },
        description: "Array of target references in format 'surface_id::target_id'."
      },
      schema: {
        type: 'object',
        description: 'Optional mapping schema: { properties: { fieldName: { source_ref: "surface::target" } } }'
      }
    },
    required: ['targets']
  },
  action: (args) => Read.extractFromTargets(args, registry),
}
```

---

## Target Registration Requirements

Targets must expose a `getValue` handler to be extractable:

```jsx
targets: [
  {
    id: 'project-name-input',
    label: 'Project Name',
    type: 'input',
    handlers: {
      getValue: () => nameValue,      // ← Required for extraction
      fill: (v) => setNameValue(v),
    },
  },
]
```

---

## Notes

- If a target has neither a `getValue` handler nor a `value` property, its extracted value will be `undefined`.
- Schema mapping is useful when you want to pass structured form data to a subsequent exec command or synthesis step.
- Use `read.ui.targets.list` first to discover available `target_ref` strings.
