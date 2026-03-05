# `command_center.exec.ui.select_rows`

**Label:** `/select-rows`  
**Category:** Exec  
**File:** `commands/exec/selectRows.action.js`

---

## Purpose

Selects rows in a registered grid surface. Supports two selection modes:
1. **By direct row IDs** — when the exact IDs are known.
2. **By identifiers + field matching** — when IDs are unknown but values like slugs or names are known. Uses the `page-context` snapshot to resolve identifiers to IDs.

After execution, rows are visually highlighted in the grid and the selection is reported to `useSommaticSelection`, making it accessible via `read.selection.get`.

---

## When to Use

- When the user says "Select the row with slug 'my-project'."
- Before performing a batch operation on selected rows.
- When the LLM resolves entity names to IDs using page context.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `surface_id` | `string` | Yes | The ID of the grid surface. |
| `row_ids` | `string[]` | No | Array of exact row IDs to select. |
| `identifiers` | `string[]` | No | Values to match (e.g., slugs or names) when exact IDs are unknown. Requires `match_field`. |
| `match_field` | `string` | No | Field in the page-context `items` array to match `identifiers` against (e.g., `'slug'`, `'name'`). Defaults to `'id'`. |

At least one of `row_ids` or `identifiers` must be provided.

---

## Return Value

```js
{
  ok: true,
  title: "Selected 2 rows in [project-list-grid]",
  selected_count: 2,
  selected_ids: ["prj-management-a4b0e53a9532edd", "prj-management-f00d4ca337d8dcb"],
  receipt_id: "rcpt_1772112464496_2kolnjx"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_SURFACE_ID", message: "surface_id is required" } }
{ ok: false, error: { code: "MISSING_ROW_IDS", message: "Either row_ids or identifiers must be provided" } }
{ ok: false, error: { code: "NO_SELECTION_HANDLER", message: "Surface [xyz] has no selectRows handler" } }
{ ok: false, error: { code: "NO_PAGE_CONTEXT", message: "page-context snapshot unavailable for identifier resolution" } }
{ ok: false, error: { code: "NO_ITEMS_IN_CONTEXT", message: "page-context snapshot has no 'items' array" } }
{ ok: false, error: { code: "NO_MATCHES", message: "No items matched the provided identifiers" } }
```

---

## Implementation

```js
// commands/exec/selectRows.action.js
export const action = async (args, registry) => {
  const { surface_id, row_ids, identifiers, match_field = 'id' } = args || {};

  if (!surface_id) return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };

  const surface = registry?.getSurface?.(surface_id);
  if (!surface) return { ok: false, error: { code: 'SURFACE_NOT_FOUND', message: `Surface [${surface_id}] not found` } };

  if (!surface.handlers?.selectRows) {
    return { ok: false, error: { code: 'NO_SELECTION_HANDLER', message: `Surface [${surface_id}] has no selectRows handler` } };
  }

  let resolvedIds = Array.isArray(row_ids) ? [...row_ids] : [];

  // Resolve identifiers to IDs using page-context snapshot
  if (Array.isArray(identifiers) && identifiers.length > 0 && match_field !== 'id') {
    const snapshot = registry?.getSnapshot?.('page-context');
    const items = snapshot?.payload?.items;

    if (!items) return { ok: false, error: { code: 'NO_PAGE_CONTEXT', message: 'page-context snapshot unavailable' } };
    if (!Array.isArray(items)) return { ok: false, error: { code: 'NO_ITEMS_IN_CONTEXT', message: 'page-context has no items array' } };

    const normalized = identifiers.map((v) => String(v).toLowerCase());
    const matched = items.filter((item) =>
      normalized.includes(String(item[match_field] ?? '').toLowerCase())
    );

    if (matched.length === 0) {
      return { ok: false, error: { code: 'NO_MATCHES', message: `No items matched identifiers via field '${match_field}'` } };
    }

    resolvedIds = [...resolvedIds, ...matched.map((item) => item.id)];
  }

  if (resolvedIds.length === 0 && (!Array.isArray(identifiers) || identifiers.length === 0)) {
    return { ok: false, error: { code: 'MISSING_ROW_IDS', message: 'Either row_ids or identifiers must be provided' } };
  }

  await surface.handlers.selectRows(resolvedIds);

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.select_rows',
    args,
    reversible: true,
    undo: async () => surface.handlers.selectRows([]),
  });

  return {
    ok: true,
    title: `Selected ${resolvedIds.length} rows in [${surface_id}]`,
    selected_count: resolvedIds.length,
    selected_ids: resolvedIds,
    receipt_id: receipt?.id,
  };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.ui.select_rows',
  label: '/select-rows',
  description: 'Select rows in a grid by IDs or by matching field values',
  schema: {
    type: 'object',
    properties: {
      surface_id: {
        type: 'string',
        description: "ID of the grid surface. Known surfaces: 'project-list-grid', etc."
      },
      row_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of exact row IDs to select.'
      },
      identifiers: {
        type: 'array',
        items: { type: 'string' },
        description: "Values to match when IDs are unknown (e.g., slugs or names). Use with match_field."
      },
      match_field: {
        type: 'string',
        description: "Field to match identifiers against (e.g. 'slug', 'name'). Requires page-context items array."
      }
    },
    required: ['surface_id']
  },
  action: (args) => Exec.selectRows(args, registry),
}
```

---

## Visual Feedback Requirements

For rows to appear visually selected in MUI DataGrid, the host component must:

```jsx
const [selectedRowIds, setSelectedRowIds] = useState([]);

// In the surface handler:
handlers: {
  selectRows: (ids) => setSelectedRowIds(ids),
}

// In the DataGrid:
<DataGrid
  checkboxSelection
  rowSelectionModel={selectedRowIds}
  onRowSelectionModelChange={(ids) => setSelectedRowIds(ids)}
  disableRowSelectionOnClick={true}
/>
```

Without `rowSelectionModel` bound to state, the command will update state internally but rows won't appear visually highlighted.

---

## Notes

- Identifier-to-ID resolution requires `page-context` to have an `items` array in its payload. The host component's `getData()` must include this array.
- The receipt is `reversible: true`. The undo operation calls `selectRows([])` to clear the selection.
- After selecting rows, `read.selection.get` will return the selected IDs if `useSommaticSelection` is wired up.
