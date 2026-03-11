# `command_center.exec.navigate`

**Label:** `/navigate`  
**Category:** Exec  
**File:** `commands/exec/navigate.action.js`

---

## Purpose

Navigates the application to a specified route using React Router's `navigate` function. The command waits 1.5 seconds after navigation to allow the new page to mount before the next plan step executes.

---

## When to Use

- When the user says "Go to the projects page" or "Open agent profiles."
- As the first step in a plan that needs to navigate before reading page context.
- For deep-linking: "Navigate to project XYZ's detail page."

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `route` | `string` | Yes | The absolute path to navigate to (e.g., `/admin/projects`). |

---

## Return Value

```js
{
  success: true,
  message: "Navigating to /admin/project/management"
}
```

If route not provided:

```js
{ success: false, message: "Route not provided" }
```

---

## Implementation

```js
// commands/exec/navigate.action.js
export const action = async ({ route }, navigate) => {
  if (route) {
    navigate(route);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { success: true, message: `Navigating to ${route}` };
  }
  return { success: false, message: 'Route not provided' };
};
```

The `navigate` function is injected at command registration time (not via registry):

```js
// In getExecCommands({ navigate, routeMap, ... })
{
  id: 'command_center.exec.navigate',
  action: (args) => Exec.navigate(args, navigate),  // navigate is closed over
}
```

---

## Command Definition

```js
{
  id: 'command_center.exec.navigate',
  label: '/navigate',
  description: 'Navigate to a specific route in the application',
  schema: {
    type: 'object',
    properties: {
      route: {
        type: 'string',
        description: "Absolute route path (e.g. '/admin/projects', '/admin/agent-profiles'). Use routeMap for known routes."
      }
    },
    required: ['route']
  },
  action: (args) => Exec.navigate(args, navigate),
}
```

---

## Route Map Integration

The `routeMap` constant passed to `getExecCommands` can be included in the command's description to help the LLM know valid routes:

```js
// In definitions.js or via schema description:
description: `Navigate to a route. Known routes: ${Object.entries(ROUTE_MAP).map(([k,v]) => `${k}: ${v}`).join(', ')}`
```

---

## Notes

- The 1.5-second wait after navigation is intentional — it gives the new page time to mount its `useSommaticContextSource` and `useSommaticSurface` hooks before the next command in the plan executes.
- If a subsequent plan step needs page-context data from the new page, the 1.5s delay is usually sufficient, but highly dynamic pages (e.g., those with async data fetching) may still have `isLoading: true` when snapshotted.
- This command uses `navigate` from React Router's `useNavigate` hook, which must be available in the scope where `getExecCommands` is called (i.e., a component inside `<Router>`).
