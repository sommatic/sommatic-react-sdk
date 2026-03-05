# `command_center.extract.from_insight`

**Label:** `/extract-insight`  
**Category:** Read (Extract)  
**File:** `commands/read/extractFromInsight.action.js`

---

## Purpose

Extracts specific fields from a source's live data snapshot. Rather than returning the full payload (as `read.insights.snapshot` does), this command plucks only the requested fields, producing a cleaner, smaller result for the synthesis LLM.

---

## When to Use

- When the LLM only needs specific fields from a source, not the full payload.
- To reduce synthesis context size when the source payload is large.
- When the user asks for a specific attribute: "What's the current project's status?" → extract `project.status` from `page-context`.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `source_id` | `string` | Yes | The ID of the source to extract from. |
| `fields` | `string[]` | No | Dot-notation paths to extract (e.g., `["project.name", "project.status"]`). If omitted, returns all top-level keys. |

---

## Return Value

```js
{
  ok: true,
  source_id: "page-context",
  data: {
    "project.name": "Development",
    "project.status": "active"
  }
}
```

If `fields` is not provided:

```js
{
  ok: true,
  source_id: "page-context",
  data: {
    context: "...",
    type: "project-detail",
    project: { /* full object */ },
    recentChats: [ /* ... */ ],
    metadata: { isLoading: false }
  }
}
```

### Error Cases

```js
{ ok: false, error: { code: "MISSING_SOURCE_ID", message: "source_id is required" } }
{ ok: false, error: { code: "SOURCE_NOT_FOUND", message: "Source [xyz] is not registered" } }
{ ok: false, error: { code: "NO_DATA", message: "Source [page-context] has no data yet" } }
```

---

## Implementation

```js
// commands/read/extractFromInsight.action.js

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
};

export const action = (args, registry) => {
  const { source_id, fields } = args || {};

  if (!source_id) {
    return { ok: false, error: { code: 'MISSING_SOURCE_ID', message: 'source_id is required' } };
  }

  const metadata = registry?.getSourceMetadata?.(source_id);
  if (!metadata) {
    return { ok: false, error: { code: 'SOURCE_NOT_FOUND', message: `Source [${source_id}] is not registered` } };
  }

  const snapshot = registry?.getSnapshot?.(source_id);
  if (!snapshot?.payload) {
    return { ok: false, error: { code: 'NO_DATA', message: `Source [${source_id}] has no data yet` } };
  }

  const payload = snapshot.payload;

  if (!Array.isArray(fields) || fields.length === 0) {
    return { ok: true, source_id, data: payload };
  }

  const data = {};
  for (const field of fields) {
    data[field] = getNestedValue(payload, field);
  }

  return { ok: true, source_id, data };
};
```

---

## Command Definition

```js
{
  id: 'command_center.extract.from_insight',
  label: '/extract-insight',
  description: 'Extract specific fields from an InsightSource snapshot',
  schema: {
    type: 'object',
    properties: {
      source_id: {
        type: 'string',
        description: "ID of the source. Use 'page-context' for the current page."
      },
      fields: {
        type: 'array',
        items: { type: 'string' },
        description: "Dot-notation paths to extract (e.g. 'project.name', 'metadata.isLoading'). Omit for all top-level keys."
      }
    },
    required: ['source_id']
  },
  action: (args) => Read.extractFromInsight(args, registry),
}
```

---

## Notes

- Dot-notation traversal supports two levels: `"project.name"` → `payload.project.name`.
- Fields that don't exist in the payload return `undefined` for that key.
- Using `fields` is highly recommended when the source payload is large, as it significantly reduces the data passed to the synthesis LLM.
