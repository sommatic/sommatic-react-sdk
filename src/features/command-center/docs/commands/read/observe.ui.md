# `command_center.observe.ui`

**Label:** `/observe-ui`  
**Category:** Read (Observe)  
**File:** `commands/read/observeUi.action.js`

---

## Purpose

Analyzes all registered surfaces and targets to suggest UI actions relevant to a given natural language instruction. This is the "smart discovery" command — it scores each surface and target against the instruction and returns the most relevant candidates.

Unlike `read.ui.targets.list`, which returns a raw list, `observe.ui` uses semantic scoring to match the instruction to specific targets and methods.

---

## When to Use

- When the user says "What can I do here?" or "How do I filter the list?"
- As the first step in a plan where the LLM needs to discover which surface/target to interact with.
- When the user's instruction is ambiguous and the LLM needs to narrow down the target.

---

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `instruction` | `string` | Yes | Natural language description of the desired action. |

---

## Return Value

```js
{
  ok: true,
  candidates: [
    {
      surface_id: "project-list-grid",
      target_ref: "project-list-grid::applyFilter",
      label: "applyFilter",
      type: "virtual",
      method: "applyFilter",
      score: 3,
      hint: "Call 'applyFilter' on surface 'project-list-grid'"
    },
    {
      surface_id: "project-list-grid",
      target_ref: "project-list-grid::selectRows",
      label: "selectRows",
      type: "virtual",
      method: "selectRows",
      score: 2
    }
  ]
}
```

If no relevant candidates found:

```js
{ ok: true, candidates: [] }
```

---

## Scoring Algorithm

Each surface is scored by `computeSurfaceScore(instruction, surface, surfaceId)`:
- +1 if instruction mentions the surface type (e.g., "grid")
- +1 per surface field match (id, label, description) against keywords in the instruction
- Minimum score 0

Each target is scored by keyword matching its label, type, and supported methods against the instruction.

**Virtual targets** (generated from handlers when `targets: []`) skip the strict `isMethodRelevant` check if the parent surface has a positive score, ensuring that general queries like "what can I do in the grid?" still return all handler-based actions.

---

## Virtual Targets

When a surface has empty `targets` but exposes `handlers`, virtual targets are generated dynamically:

```js
// Surface registered with:
handlers: {
  applyFilter: (value) => setFilter(value),
  selectRows: (ids) => setSelectedRowIds(ids),
}

// Generates virtual targets:
[
  { id: "project-list-grid::applyFilter", label: "applyFilter", type: "virtual", handlers: { applyFilter: fn } },
  { id: "project-list-grid::selectRows", label: "selectRows", type: "virtual", handlers: { selectRows: fn } }
]
```

---

## Implementation (Summary)

```js
// commands/read/observeUi.action.js

export const action = (args, registry) => {
  const { instruction } = args || {};

  const surfaces = registry?.getSurfaces?.() || [];
  const candidates = [];

  for (const surface of surfaces) {
    let targets = registry?.getTargets?.(surface.id) || [];
    let isVirtualSurface = false;

    // If no explicit targets, generate virtual targets from handlers
    if (targets.length === 0 && surface.handlers) {
      targets = buildVirtualTargets(surface.id, surface);
      isVirtualSurface = true;
    }

    const surfaceScore = computeSurfaceScore(instruction, surface, surface.id);

    for (const target of targets) {
      const targetScore = scoreTarget(instruction, target);

      // For virtual targets on scored surfaces, skip method relevance filtering
      if (isVirtualSurface && surfaceScore > 0) {
        candidates.push({ surface_id: surface.id, target_ref: target.id, ...target, score: surfaceScore + targetScore });
        continue;
      }

      if (targetScore > 0 || surfaceScore > 0) {
        candidates.push({ surface_id: surface.id, target_ref: target.id, ...target, score: surfaceScore + targetScore });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return { ok: true, candidates };
};
```

---

## Command Definition

```js
{
  id: 'command_center.observe.ui',
  label: '/observe-ui',
  description: 'Discover UI actions relevant to a given instruction',
  schema: {
    type: 'object',
    properties: {
      instruction: {
        type: 'string',
        description: 'Natural language description of what the user wants to do.'
      }
    },
    required: ['instruction']
  },
  action: (args) => Read.observeUi(args, registry),
}
```

---

## Notes

- `observe.ui` is best used when the LLM is uncertain which surface or target to target. For known surfaces, call the exec commands directly.
- The `target_ref` in each candidate is the string to pass to `exec.ui.act` or `extract.from_targets`.
- Empty candidates typically means no surfaces are registered or the instruction doesn't match any surface/target keywords.
