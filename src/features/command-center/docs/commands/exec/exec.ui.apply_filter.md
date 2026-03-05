# `command_center.exec.ui.apply_filter`

**Label:** `/apply-filter`  
**Category:** Exec  
**File:** `commands/exec/applyFilter.action.js`

---

## Purpose

Applies a text filter to a registered grid or list surface. Calls the surface's `applyFilter` handler with the provided filter value, updating what is displayed in the grid.

---

## When to Use

- When the user says "Filter the projects list by 'active'" or "Show only agents with name 'Test'."
- To narrow down a list before using `exec.ui.select_rows`.
- For quick search: "Find the project named 'Development'."

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `surface_id` | `string` | Yes | The ID of the grid/list surface to filter. |
| `filter` | `string` | Yes | The filter string to apply. Pass an empty string to clear the filter. |

---

## Return Value

```js
{
  ok: true,
  title: "Applied filter 'active' to [project-list-grid]",
  receipt_id: "rcpt_1772075473717_abc"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_SURFACE_ID", message: "surface_id is required" } }
{ ok: false, error: { code: "MISSING_FILTER", message: "filter is required" } }
{ ok: false, error: { code: "SURFACE_NOT_FOUND", message: "Surface [xyz] not found" } }
{ ok: false, error: { code: "NO_FILTER_HANDLER", message: "Surface [xyz] has no applyFilter handler" } }
{ ok: false, error: { code: "FILTER_FAILED", message: "Handler threw: ..." } }
```

---

## Implementation

```js
// commands/exec/applyFilter.action.js
export const action = async (args, registry) => {
  const { surface_id, filter } = args || {};

  if (!surface_id) return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };
  if (filter === undefined || filter === null) {
    return { ok: false, error: { code: 'MISSING_FILTER', message: 'filter is required' } };
  }

  const surface = registry?.getSurface?.(surface_id);
  if (!surface) return { ok: false, error: { code: 'SURFACE_NOT_FOUND', message: `Surface [${surface_id}] not found` } };

  if (!surface.handlers?.applyFilter) {
    return { ok: false, error: { code: 'NO_FILTER_HANDLER', message: `Surface [${surface_id}] has no applyFilter handler` } };
  }

  try {
    await surface.handlers.applyFilter(filter);
  } catch (err) {
    return { ok: false, error: { code: 'FILTER_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.apply_filter',
    args,
    reversible: true,
    undo: async () => surface.handlers.applyFilter(''),
  });

  return { ok: true, title: `Applied filter '${filter}' to [${surface_id}]`, receipt_id: receipt?.id };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.ui.apply_filter',
  label: '/apply-filter',
  description: 'Apply a text filter to a grid or list surface',
  schema: {
    type: 'object',
    properties: {
      surface_id: {
        type: 'string',
        description: "ID of the grid surface. Known surfaces: 'project-list-grid', 'agent-profile-list-grid', 'llm-provider-list-grid', 'cognitive-tool-list-grid', 'prompt-template-list-grid', 'external-datasource-list-grid'."
      },
      filter: {
        type: 'string',
        description: "Text to filter by. Pass empty string '' to clear the filter."
      }
    },
    required: ['surface_id', 'filter']
  },
  action: (args) => Exec.applyFilter(args, registry),
}
```

---

## Registering a Filterable Grid

```jsx
const [filter, setFilter] = useState('');

useSommaticSurface({
  id: 'project-list-grid',
  type: 'grid',
  label: 'Project List',
  handlers: {
    applyFilter: (value) => setFilter(value),
    selectRows: (ids) => setSelectedRowIds(ids),
  },
}, []);

// In the DataGrid:
rows={projects.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))}
```

---

## Notes

- `applyFilter` is `reversible: true` in the receipt — the undo handler calls `applyFilter('')` to clear the filter.
- The filter logic is implemented by the host component — the command just calls the handler with the string. Server-side filtering is also possible if the handler triggers an API call.
- To clear a filter, call `exec.ui.apply_filter` with `filter: ""`.
