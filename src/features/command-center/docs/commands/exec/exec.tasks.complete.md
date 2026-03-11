# `command_center.exec.tasks.complete`

**Label:** `/complete-task`  
**Category:** Exec  
**File:** `commands/exec/completeTask.action.js`

---

## Purpose

Completes a HITL task by submitting the required outputs. The task transitions to `completed` status and the automated workflow that created it can continue.

---

## When to Use

- When the user has reviewed a task and wants to submit their decision/output.
- As the final step in a HITL workflow: list → claim → complete.
- When the user says "Complete task XYZ with approved: true."

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `task_id` | `string` | Yes | The ID of the task to complete. |
| `outputs` | `object` | Yes | The structured outputs required by the task. Shape defined by `task.outputs_schema`. |

---

## Return Value

```js
{
  ok: true,
  title: "Completed task [task-abc123]",
  data: {
    id: "task-abc123",
    status: "completed",
    outputs: { approved: true, comment: "Looks good." },
    completed_at: "2026-02-25T22:00:00.000Z"
  },
  receipt_id: "rcpt_1772075473717_abc"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_TASK_ID", message: "task_id is required" } }
{ ok: false, error: { code: "MISSING_OUTPUTS", message: "outputs are required to complete a task" } }
{ ok: false, error: { code: "NO_TASK_SERVICE", message: "Task service is not configured" } }
{ ok: false, error: { code: "COMPLETE_FAILED", message: "Task is not in a completable state" } }
```

---

## Implementation

```js
// commands/exec/completeTask.action.js
export const action = async (args, registry) => {
  const { task_id, outputs } = args || {};

  if (!task_id) return { ok: false, error: { code: 'MISSING_TASK_ID', message: 'task_id is required' } };
  if (!outputs) return { ok: false, error: { code: 'MISSING_OUTPUTS', message: 'outputs are required to complete a task' } };

  const taskStore = registry?.taskService;
  if (!taskStore) return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };

  try {
    const response = await taskStore.update({ id: task_id, action: 'complete', outputs });
    const result = response?.result || response;

    const receipt = registry.pushReceipt?.({
      command_id: 'command_center.exec.tasks.complete',
      args,
      reversible: false,
      result,
    });

    return { ok: true, title: `Completed task [${task_id}]`, data: result, receipt_id: receipt?.id };
  } catch (err) {
    return { ok: false, error: { code: 'COMPLETE_FAILED', message: err.message } };
  }
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.tasks.complete',
  label: '/complete-task',
  description: 'Complete a HITL task with the provided outputs',
  schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string', description: 'ID of the task to complete.' },
      outputs: {
        type: 'object',
        description: 'Task outputs. Structure defined by task outputs_schema. Use read.tasks.detail to inspect requirements.'
      }
    },
    required: ['task_id', 'outputs']
  },
  action: (args) => Exec.completeTask(args, registry),
}
```

---

## Task Service Contract

The `taskService.update` method receives:

```js
{ id: "task-abc123", action: "complete", outputs: { approved: true } }
```

---

## Typical Full HITL Flow

```
1. read.tasks.inbox { status: "pending" }
   → [{ id: "task-abc123", title: "Review agent config" }]

2. read.tasks.detail { task_id: "task-abc123" }
   → { outputs_schema: { approved: { type: "boolean" } } }

3. exec.tasks.claim { task_id: "task-abc123" }

4. exec.tasks.complete { task_id: "task-abc123", outputs: { approved: true, comment: "OK" } }
```
