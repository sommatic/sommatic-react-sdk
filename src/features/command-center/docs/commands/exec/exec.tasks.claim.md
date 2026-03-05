# `command_center.exec.tasks.claim`

**Label:** `/claim-task`  
**Category:** Exec  
**File:** `commands/exec/claimTask.action.js`

---

## Purpose

Takes ownership of a HITL task by assigning it to the current user. After claiming, the task transitions to `in_progress` status and is locked to the claiming user.

---

## When to Use

- When the user says "Claim task XYZ" or "Assign this task to me."
- As the second step in a HITL workflow: list inbox → claim a task → complete it.
- Before calling `exec.tasks.complete` — only claimed tasks can be completed.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `task_id` | `string` | Yes | The ID of the task to claim. |

---

## Return Value

```js
{
  ok: true,
  title: "Claimed task [task-abc123]",
  data: {
    id: "task-abc123",
    status: "in_progress",
    assigned_to: "user-xyz",
    claimed_at: "2026-02-25T21:00:00.000Z"
  },
  receipt_id: "rcpt_1772075473717_abc"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_TASK_ID", message: "task_id is required" } }
{ ok: false, error: { code: "NO_TASK_SERVICE", message: "Task service is not configured" } }
{ ok: false, error: { code: "CLAIM_FAILED", message: "Task is already claimed by another user" } }
```

---

## Implementation

```js
// commands/exec/claimTask.action.js
export const action = async (args, registry) => {
  const { task_id } = args || {};

  if (!task_id) return { ok: false, error: { code: 'MISSING_TASK_ID', message: 'task_id is required' } };

  const taskStore = registry?.taskService;
  if (!taskStore) return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };

  try {
    const response = await taskStore.update({ id: task_id, action: 'claim' });
    const result = response?.result || response;

    const receipt = registry.pushReceipt?.({
      command_id: 'command_center.exec.tasks.claim',
      args,
      reversible: false,
      result,
    });

    return { ok: true, title: `Claimed task [${task_id}]`, data: result, receipt_id: receipt?.id };
  } catch (err) {
    return { ok: false, error: { code: 'CLAIM_FAILED', message: err.message } };
  }
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.tasks.claim',
  label: '/claim-task',
  description: 'Claim a HITL task and assign it to the current user',
  schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string', description: 'ID of the task to claim.' }
    },
    required: ['task_id']
  },
  action: (args) => Exec.claimTask(args, registry),
}
```

---

## Task Service Contract

The `taskService.update` method receives:

```js
{ id: "task-abc123", action: "claim" }
```

It should return:

```js
{ result: { id, status, assigned_to, ... } }
// or directly: { id, status, assigned_to, ... }
```

---

## Notes

- Claiming is irreversible in most workflows — there is no undo for a task claim.
- If the task service returns an error (e.g., task already claimed), the error message is surfaced as `CLAIM_FAILED`.
