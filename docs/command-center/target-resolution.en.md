# Target Resolution

> EN · also available in [target-resolution.es.md](target-resolution.es.md)

How `surface_id::target_id` references emitted by the LLM are matched to registered Targets at runtime.

## Why this matters

The LLM emits target refs from a fuzzy human prompt. Sometimes it gets the canonical `id` right; sometimes it produces a label, an alias, a different language, or a slightly altered phrasing. The registry resolves with a layered scoring strategy so the surface still wins.

Registry lookup helpers (in `CommandCenter.context.jsx`):
- `resolveTarget(ref)` — exact match by `surface_id::target_id`.
- `resolveTargetFuzzy(ref)` — multi-strategy resolver returning `{ surface, target, score }`.

## Scoring layers

Listed in order of preference. The first layer that returns a strong score wins.

| Layer | Typical score | What it matches |
|---|---|---|
| **1. Alias exact match** | 0.9 | `target.aliases[]` contains the input string (case-insensitive). |
| **2. Label / id substring** | 0.75–0.85 | The input string is a substring of the target label or id (or vice-versa). |
| **3. Token overlap** | 0.5–0.8 | Stop-word-filtered token intersection over union (Jaccard-ish). |
| **4. Trigram Dice coefficient** | ~0.78 | Shared character trigrams between input and label. Catches cognates like `organizacion` ↔ `organization`. |
| **5. Semantic bridge** | 0.65–0.75 | Cross-language pairings the resolver knows about (e.g. `nombre` ↔ `name`, `tipo` ↔ `type`, `correo` ↔ `email`). |

The resolver chooses the layer with the highest non-trivial score. Ties favor the earlier layer in the list above.

## Example

User prompt: *"fill display name with Acme"*. LLM emits `{ target_ref: 'organization-edit-form::display-name', method: 'fill', arguments: ['Acme'] }`.

Registered target:
```javascript
{
  id: 'organization-edit-display-name',
  label: 'Display Name',
  aliases: ['display name', 'name', 'nombre', 'razón social'],
}
```

Resolver:
- Exact lookup of `display-name` inside surface `organization-edit-form` → miss (`organization-edit-display-name` is the actual id).
- Alias check against `'display-name'` (with case folding and dash/space normalization) → matches `'display name'` alias → score 0.9. WIN.

## Tuning aliases

If the LLM repeatedly fails on a target, the cause is almost always missing aliases. Add the alternative names users actually say:

```javascript
{
  id: 'organization-edit-display-name',
  label: 'Display Name',
  aliases: [
    'display name',        // English colloquial
    'name',                // shortest English form
    'nombre',              // Spanish primary
    'razón social',        // Spanish formal
    'business name',
    'org name',
  ],
}
```

Aliases score 0.9 — far above other layers — so a well-aliased target almost always wins.

## ID hygiene

Target IDs and surface IDs should be:

- **Stable** across re-renders. Don't include UUIDs, timestamps, or component-mount counters.
- **Descriptive in their own right** — `organization-edit-form` beats `form-3`.
- **Free of stopwords** — `org-name` beats `the-org-name`. The token-overlap layer filters stopwords from the input but not from your IDs.
- **Kebab-case** — consistent with the rest of the codebase.

## Multilingual fields

If your app may receive Spanish or English prompts:

- Set `label` to the canonical English (matches static UI strings).
- Add aliases for both languages.
- The semantic bridge handles obvious pairs (`nombre`↔`name`) without aliases, but explicit aliases score higher and are predictable.

## Disambiguation

When two targets score equally, the resolver prefers:

1. The same surface that the LLM hinted at (when the prompt referenced one).
2. The alphabetically first target ID (deterministic tie-break).

If both targets are legitimately ambiguous, add aliases or rename one.

## Debugging mismatches

1. Enable `VITE_COMMAND_CENTER_DEBUG=true` in your env. Each executed step logs `command result` to the console.
2. Use `/observe-ui` with the user's instruction to see candidate targets and their scores.
3. Use `/list-targets` with the suspected `surface_id` to verify the target is registered.
4. Inspect the registry in DevTools: `window.__SOMMATIC_CC_DEBUG__?.surfaces` (only present when debug is on).

If the target is registered but never wins, your aliases are the lever to pull.

## Cross-references

- [architecture.en.md](architecture.en.md) — registry semantics.
- [sommatic-jsx-authoring.en.md](sommatic-jsx-authoring.en.md) — alias placement.
- `src/features/command-center/docs/commands/read/observe.ui.md` — observe-ui details.
