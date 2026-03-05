# `command_center.read.debug.execution_log`

**Label:** `/execution-log`  
**Category:** Read (Debug)  
**File:** `commands/read/debugExecutionLog.action.js`

---

## Purpose

Returns the recent history of command executions — which commands were run, with what arguments, and what results they produced. This gives a complete audit trail of all actions the Command Center has taken.

---

## When to Use

- When the user asks "What commands have been executed?" or "Show me the execution history."
- For debugging: to verify a previous command ran successfully and inspect its output.
- For auditing: to review all actions taken in a session.

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
      command_id: "command_center.read.insights.describe",
      args: { source_id: "page-context" },
      status: "success",
      result: {
        ok: true,
        source: {
          id: "page-context",
          description: "Current Project Detail...",
          inferred_fields: ["context", "type", "project", "recentChats", "metadata"],
          has_data: true,
          captured_at: 1772075191118
        }
      },
      timestamp: 1772075191118
    },
    {
      command_id: "command_center.exec.clipboard.copy",
      args: { content: "hello world" },
      status: "success",
      result: { ok: true, title: "Copied to clipboard", receipt_id: "rcpt_1772075473717_byfawpr" },
      timestamp: 1772075473717
    }
  ]
}
```

---

## Implementation

```js
// commands/read/debugExecutionLog.action.js
export const action = (args, registry) => {
  const limit = args?.limit || 10;
  const entries = registry?.getExecutionLog?.(limit) || [];
  return { entries };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.debug.execution_log',
  label: '/execution-log',
  description: 'Show recent command execution history and results',
  schema: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max entries to return (default: 10)' }
    }
  },
  action: (args) => Read.debugExecutionLog(args, registry),
}
```

---

## How the Log Is Populated

Each time a command executes, `executePlan` calls:

```js
registry.pushDebugEntry('execution', {
  command_id: step.command_id,
  args: step.args,
  status: result ? 'success' : 'error',
  result,
  timestamp: Date.now(),
});
```

---

## Synthesis Behavior with Large Logs

The execution log can produce very large JSON payloads (thousands of characters), especially when previous results include full source snapshots. The synthesis context pipeline handles this via:

1. **Per-result truncation:** Results over 4,000 chars are replaced with `[truncated — N chars. Summary: ...]`.
2. **Total cap:** If the combined context exceeds 12,000 chars, additional entries are dropped.

This prevents the synthesis LLM from hitting context window limits while still providing useful summaries.

---

## Notes

- The log is **in-memory only** and lost on page refresh.
- The `status` field is `"success"` or `"error"`. Check `result.ok` for command-level success/failure details.
- To limit noise, use `limit: 5` or lower for synthesis calls; use higher values for manual debugging sessions.
