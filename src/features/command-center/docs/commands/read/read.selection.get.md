# `command_center.read.selection.get`

**Label:** `/get-selection`  
**Category:** Read  
**File:** `commands/read/getSelection.action.js`

---

## Purpose

Returns the current user selection as reported by host components. Selection can represent selected rows in a grid, highlighted text, or any structured selection data a component chooses to expose.

---

## When to Use

- When the user asks "What do I have selected?" or "Tell me about the selected items."
- Before executing a batch exec command on selected items.
- When the LLM needs to know which rows/entities to operate on without asking the user explicitly.

---

## Arguments

None.

---

## Return Value

### Rows selected in a grid

```js
{
  selection: {
    type: "rows",
    ids: ["prj-management-a4b0e53a9532edd", "prj-management-f00d4ca337d8dcb"],
    source: "project-list-grid"
  }
}
```

### Text selection

```js
{
  selection: {
    type: "text",
    value: "Hello world",
    source: "browser"
  }
}
```

### No selection

```js
{ selection: null }
```

---

## Implementation

```js
// commands/read/getSelection.action.js
export const action = (registry) => {
  if (!registry?.getSelectionData) {
    return { selection: null };
  }

  const selection = registry.getSelectionData();
  return { selection };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.selection.get',
  label: '/get-selection',
  description: 'Get current user selection (rows, text, or entities)',
  schema: {},
  action: () => Read.getSelection(registry),
}
```

---

## Reporting Selection in a Host Application

Components that manage selections must call `useSommaticSelection` to make them visible:

```jsx
import { useSommaticSelection } from 'sommatic-react-sdk';

// In a list component
useSommaticSelection(
  selectedRowIds.length > 0
    ? { type: 'rows', ids: selectedRowIds, source: 'project-list-grid' }
    : null,
  [selectedRowIds],
);
```

The hook calls `setSelection(data)` on the registry whenever the selection changes. Passing `null` clears the selection.

---

## Integration With `exec.ui.select_rows`

When the user asks the Command Center to "select rows with slug X", `exec.ui.select_rows` updates the `selectedRowIds` state in the component. If `useSommaticSelection` is wired up, a subsequent `read.selection.get` call will return those row IDs.

This creates a full read/write cycle:
1. `exec.ui.select_rows` → sets rows visually + state
2. `useSommaticSelection` → reports new state to registry
3. `read.selection.get` → LLM can read which rows are selected

---

## Notes

- Selection is stored as a single global entry in the registry. If multiple components call `setSelection`, the last one wins.
- For multi-component selection tracking, consider using distinct selection keys and returning a combined object from `getData`.
