# `command_center.read.insights.snapshot`

**Label:** `/snapshot-insight`  
**Category:** Read  
**File:** `commands/read/snapshotInsight.action.js`

---

## Purpose

Returns the **live data payload** of a specific InsightSource. Unlike `read.insights.describe` (which only returns metadata), this command returns the actual data the component is currently exposing.

Snapshots are TTL-cached (default: 30 seconds) to avoid triggering unnecessary re-renders.

---

## When to Use

- When the user asks for the actual current data from a source: "Show me the current project details."
- As a data-gathering step before synthesis or analysis.
- When the LLM needs to pass specific values (like IDs or names) to a subsequent exec command.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `source_id` | `string` | Yes | The ID of the InsightSource to snapshot. |

---

## Return Value

```js
{
  ok: true,
  source_id: "page-context",
  payload: {
    context: "This page displays the detailed view of a specific project.",
    type: "project-detail",
    project: {
      id: "prj-management-cc48809102397ed",
      name: "Development",
      status: "active",
      organization: "org-232121",
      ui: { emoji: { icon: "Code", color: "#4CAF50" }, theme: {} }
    },
    recentChats: [
      { id: "c-198763...", title: "Test chat", created: { timestamp: "1769607887018" } }
    ],
    metadata: { isLoading: false, error: false }
  },
  captured_at: 1772075191118
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
// commands/read/snapshotInsight.action.js
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
  if (!snapshot?.payload) {
    return { ok: false, error: { code: 'NO_DATA', message: `Source [${source_id}] has no data yet` } };
  }

  return {
    ok: true,
    source_id,
    payload: snapshot.payload,
    captured_at: snapshot.capturedAt,
  };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.insights.snapshot',
  label: '/snapshot-insight',
  description: 'Retrieve live data payload from an InsightSource',
  schema: {
    type: 'object',
    properties: {
      source_id: {
        type: 'string',
        description: "ID of the source. Use 'page-context' for current page data."
      }
    },
    required: ['source_id']
  },
  action: (args) => Read.snapshotInsight(args, registry),
}
```

---

## Snapshot Caching

The `getSnapshot(source_id)` call reads from a TTL cache. The cache is populated every time the host component re-renders and the `useSommaticContextSource` hook fires. This means:

- Data is always at most 30 seconds stale (configurable TTL).
- Calling this command multiple times quickly returns the same snapshot.
- No extra network calls are made — this is purely in-memory.

---

## Notes

- Use `read.insights.describe` first when you only need field names, not values. It's cheaper in terms of synthesis context consumption.
- For bundling multiple snapshots into a single payload, use `read.context.pack`.
