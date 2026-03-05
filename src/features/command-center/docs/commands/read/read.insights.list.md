# `command_center.read.insights.list`

**Label:** `/list-sources`  
**Category:** Read  
**File:** `commands/read/listInsights.action.js`

---

## Purpose

Lists all InsightSources currently registered in the Command Center, along with their IDs and descriptions. Supports optional keyword filtering.

---

## When to Use

- When the user wants to know what data is available: "What sources do you have access to?"
- Before executing `read.insights.describe` or `read.insights.snapshot` to discover valid source IDs.
- As a discovery step in a multi-command plan.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `scope_filter` | `string` | No | Keyword to filter sources by ID or description. Case-insensitive. |

---

## Return Value

```js
{
  sources: [
    { id: "page-context", description: "Current page context. Use to know the active entity." },
    { id: "org-context", description: "Global organization metadata." },
    { id: "user-context", description: "Currently logged-in user profile." }
  ]
}
```

If `scope_filter` is provided:

```js
// scope_filter = "project"
{
  sources: [
    { id: "page-context", description: "Current Project Detail. Use this to know which project is active..." }
  ]
}
```

---

## Implementation

```js
// commands/read/listInsights.action.js
export const action = (args, registry) => {
  if (!registry?.listAllSources) return { sources: [] };

  let sources = registry.listAllSources();

  const scopeFilter = args?.scope_filter;
  if (scopeFilter) {
    sources = sources.filter(
      (source) =>
        source.id.includes(scopeFilter) ||
        (source.description || '').toLowerCase().includes(scopeFilter.toLowerCase()),
    );
  }

  return { sources };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.insights.list',
  label: '/list-sources',
  description: 'List all available data sources (InsightSources)',
  schema: {
    type: 'object',
    properties: {
      scope_filter: { type: 'string', description: 'Optional keyword filter' }
    }
  },
  action: (args) => Read.listInsights(args, registry),
}
```

---

## Registering a Source in a Host Application

```jsx
import { useSommaticContextSource } from 'sommatic-react-sdk';

useSommaticContextSource(
  {
    id: 'org-context',
    description: 'Global organization metadata including name, plan, and settings.',
    getData: () => ({
      id: org.id,
      name: org.name,
      plan: org.plan,
    }),
  },
  [org],
);
```

---

## Notes

- `listAllSources()` returns only sources currently registered (i.e., whose host component is currently mounted).
- Sources registered by unmounted components are automatically cleaned up via their unregister function.
