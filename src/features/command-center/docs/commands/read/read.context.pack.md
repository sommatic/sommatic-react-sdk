# `command_center.read.context.pack`

**Label:** `/pack-context`  
**Category:** Read  
**File:** `commands/read/contextPack.action.js`

---

## Purpose

Bundles the live data payloads of multiple InsightSources into a single aggregated object. This is useful when a user query requires context from more than one source at once.

---

## When to Use

- When the LLM needs to combine data from multiple sources to answer a question.
- As a single-step alternative to multiple `read.insights.snapshot` calls.
- When building a comprehensive context package before a synthesis pass or an exec command.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `source_ids` | `string[]` | No | Array of source IDs to include. If omitted, all registered sources are packed. |

---

## Return Value

```js
{
  ok: true,
  context: {
    "page-context": {
      type: "project-detail",
      project: { id: "prj-...", name: "Development", status: "active" },
      metadata: { isLoading: false }
    },
    "org-context": {
      id: "org-232121",
      name: "Blackwood",
      plan: "enterprise"
    }
  },
  included: ["page-context", "org-context"],
  missing: []
}
```

If some sources have no data:

```js
{
  ok: true,
  context: { "page-context": { /* ... */ } },
  included: ["page-context"],
  missing: ["org-context"]   // Registered but no cached data yet
}
```

### Error Cases

```js
{ ok: false, error: { code: "NO_SOURCES", message: "No sources available to pack" } }
```

---

## Implementation

```js
// commands/read/contextPack.action.js
export const action = (args, registry) => {
  let sourceIds = args?.source_ids;

  if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
    const allSources = registry?.listAllSources?.() || [];
    sourceIds = allSources.map((s) => s.id);
  }

  if (sourceIds.length === 0) {
    return { ok: false, error: { code: 'NO_SOURCES', message: 'No sources available to pack' } };
  }

  const context = {};
  const included = [];
  const missing = [];

  for (const id of sourceIds) {
    const snapshot = registry?.getSnapshot?.(id);
    if (snapshot?.payload) {
      context[id] = snapshot.payload;
      included.push(id);
    } else {
      missing.push(id);
    }
  }

  return { ok: true, context, included, missing };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.context.pack',
  label: '/pack-context',
  description: 'Bundle multiple InsightSource payloads into a single context object',
  schema: {
    type: 'object',
    properties: {
      source_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Source IDs to bundle. Omit to include all registered sources.'
      }
    }
  },
  action: (args) => Read.contextPack(args, registry),
}
```

---

## Notes

- When `source_ids` is omitted, every registered source is included. This can produce very large payloads — use with caution with synthesis LLMs that have limited context windows.
- The synthesis context truncation in `CognitiveEntryManager` will trim this if needed.
- Use `read.insights.list` first to discover available source IDs, then call this command with a curated list.
