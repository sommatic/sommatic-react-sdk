# `command_center.exec.clipboard.copy`

**Label:** `/copy`  
**Category:** Exec  
**File:** `commands/exec/copyToClipboard.action.js`

---

## Purpose

Copies a string of text to the user's clipboard using the browser's Clipboard API. Useful for extracting values from context and making them ready to paste.

---

## When to Use

- When the user asks "Copy the project ID to clipboard."
- When a synthesis response includes a value the user wants to use elsewhere.
- As the final step in a plan: retrieve data → copy a specific field.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `content` | `string` | Yes | The text to copy to the clipboard. |

---

## Return Value

```js
{
  ok: true,
  title: "Copied to clipboard",
  receipt_id: "rcpt_1772075473717_byfawpr"
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_CONTENT", message: "content is required" } }
{ ok: false, error: { code: "CLIPBOARD_UNAVAILABLE", message: "Clipboard API is not available" } }
{ ok: false, error: { code: "COPY_FAILED", message: "Permission denied" } }
```

---

## Implementation

```js
// commands/exec/copyToClipboard.action.js
export const action = async (args, registry) => {
  const { content } = args || {};

  if (!content) return { ok: false, error: { code: 'MISSING_CONTENT', message: 'content is required' } };

  if (!navigator?.clipboard?.writeText) {
    return { ok: false, error: { code: 'CLIPBOARD_UNAVAILABLE', message: 'Clipboard API is not available' } };
  }

  try {
    await navigator.clipboard.writeText(content);
  } catch (err) {
    return { ok: false, error: { code: 'COPY_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.clipboard.copy',
    args,
    reversible: false,
    content,
  });

  return { ok: true, title: 'Copied to clipboard', receipt_id: receipt?.id };
};
```

---

## Command Definition

```js
{
  id: 'command_center.exec.clipboard.copy',
  label: '/copy',
  description: 'Copy text to the clipboard',
  schema: {
    type: 'object',
    properties: {
      content: { type: 'string', description: 'Text to copy to the clipboard.' }
    },
    required: ['content']
  },
  action: (args) => Exec.copyToClipboard(args, registry),
}
```

---

## Notes

- The Clipboard API requires a secure context (HTTPS or localhost). In non-secure contexts, `navigator.clipboard` is `undefined` and the command returns `CLIPBOARD_UNAVAILABLE`.
- The `content` can be any string: an ID, a URL, a JSON snippet, or a full text block extracted from a source snapshot.
- This command is not reversible — there's no meaningful way to "undo" a clipboard copy.
