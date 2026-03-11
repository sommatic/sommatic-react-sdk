# `command_center.read.debug.router_log`

**Label:** `/router-log`  
**Category:** Read (Debug)  
**File:** `commands/read/debugRouterLog.action.js`

---

## Purpose

Returns the recent history of router LLM decisions — what plans the router generated for each user message, including the thought process, selected commands, and provider used.

This is primarily a debugging and observability tool.

---

## When to Use

- When investigating why the LLM chose certain commands for a previous query.
- When the user asks "What decisions has the agent made?" or "Show me the agent's reasoning."
- For system monitoring and audit trails in development.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `limit` | `number` | No | Maximum number of entries to return. Defaults to `10`. |

---

## Return Value

```js
{
  entries: [
    {
      user_prompt: "Describe the page-context source",
      plan: [
        {
          command_id: "command_center.read.insights.describe",
          reason: "User wants to see the metadata of the page-context source.",
          args: { source_id: "page-context" }
        }
      ],
      thought: "The user requests information about 'page-context'. I will describe it using the insights.describe command.",
      provider_id: "wf-llm-provider-3be6659683c4065",
      timestamp: 1772075190507
    },
    // ... more entries
  ]
}
```

---

## Implementation

```js
// commands/read/debugRouterLog.action.js
export const action = (args, registry) => {
  const limit = args?.limit || 10;
  const entries = registry?.getRouterLog?.(limit) || [];
  return { entries };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.debug.router_log',
  label: '/router-log',
  description: "Show recent router LLM decisions and execution plans",
  schema: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max entries to return (default: 10)' }
    }
  },
  action: (args) => Read.debugRouterLog(args, registry),
}
```

---

## How the Log Is Populated

Each time a user message is processed, the `classifyIntent` function (in `useCommandCenterAgent`) calls `pushDebugEntry('router', entry)` after receiving a successful plan response:

```js
registry.pushDebugEntry('router', {
  user_prompt: userMessage,
  plan: response.execution_plan,
  thought: response.thought,
  provider_id: response.provider_id,
  timestamp: Date.now(),
});
```

The log is stored in a bounded in-memory array (typically last N entries).

---

## Notes

- The log is **in-memory only** and is lost on page refresh.
- Each entry corresponds to one user message → router LLM call cycle.
- Useful for comparing how the same query was interpreted across different LLM providers.
- The `thought` field contains the LLM's chain-of-thought reasoning before generating the plan — this is the most useful debugging field.
