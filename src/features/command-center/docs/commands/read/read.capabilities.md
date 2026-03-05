# `command_center.read.capabilities`

**Label:** `/capabilities`  
**Category:** Read  
**File:** `commands/read/getCapabilities.action.js`

---

## Purpose

Reports everything the Command Center can currently do: all registered read commands, exec commands, available InsightSources, and registered surfaces. This is the system's self-description command.

---

## When to Use

- When the user asks "What can you do?" or "What commands are available?"
- For agent self-discovery: when building multi-step plans and the LLM needs to know its own toolset.
- For debugging: to verify all commands are registered correctly.

---

## Arguments

None.

---

## Return Value

```js
{
  capabilities: {
    read_commands: [
      { id: "command_center.read.scope.get", label: "/get-scope", description: "Get current page context" },
      { id: "command_center.read.insights.list", label: "/list-sources", description: "List all available data sources" },
      // ... 16 more read commands
    ],
    exec_commands: [
      { id: "command_center.exec.navigate", label: "/navigate", description: "Navigate to a route" },
      { id: "command_center.exec.clipboard.copy", label: "/copy", description: "Copy text to clipboard" },
      // ... 14 more exec commands
    ],
    sources: [
      { id: "page-context", description: "Current page context." },
      { id: "org-context", description: "Organization metadata." }
    ],
    surfaces: [
      { id: "project-list-grid", type: "grid", label: "Project List" },
      { id: "create-project-form", type: "form", label: "Create Project Form" }
    ]
  }
}
```

---

## Implementation

```js
// commands/read/getCapabilities.action.js
export const action = (registry) => {
  const readCommands = [];
  const execCommands = [];

  const commands = registry?.commands || [];
  for (const cmd of commands) {
    const entry = { id: cmd.id, label: cmd.label, description: cmd.description };
    if (cmd.id.includes('.read.') || cmd.id.includes('.observe.') || cmd.id.includes('.extract.')) {
      readCommands.push(entry);
    } else {
      execCommands.push(entry);
    }
  }

  const sources = registry?.listAllSources?.() || [];

  return {
    capabilities: {
      read_commands: readCommands,
      exec_commands: execCommands,
      sources,
      surfaces: registry?.getSurfaces?.() || [],
    },
  };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.capabilities',
  label: '/capabilities',
  description: 'Report all available commands, sources, and surfaces',
  schema: {},
  action: () => Read.getCapabilities(registry),
}
```

---

## Command Classification Logic

Commands are classified into `read_commands` or `exec_commands` based on ID segments:
- Contains `.read.`, `.observe.`, or `.extract.` → read command
- All others → exec command

This means `command_center.exec.navigate` goes to `exec_commands`, while `command_center.observe.ui` goes to `read_commands`.

---

## Notes

- `sources` and `surfaces` reflect the currently mounted state — unmounted components' registrations are not included.
- The `registry.commands` getter reads from `allCommandsRef.current`, which always reflects the latest set of registered commands (including dynamically registered ones from the Navbar).
- This command is useful for bootstrapping: when the LLM starts a conversation with no prior context, it can call this first to understand its environment.
