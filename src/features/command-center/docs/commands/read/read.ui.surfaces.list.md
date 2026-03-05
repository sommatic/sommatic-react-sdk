# `command_center.read.ui.surfaces.list`

**Label:** `/list-surfaces`  
**Category:** Read  
**File:** `commands/read/listSurfaces.action.js`

---

## Purpose

Lists all UI surfaces currently registered in the Command Center, including their IDs, types, labels, and descriptions. Surfaces are interactive UI elements (grids, forms, modals, panels, apps) that the Command Center can interact with programmatically.

---

## When to Use

- When the user asks "What UI elements can I interact with?"
- Before calling `exec.ui.apply_filter`, `exec.ui.select_rows`, `exec.ui.submit_form`, etc., to discover valid surface IDs.
- As a discovery step in a multi-command plan.

---

## Arguments

None.

---

## Return Value

```js
{
  surfaces: [
    {
      id: "project-list-grid",
      type: "grid",
      label: "Project List",
      description: "Grid listing all projects with filter and row selection."
    },
    {
      id: "create-project-form",
      type: "form",
      label: "Create Project Form",
      description: "Form to create a new project."
    },
    {
      id: "agent-profile-list-grid",
      type: "grid",
      label: "Agent Profile List",
      description: "Grid of AI agent profiles."
    }
  ]
}
```

If no surfaces are registered:

```js
{ surfaces: [] }
```

---

## Implementation

```js
// commands/read/listSurfaces.action.js
export const action = (registry) => {
  if (!registry?.getSurfaces) {
    return { surfaces: [] };
  }

  return { surfaces: registry.getSurfaces() };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.ui.surfaces.list',
  label: '/list-surfaces',
  description: 'List all registered UI surfaces (grids, forms, modals, panels)',
  schema: {},
  action: () => Read.listSurfaces(registry),
}
```

---

## Surface Registration in Host Applications

Surfaces are registered using `useSommaticSurface`:

```jsx
import { useSommaticSurface } from 'sommatic-react-sdk';

useSommaticSurface(
  {
    id: 'llm-provider-list-grid',
    type: 'grid',
    label: 'LLM Provider List',
    description: 'Grid listing all configured LLM providers.',
    handlers: {
      applyFilter: (value) => setFilter(value),
      selectRows: (ids) => setSelectedRowIds(ids),
    },
    targets: [],
  },
  [],
);
```

The returned list from `getSurfaces()` includes `id`, `type`, `label`, `description`, and optionally `targets`.

---

## Related Commands

- `read.ui.targets.list` — Lists the individual UI targets within a specific surface.
- `observe.ui` — Suggests which surfaces/targets are relevant for a given natural language instruction.
- `exec.ui.open_surface`, `exec.ui.close_surface` — Open/close modal or panel surfaces.
- `exec.ui.apply_filter`, `exec.ui.select_rows` — Interact with grid surfaces.

---

## Notes

- Surfaces are cleaned up automatically when their host component unmounts (via the returned unregister function from `registerSurface`).
- The `getSurfaces()` method returns only currently mounted surfaces.
