# `command_center.exec.tasks.comment`

**Label:** `/comment-task`  
**Category:** Exec  
**File:** `commands/exec/commentTask.action.js`

---

## Purpose

Adds a text comment to a HITL task without changing its status. Comments provide a lightweight audit trail and allow users to document their reasoning, ask questions, or leave notes for other reviewers.

---

## When to Use

- When the user wants to annotate a task: "Add a note to task XYZ saying 'Needs review from legal.'"
- For async collaboration: leaving feedback on a task before handing it off.
- As an alternative to completing a task when the user needs more information first.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `task_id` | `string` | Yes | The ID of the task to comment on. |
| `comment` | `string` | Yes | The comment text. Must be non-empty. |

---

## Return Value

```js
{
  ok: true,
  title: "Added comment to task [task-abc123]",
  data: {
    id: "task-abc123",
    comment_id: "comment-xyz",
    text: "Needs review from legal team.",
    created_at: "2026-02-25T22:30:00.000Z",
    created_by: "user-xyz"
  },
  receipt_id: "rcpt_1772075473717_abc"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_TASK_ID", message: "task_id is required" } }
{ ok: false, error: { code: "MISSING_COMMENT", message: "A non-empty comment is required" } }
{ ok: false, error: { code: "NO_TASK_SERVICE", message: "Task service is not configured" } }
{ ok: false, error: { code: "COMMENT_FAILED", message: "..." } }
```

---

## Implementation

```js
// commands/exec/commentTask.action.js
export const action = async (args, registry) => {
  const { task_id, comment } = args || {};

  if (!task_id) return { ok: false, error: { code: 'MISSING_TASK_ID', message: 'task_id is required' } };

  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    return { ok: false, error: { code: 'MISSING_COMMENT', message: 'A non-empty comment is required' } };
  }

  const taskStore = registry?.taskService;
  if (!taskStore) return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };

  try {
    const response = await taskStore.update({ id: task_id, action: 'comment', comment: comment.trim() });
    const result = response?.result || response;

    const receipt = registry.pushReceipt?.({
      command_id: 'command_center.exec.tasks.comment',
      args: { task_id, comment: comment.trim() },
      reversible: false,
      result,
    });

    return { ok: true, title: `Added comment to task [${task_id}]`, data: result, receipt_id: receipt?.id };
  } catch (err) {
    return { ok: false, error: { code: 'COMMENT_FAILED', message: err.message } };
  }
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.tasks.comment',
  label: '/comment-task',
  description: 'Add a comment to a HITL task',
  schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string', description: 'ID of the task to comment on.' },
      comment: { type: 'string', description: 'Comment text to add. Must be non-empty.' }
    },
    required: ['task_id', 'comment']
  },
  action: (args) => Exec.commentTask(args, registry),
}
```

---

## Task Service Contract

The `taskService.update` method receives:

```js
{ id: "task-abc123", action: "comment", comment: "Needs review from legal team." }
```

---

## Notes

- Comments do not change task status. A task can be commented on regardless of whether it's `pending`, `in_progress`, or `completed`.
- The comment is trimmed of leading/trailing whitespace before being sent to the service.
- This command is not reversible — comments cannot be deleted via the Command Center.
