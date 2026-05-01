# `command_center.exec.tasks.create`

**Label:** `/create-task`  
**Category:** Exec  
**File:** `commands/exec/createTask.action.js`

---

## Purpose

Creates a brand new Human-in-the-Loop task. Use this when an agent or operator needs to delegate a contractual decision (approval, data completion, review, resolution, delegation) to a person or group.

Tasks created here behave like any other HITL task: they appear in `/tasks-inbox`, can be claimed, commented on, transitioned, and completed.

---

## When to Use

- When the user wants to formally hand off work that requires human judgment.
- When the user says "create a task to approve this", "delegate this to ops", "queue a review for finance".
- As the spawn step in a workflow that needs a human gate before proceeding.

Do NOT use this for transient notifications or for self-assigned reminders that don't need an audit trail — tasks are contractual, not casual.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | `string` | Yes | Short task title (the goal). Shown in inboxes and notifications. |
| `type` | `object` | Yes | Task type with `id` and `name`. One of: `approval`, `data_completion`, `review`, `resolution`, `delegation`. |
| `priority` | `object` | Yes | Priority with `id` and `name`. One of: `low`, `medium`, `high`, `critical`. |
| `required_output` | `object` | Yes | Definition of what the human must produce. Has a JSON `schema` and an optional `ui_hint`. |
| `assignee` | `object` | No | Assignee with `assignee_type: 'user' \| 'group'` and the matching `user` or `group` reference. Omitted assignee means an unclaimed task. |
| `sla` | `object` | No | SLA with `due_at` (Unix-ms timestamp string) and `sla_ms` (duration in ms). |
| `payload` | `object` | No | Context payload with `summary`, `evidence[]`, and `linked_entities[]` to give the assignee enough information to act. |

---

## Return Value

```js
{
  ok: true,
  title: "Created task [task-abc123]",
  data: {
    id: "task-abc123",
    title: "Review onboarding evidence",
    status: "pending",
    type: { id: "review", name: "Review" },
    priority: { id: "high", name: "High" },
    organization_id: "org-xyz",
    created_at: "2026-05-01T10:00:00.000Z"
  },
  receipt_id: "rcpt_1772075473717_create"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_ARGS", message: "title, type, priority and required_output are required" } }
{ ok: false, error: { code: "NO_TASK_SERVICE", message: "Task service is not configured" } }
{ ok: false, error: { code: "CREATE_FAILED", message: "<service error>" } }
```

The receipt is **not** reversible — you cannot `/undo` a task creation. Cancel via `/task-transition { transition_name: 'invalidate' }` if needed.

---

## Implementation

```js
// commands/exec/createTask.action.js
export const action = async (args, registry) => {
  const { title, type, priority, required_output, assignee, sla, payload } = args || {};

  if (!title || !type || !priority || !required_output) {
    return { ok: false, error: { code: 'MISSING_ARGS', message: 'title, type, priority and required_output are required' } };
  }

  const taskStore = registry?.taskService;
  if (!taskStore) {
    return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };
  }

  try {
    const organization_id = registry?.currentUser?.payload?.organization_id || '';
    const response = await taskStore.create({ title, type, priority, required_output, assignee, sla, payload, organization_id });
    const result = response?.result || response;

    const receipt = registry.pushReceipt?.({
      command_id: 'command_center.exec.tasks.create',
      args,
      reversible: false,
      result,
    });

    return { ok: true, title: `Created task [${result?.id}]`, data: result, receipt_id: receipt?.id };
  } catch (err) {
    return { ok: false, error: { code: 'CREATE_FAILED', message: err.message } };
  }
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.tasks.create',
  label: '/create-task',
  description: 'Create a new HITL Task',
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Short task title (the goal).' },
      type: { type: 'object', description: 'Task type object with id and name (approval, data_completion, review, resolution, delegation).' },
      priority: { type: 'object', description: 'Task priority object with id and name (low, medium, high, critical).' },
      required_output: { type: 'object', description: 'Required output definition with schema and optional ui_hint.' },
      assignee: { type: 'object', description: 'Optional. Assignee object with assignee_type (user|group) and user or group reference.' },
      sla: { type: 'object', description: 'Optional. SLA object with due_at (Unix ms string) and sla_ms (duration in ms).' },
      payload: { type: 'object', description: 'Optional. Context payload with summary, evidence[] and linked_entities[].' }
    },
    required: ['title', 'type', 'priority', 'required_output']
  },
  action: (args) => Exec.createTask(args, registry),
}
```

---

## Task Service Contract

The `taskService.create` method receives:

```js
{
  title: "Review onboarding evidence",
  type: { id: "review", name: "Review" },
  priority: { id: "high", name: "High" },
  required_output: {
    schema: { type: 'object', properties: { approved: { type: 'boolean' } }, required: ['approved'] },
    ui_hint: 'checkbox',
  },
  assignee: { assignee_type: 'user', user: { id: 'user-12345' } },
  sla: { due_at: '1772075473717', sla_ms: 86400000 },
  payload: {
    summary: 'Review the latest onboarding evidence batch',
    evidence: [{ url: '...', kind: 'document' }],
    linked_entities: [{ type: 'organization', id: 'org-xyz' }],
  },
  organization_id: "org-xyz",
}
```

The `organization_id` is auto-attached from `registry.currentUser.payload.organization_id` — do not require the LLM to provide it.

---

## Typical Flow

```
1. exec.tasks.create {
     title: "Approve refund #4421",
     type: { id: "approval", name: "Approval" },
     priority: { id: "high", name: "High" },
     required_output: { schema: { type: 'object', properties: { approved: { type: 'boolean' } } } },
     assignee: { assignee_type: 'group', group: { id: 'finance-leads' } }
   }
   → { id: "task-9988", status: "pending" }

2. (later) read.tasks.inbox { status: "pending" }
   → [{ id: "task-9988", title: "Approve refund #4421" }]

3. exec.tasks.claim { task_id: "task-9988" }

4. exec.tasks.complete { task_id: "task-9988", outputs: { approved: true } }
```

---

## See Also

- `read.tasks.inbox.md` — list assigned tasks
- `read.tasks.detail.md` — inspect required-output schema
- `exec.tasks.claim.md` — take ownership
- `exec.tasks.complete.md` — submit outputs
- `exec.tasks.transition.md` — apply lifecycle transitions
- [docs/command-center/changelog-recent.en.md](../../../../../docs/command-center/changelog-recent.en.md) — full HITL command set overview
