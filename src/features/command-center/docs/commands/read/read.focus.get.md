# `command_center.read.focus.get`

**Label:** `/get-focus`  
**Category:** Read  
**File:** `commands/read/getFocus.action.js`

---

## Purpose

Returns the currently focused entity or active panel as reported by a host component. Focus represents "what the user is currently working on" — usually the entity displayed on a detail page.

---

## When to Use

- When the LLM needs to know which specific entity is currently active.
- As a fallback when `page-context` is unavailable or doesn't expose entity IDs directly.
- When the user says "Do X on this project" — the LLM uses focus to resolve "this project" to a concrete entity ID.

---

## Arguments

None.

---

## Return Value

### Entity focus (detail page)

```js
{
  focus: {
    entity_type: "project",
    entity_id: "prj-management-cc48809102397ed",
    label: "Development"
  }
}
```

### Panel focus

```js
{
  focus: {
    type: "panel",
    panel_id: "create-project-form",
    label: "Create Project"
  }
}
```

### No focus registered

```js
{ focus: null }
```

---

## Implementation

```js
// commands/read/getFocus.action.js
export const action = (registry) => {
  if (!registry?.getFocusData) {
    return { focus: null };
  }

  const focus = registry.getFocusData();
  return { focus };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.focus.get',
  label: '/get-focus',
  description: 'Get currently focused entity or active panel',
  schema: {},
  action: () => Read.getFocus(registry),
}
```

---

## Reporting Focus in a Host Application

Use `useSommaticFocus` in any detail component to expose the active entity:

```jsx
import { useSommaticFocus } from 'sommatic-react-sdk';

// In a project detail component
useSommaticFocus(
  {
    entity_type: 'project',
    entity_id: project.id,
    label: project.name,
  },
  [project.id, project.name],
);
```

The hook calls `setFocusData(data)` on the registry. On unmount, it clears the focus by calling `setFocusData(null)`.

---

## Focus vs. Context Source

| Feature | `useSommaticFocus` | `useSommaticContextSource` |
|---------|-------------------|--------------------------|
| Purpose | Reports current entity ID/type | Exposes full data payload |
| Access | `read.focus.get` | `read.insights.snapshot` |
| Payload | `{ entity_type, entity_id, label }` | Any shape |
| Updates | Triggers on entity change | Triggers on any data change |

Use both together for maximum discoverability: focus gives the LLM the ID, the context source gives it the full data.

---

## Notes

- Only one focus entry exists globally in the registry. The last component to call `useSommaticFocus` owns it.
- On navigation away from a detail page, React's unmount lifecycle clears the focus.
