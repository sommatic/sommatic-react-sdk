# `command_center.read.tasks.detail`

**Label:** `/task-detail`  
**Category:** Read  
**File:** `commands/read/getTaskDetail.action.js`

---

## Purpose

Returns the full details of a specific HITL task, including its status, type, outputs schema, assignments, and any history. Used before claiming or completing a task to understand what it requires.

---

## When to Use

- When the user asks "Tell me about task XYZ" or "What does this task require?"
- Before calling `exec.tasks.complete` to understand the required `outputs` structure.
- After listing tasks with `read.tasks.inbox` to drill into a specific item.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `task_id` | `string` | Yes | The ID of the task to retrieve. |

---

## Return Value

```js
{
  ok: true,
  task: {
    id: "task-abc123",
    title: "Review agent configuration",
    description: "Please review and approve the attached agent configuration before deployment.",
    status: "pending",
    type: "approval",
    outputs_schema: {
      approved: { type: "boolean", required: true },
      comment: { type: "string", required: false }
    },
    assigned_to: "user-xyz",
    created_by: "system",
    created_at: "2026-02-25T20:00:00.000Z",
    updated_at: "2026-02-25T20:05:00.000Z",
    context: {
      agent_id: "agent-001",
      config_version: "v2.1"
    }
  }
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_TASK_ID", message: "task_id is required" } }
{ ok: false, error: { code: "NO_TASK_SERVICE", message: "Task service is not configured" } }
{ ok: false, error: { code: "FETCH_FAILED", message: "..." } }
```

---

## Implementation

```js
// commands/read/getTaskDetail.action.js
export const action = async (args, registry) => {
  const { task_id } = args || {};

  if (!task_id) {
    return { ok: false, error: { code: 'MISSING_TASK_ID', message: 'task_id is required' } };
  }

  const taskStore = registry?.taskService;
  if (!taskStore) {
    return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };
  }

  try {
    const response = await taskStore.get({ queryselector: 'detail', id: task_id });
    const task = response?.result || response;

    return { ok: true, task };
  } catch (err) {
    return { ok: false, error: { code: 'FETCH_FAILED', message: err.message } };
  }
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.tasks.detail',
  label: '/task-detail',
  description: 'Get full details of a specific HITL task',
  schema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: 'ID of the task to retrieve.'
      }
    },
    required: ['task_id']
  },
  action: (args) => Read.getTaskDetail(args, registry),
}
```

---

## Typical Multi-Command Flow

```
1. read.tasks.inbox { status: "pending" }
   → returns task list with IDs

2. read.tasks.detail { task_id: "task-abc123" }
   → returns full task with outputs_schema

3. exec.tasks.claim { task_id: "task-abc123" }
   → assigns task to current user

4. exec.tasks.complete { task_id: "task-abc123", outputs: { approved: true } }
   → marks task as complete
```

---

## Notes

- The `outputs_schema` field (if present) describes what the `outputs` object must contain when calling `exec.tasks.complete`.
- The `context` field contains any additional data the workflow passed to the task — use it to understand the task's business context.
