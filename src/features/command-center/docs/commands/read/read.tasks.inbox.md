# `command_center.read.tasks.inbox`

**Label:** `/tasks-inbox`  
**Category:** Read  
**File:** `commands/read/listTasksInbox.action.js`

---

## Purpose

Lists Human-in-the-Loop (HITL) tasks assigned to the current user. Queries the configured `taskService` for tasks filtered by status.

HITL tasks represent work items that require human validation, approval, or input before an automated workflow can continue.

---

## When to Use

- When the user asks "What tasks do I have pending?" or "Show me my inbox."
- Before executing `exec.tasks.claim`, `exec.tasks.complete`, or `exec.tasks.comment` — to retrieve task IDs.
- For workflow automation: check pending tasks, claim one, then complete it.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `status` | `string` | No | Filter by status: `'pending'`, `'in_progress'`, `'completed'`. If omitted, returns all statuses. |

---

## Return Value

```js
{
  ok: true,
  tasks: [
    {
      id: "task-abc123",
      title: "Review agent configuration",
      status: "pending",
      type: "approval",
      created_at: "2026-02-25T20:00:00.000Z",
      assigned_to: "user-xyz"
    },
    {
      id: "task-def456",
      title: "Validate data source connection",
      status: "in_progress",
      type: "validation",
      created_at: "2026-02-25T18:30:00.000Z"
    }
  ]
}
```

If no tasks match:

```js
{ ok: true, tasks: [] }
```

### Error Cases

```js
{ ok: false, error: { code: "NO_TASK_SERVICE", message: "Task service is not configured" } }
{ ok: false, error: { code: "FETCH_FAILED", message: "Network error: ..." } }
```

---

## Implementation

```js
// commands/read/listTasksInbox.action.js
export const action = async (args, registry) => {
  const { status } = args || {};
  const taskStore = registry?.taskService;

  if (!taskStore) {
    return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };
  }

  try {
    const payload = { queryselector: 'list' };
    if (status) payload.status = status;

    const response = await taskStore.get(payload);
    const tasks = response?.result?.items || response?.items || [];

    return { ok: true, tasks };
  } catch (err) {
    return { ok: false, error: { code: 'FETCH_FAILED', message: err.message } };
  }
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.tasks.inbox',
  label: '/tasks-inbox',
  description: 'List HITL tasks assigned to the current user',
  schema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed'],
        description: 'Filter by task status. Omit for all tasks.'
      }
    }
  },
  action: (args) => Read.listTasksInbox(args, registry),
}
```

---

## Task Service Configuration

Pass a `taskService` object to `CommandCenterProvider`:

```jsx
const taskService = {
  get: async ({ queryselector, status }) => {
    // Your API call
    const data = await myApi.tasks.list({ status });
    return { result: { items: data } };
  },
  update: async ({ id, action, outputs, comment }) => {
    const data = await myApi.tasks.update(id, { action, outputs, comment });
    return { result: data };
  },
};

<CommandCenterProvider taskService={taskService} ...>
```

---

## Notes

- Without `taskService`, all task-related commands return `NO_TASK_SERVICE` errors.
- The response shape is normalized: the action looks for `response?.result?.items` first, then `response?.items`. Adapt your `taskService.get` method accordingly.
- Use `read.tasks.detail` to fetch the full details of a specific task before claiming or completing it.
