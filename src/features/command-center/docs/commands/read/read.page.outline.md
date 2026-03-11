# `command_center.read.page.outline`

**Label:** `/page-outline`  
**Category:** Read  
**File:** `commands/read/getPageOutline.action.js`

---

## Purpose

Returns a comprehensive description of the current page: the route, page context payload, and all registered InsightSources with their descriptions and payload keys. Acts as the most complete single snapshot of "where the user is and what's available."

---

## When to Use

- When the user asks "What is on this page?" or "Explain what I'm looking at."
- As the first step in any multi-command plan where the LLM needs full situational awareness.
- For debugging: to see what sources are registered and whether they have data.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `detail_level` | `string` | No | `"high"` for full payload in sources, `"low"` for keys only. Defaults to `"low"`. |

---

## Return Value

```js
{
  route: "/admin/project/management/prj-management-cc48809102397ed",
  page_context: {
    context: "This page displays the detailed view of a specific project...",
    type: "project-detail",
    project: {
      id: "prj-management-cc48809102397ed",
      name: "Development",
      status: "active",
      organization: "org-232121",
      ui: { emoji: { icon: "Code", color: "#4CAF50" } }
    },
    recentChats: [ /* ... */ ],
    metadata: { isLoading: false, error: false }
  },
  sources: [
    {
      id: "page-context",
      description: "Current Project Detail...",
      has_data: true,
      payload_keys: ["context", "type", "project", "recentChats", "metadata"]
    },
    {
      id: "org-context",
      description: "Organization metadata.",
      has_data: true,
      payload_keys: ["id", "name", "plan"]
    }
  ]
}
```

---

## Implementation

```js
// commands/read/getPageOutline.action.js
export const action = (args, registry) => {
  const detailLevel = args?.detail_level || 'low';
  const route = window?.location?.pathname || 'unknown';

  const pageSnapshot = registry?.getSnapshot?.('page-context');
  const pageContext = pageSnapshot?.payload || null;

  const allSources = registry?.listAllSources?.() || [];
  const sources = allSources.map((source) => {
    const snap = registry?.getSnapshot?.(source.id);
    const payload = snap?.payload;
    const entry = {
      id: source.id,
      description: source.description,
      has_data: !!payload,
    };

    if (detailLevel === 'high' && payload) {
      entry.payload = payload;
    } else if (payload) {
      entry.payload_keys = Object.keys(payload);
    }

    return entry;
  });

  return { route, page_context: pageContext, sources };
};
```

---

## Command Definition

```js
{
  id: 'command_center.read.page.outline',
  label: '/page-outline',
  description: 'Describe current page route, context, and registered sources',
  schema: {
    type: 'object',
    properties: {
      detail_level: {
        type: 'string',
        enum: ['low', 'high'],
        description: "'high' includes full source payloads; 'low' includes only field names."
      }
    }
  },
  action: (args) => Read.getPageOutline(args, registry),
}
```

---

## Notes

- `detail_level: "high"` can produce very large responses (all source payloads combined). If used with synthesis, the context truncation logic in `CognitiveEntryManager` will apply.
- `route` is derived from `window.location.pathname`, so it always reflects the browser's current URL at execution time.
- `sources` includes all registered sources, not just `page-context`. This gives the LLM a complete picture of available data.
