# `command_center.read.scope.get`

**Label:** `/get-scope`  
**Category:** Read  
**File:** `commands/read/getCurrentScope.action.js`

---

## Purpose

Returns the current page context snapshot. It retrieves whatever data the active page component has registered under the `page-context` InsightSource.

This is the simplest read command — it directly returns the context object without any filtering or transformation.

---

## When to Use

- When the user asks "what page am I on?" or "what is the current context?"
- As a first step in a multi-command plan to establish the current scope before more specific lookups.
- When the LLM needs to know the active entity (e.g., which project is open) before executing an action.

---

## Arguments

This command takes no user-facing arguments.

Internally it receives the page context object directly from `getContext('page-context')`, not from the `registry`. This is the only command that receives raw context instead of the registry.

---

## Return Value

Returns whatever `getData()` returns from the `page-context` InsightSource.

```js
// Example return value on a project detail page
{
  context: "This page displays the detailed view of a specific project...",
  type: "project-detail",
  project: {
    id: "prj-management-cc48809102397ed",
    name: "Development",
    status: "active",
    organization: "org-232121"
  },
  recentChats: [
    { id: "c-198763...", title: "Test chat", created: { timestamp: "1769607887018" } }
  ],
  metadata: { isLoading: false, error: false }
}
```

On a list page:

```js
{
  type: "project-list",
  items: [
    { id: "prj-management-...", name: "MyProject", status: "active", slug: "my-project" }
  ],
  pagination: { page: 0, limit: 10, total: 42 },
  metadata: { isLoading: false }
}
```

---

## Implementation

```js
// commands/read/getCurrentScope.action.js
export const action = (context) => {
  return context;
};
```

The `context` argument is injected by the command dispatcher from `getContext('page-context')` before the action is called.

---

## Command Definition

```js
// commands/definitions.js
{
  id: 'command_center.read.scope.get',
  label: '/get-scope',
  description: 'Get current page context',
  schema: {},
  action: () => Read.getCurrentScope(getContext('page-context')),
}
```

---

## Implementing the Context Source in a Host Application

Any page that wants to be discoverable by `read.scope.get` must register a `page-context` source:

```jsx
import { useSommaticContextSource } from 'sommatic-react-sdk';

useSommaticContextSource(
  {
    id: 'page-context',
    description: 'Current page description visible to the Command Center.',
    getData: () => ({
      type: 'my-entity-detail',
      entity: { id: entity.id, name: entity.name },
      metadata: { isLoading },
    }),
  },
  [entity, isLoading],
);
```

---

## Notes

- Only one component should register `page-context` at a time. React Router's mount/unmount lifecycle naturally ensures this, since only the active route's components are mounted.
- If no component has registered `page-context`, the return value will be `null` or `undefined`.
