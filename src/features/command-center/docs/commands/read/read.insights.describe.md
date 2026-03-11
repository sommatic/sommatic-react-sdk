# `command_center.read.insights.describe`

**Label:** `/describe-insight`  
**Category:** Read  
**File:** `commands/read/describeInsight.action.js`

---

## Purpose

Returns the metadata and inferred schema of a specific InsightSource — without fetching its full live payload. This gives the LLM (and the user) a structural picture of what data a source exposes, including field names, data presence indicators, and a description.

---

## When to Use

- When the user asks "What fields does page-context have?" or "Describe the project source."
- As a lightweight alternative to `read.insights.snapshot` when only structure is needed, not live data.
- Before calling `extract.from_insight` to understand what fields are available.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `source_id` | `string` | Yes | The ID of the source to describe. Use `'page-context'` for the active page. |

---

## Return Value

```js
{
  ok: true,
  source: {
    id: "page-context",
    description: "Current Project Detail. Use this to know which project is active...",
    inferred_fields: ["context", "type", "project", "recentChats", "metadata"],
    has_data: true,
    captured_at: 1772075191118
  }
}
```

### Error Cases

```js
// Missing argument
{ ok: false, error: { code: "MISSING_SOURCE_ID", message: "source_id is required" } }

// Source not registered
{ ok: false, error: { code: "SOURCE_NOT_FOUND", message: "Source [xyz] is not registered" } }
```

---

## Implementation

```js
// commands/read/describeInsight.action.js
export const action = (args, registry) => {
  const { source_id } = args || {};

  if (!source_id) {
    return { ok: false, error: { code: 'MISSING_SOURCE_ID', message: 'source_id is required' } };
  }

  const metadata = registry?.getSourceMetadata?.(source_id);
  if (!metadata) {
    return { ok: false, error: { code: 'SOURCE_NOT_FOUND', message: `Source [${source_id}] is not registered` } };
  }

  const snapshot = registry?.getSnapshot?.(source_id);
  const payload = snapshot?.payload;
  const inferred_fields = payload && typeof payload === 'object' ? Object.keys(payload) : [];

  return {
    ok: true,
    source: {
      id: source_id,
      description: metadata.description,
      inferred_fields,
      has_data: !!payload,
      captured_at: snapshot?.capturedAt || null,
    },
  };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.insights.describe',
  label: '/describe-insight',
  description: 'View metadata + schema of an InsightSource',
  schema: {
    type: 'object',
    properties: {
      source_id: {
        type: 'string',
        description: "ID of the InsightSource to describe. Use 'page-context' for the current page."
      }
    },
    required: ['source_id']
  },
  action: (args) => Read.describeInsight(args, registry),
}
```

---

## Notes

- `inferred_fields` is derived by calling `Object.keys()` on the cached snapshot payload. It reflects the top-level keys of whatever `getData()` returned last.
- `has_data: false` means the source is registered but `getSnapshot()` has no cached value yet (e.g., component mounted but no render cycle completed).
- This command does **not** re-fetch data; it reads from the cached snapshot.
