# `command_center.exec.command.invoke`

**Label:** `/invoke-command`  
**Category:** Exec  
**File:** `commands/exec/invokeCommand.action.js`

---

## Purpose

Executes another registered Command Center command by ID. This is a meta-command — it allows the LLM to chain or re-execute commands programmatically, or for feature modules to publish semantic commands that other parts of the system can call.

---

## When to Use

- When a feature module publishes a high-level command (e.g., `project.refresh`, `org.reload`) that another command or automation flow needs to call.
- For dynamic composition: the LLM knows a command ID from context and needs to invoke it without knowing its implementation.
- For testing: invoking a command by name from another command.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `command_id` | `string` | Yes | The full ID of the command to invoke. |
| `args` | `object` | No | Arguments to pass to the invoked command's action. |

---

## Return Value

```js
{
  ok: true,
  title: "Invoked command [command_center.read.page.outline]",
  result: { /* whatever the invoked command returned */ },
  receipt_id: "rcpt_1772075473717_abc"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_COMMAND_ID", message: "command_id is required" } }
{ ok: false, error: { code: "COMMAND_NOT_FOUND", message: "Command [xyz] not found" } }
{ ok: false, error: { code: "NO_ACTION", message: "Command [xyz] has no action defined" } }
{ ok: false, error: { code: "INVOKE_FAILED", message: "Command threw: ..." } }
```

---

## Implementation

```js
// commands/exec/invokeCommand.action.js
export const action = async (args, registry) => {
  const { command_id, args: commandArgs } = args || {};

  if (!command_id) return { ok: false, error: { code: 'MISSING_COMMAND_ID', message: 'command_id is required' } };

  const commands = registry?.commands || [];
  const cmdDef = commands.find((cmd) => cmd.id === command_id);

  if (!cmdDef) return { ok: false, error: { code: 'COMMAND_NOT_FOUND', message: `Command [${command_id}] not found` } };
  if (!cmdDef.action) return { ok: false, error: { code: 'NO_ACTION', message: `Command [${command_id}] has no action` } };

  let result;
  try {
    result = await cmdDef.action(commandArgs);
  } catch (err) {
    return { ok: false, error: { code: 'INVOKE_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.command.invoke',
    args,
    reversible: false,
    invoked_command: command_id,
    result,
  });

  return { ok: true, title: `Invoked command [${command_id}]`, result, receipt_id: receipt?.id };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.command.invoke',
  label: '/invoke-command',
  description: 'Execute a registered command by ID',
  schema: {
    type: 'object',
    properties: {
      command_id: {
        type: 'string',
        description: 'Full ID of the command to invoke (e.g. "command_center.read.capabilities").'
      },
      args: {
        type: 'object',
        description: 'Arguments to pass to the invoked command.'
      }
    },
    required: ['command_id']
  },
  action: (args) => Exec.invokeCommand(args, registry),
}
```

---

## Notes

- This command uses `registry.commands` (which reads from `allCommandsRef.current`) to find the target command. Both static and dynamically registered commands are accessible.
- Avoid circular invocations (a command invoking itself via this mechanism).
- The invoked command's action is called directly with `commandArgs` — it does not go through the LLM routing pipeline again.
