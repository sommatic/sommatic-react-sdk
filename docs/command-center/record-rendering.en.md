# Conversation record rendering & reconstruction

> Home of the rich-history rendering pipeline for a conversation (Command Center
> sidebar **and** the full-page conversation view). Read this before adding a new
> in-conversation control (an app card, a plan block, any non-bubble artifact),
> because a control has to work in **two** lifecycles, not one.

**Owner file:** [`CognitiveEntryManager.component.jsx`](../../src/components/chat/CognitiveEntryManager.component.jsx)
**Surfaces that use it:** `mode="sidebar"` (Command Center) and `mode="page"`
(`/client/chat/conversation/:id`). Both go through `isConversationView === true`,
so anything documented here renders identically on both — that is the whole point:
**one renderer, two surfaces.** Do not fork the rendering into the webapp.

---

## The core problem: two lifecycles per control

Every rich control (ExecutionPlan, "App opened…", "Data received…") appears in a
conversation in **two different moments**, and each moment builds the record a
different way:

| Lifecycle | When | Where the record comes from |
|---|---|---|
| **Live** | User sends a message; classification runs; apps open | The component synthesizes **ephemeral typed records** in-memory (via `setRecords`) and stores app-embeds in the module cache `appEmbedRecordsCache`. These are **never** persisted as typed records. |
| **Reload** | Conversation is (re)opened — sidebar reopen or page load | Only the **underlying context prompts** were persisted. `reconstructPersistedRecords()` rebuilds the same typed records from those prompts + their `metadata`. |

If you only wire a control into the **live** path, it will render while the user
is chatting and then **vanish on reload**. The reload path is not optional — it is
half the feature. This is exactly the bug that motivated this doc.

---

## Record shapes the renderer understands

The render switch lives at the bottom of `CognitiveEntryManager` inside the
`{isConversationView && (() => { ... })()}` block. It dispatches on `record.type`
first, then falls back to role-based rendering.

### 1. `type: 'app-embed'` → `<AppOutputCard isEmbed />` ("App opened in conversation")
```js
{ record_id, type: 'app-embed', role: 'system', app_slug, route_path, launch_mode, status }
```
- `status: 'active'` → live, still open. Rendered by calling the **`renderAppEmbed` prop**.
  If the surface did not pass `renderAppEmbed`, an active embed renders **nothing** (no card,
  no app) — this is the #1 cause of "apps render in the Command Center but not on my surface".
- `status: 'completed'` → collapsed card **"App opened in conversation"** (`AppOutputCard` with `isEmbed`).
- `status: 'escalated'` → `<AppEscalatedCard />`.

**`renderAppEmbed` is a HOST responsibility, not the SDK's.** The live app is the App Engine
runtime (`AppRuntimeHost`), which only the consuming webapp can mount. The host builds
`renderAppEmbed(record) → <AppEmbedHost record … onOutput onClose onEscalate />` once and passes
the SAME function to **every** surface that renders a conversation:
- Command Center sidebar: `<CommandCenterSidebar renderAppEmbed={…} />` (→ `CommandCenterChat` → here).
- Full-page view: `LayoutBusiness` exposes it via `Outlet context`; the page reads it with
  `useOutletContext()` and passes `<CognitiveEntryManager mode="page" renderAppEmbed={…} />`.

If you add a new surface that mounts `CognitiveEntryManager`, thread the host's `renderAppEmbed`
into it too, or live apps will silently not render there. Reload still shows `completed` collapsed
cards without it (reconstruction never emits `active`), which is why the bug hides until someone
opens an app live.

#### Why a missing `renderAppEmbed` renders *nothing* (not even a card)

The `app-embed` branch is an `if`/`if`/`if` with no `else`:
```js
if (record.type === 'app-embed') {
  if (record.status === 'completed') return <AppOutputCard isEmbed />;  // pure SDK, no host needed
  if (record.status === 'escalated') return <AppEscalatedCard />;       // pure SDK, no host needed
  if (renderAppEmbed) return <article>{renderAppEmbed(record)}</article>; // live app — HOST needed
  // renderAppEmbed undefined → falls through → the map returns undefined → React renders nothing
}
```
So an **`active`** embed with no `renderAppEmbed` produces neither an app nor a card — it is
silently dropped. Only the live (`active`) path needs the host; `completed`/`escalated` are pure
SDK components.

This produces a confusing symptom: **older apps show a collapsed card, the newest one is blank.**
An embed is `active` only while it is the latest opened app; opening a *newer* app flips the
previous one to `completed`. So on a surface missing `renderAppEmbed`, every app you open is
invisible *until* you open the next one (which collapses it into an `AppOutputCard`). The last
app opened always looks broken. If you see that pattern, the surface is not passing `renderAppEmbed`.

### 2. `type: 'app-output'` → `<AppOutputCard />` ("Data received from an app")
```js
{ record_id, type: 'app-output', role: 'system', app_slug }
```

### 3. ExecutionPlan (`<ThoughtProcess />`)
Not a `type`. It is any assistant/system record carrying a **thought** and/or an
**execution_plan**, rendered *above* the SystemResponse bubble. Renders when:
```js
isStreamingThought || record.isExecutingPlan ||
(!isReplyOnlyPlan && (hasThought || hasPlan) && hasNonReplyPlan)
```
- `thought`/`execution_plan` are read from the record **top-level first**, then
  fall back to `record.metadata.thought` / `record.metadata.execution_plan`,
  then to `extractContextMetadata()` for `gradient`-variant synthesis records.
- `hasNonReplyPlan` = the plan has at least one step whose `command_id !== 'reply'`.
  A plan that is *only* a `reply` step is treated as a plain answer (no plan block).

### 4. User bubble / System response (fallback)
Role `user` → `<ChatBubble role="user">` (with `attachments`).
Role `assistant`/`system` with content → `<SystemResponse>`.

---

## Persistence contract (what the backend actually stores)

During a live workflow/app run the component calls `executionService.executeStream`
with a **context prompt** message plus a `metadata` bag. The backend persists that
message verbatim. On reload we get these records back and reconstruct from them:

| Persisted record (ground truth) | Carries | Reconstructed into |
|---|---|---|
| assistant JSON `{"thought","plan"}` (raw classification) | — | **dropped** (the app-context record below has a richer plan) |
| user `"The following app(s) were opened in embedded view…"` | `metadata.app_embeds[]`, `metadata.execution_plan`, `metadata.thought` | one ExecutionPlan record (`-plan`) + one `app-embed` record per embed |
| assistant reply "He abierto…" | plain text | SystemResponse (kept as-is) |
| user `"Data received from app [slug]:\n{json}…"` | — | one `app-output` record |
| assistant reply "He recibido…" | plain text | SystemResponse (kept as-is) |

The `metadata.app_embeds[]` items are `{ app_slug, route_path, launch_mode }`
(built as `appEmbedsMeta` in the live path and sent inside `metadata` — grep
`app_embeds:` / `appEmbedsMeta`).

**Rule:** if a new control needs to survive reload, its reconstruction data must
be persisted **inside `metadata` of an already-persisted context prompt** (or be
derivable from that prompt's text). We do not add new persisted record types — we
piggyback on the context prompts the execution already writes.

---

## The two reconstruction functions (both must agree)

### `reconstructPersistedRecords(records)`
Runs once in the fetch effect: `reconstructPersistedRecords(conv.conversation_records || [])`.
Walks persisted records and emits the typed records above. Anything it does not
recognize is passed through untouched. This is the **reload → typed records** step.

### `isValidRecord(record)`
Filters the final list right before render (`records.filter(isValidRecord)`).
It hides raw internal prompts that must never reach the user:
- text starting with `"Data received from app ["`
- text starting with `"The following app(s) were opened in embedded view"`
- assistant classification JSON `{thought, plan}` that is **not** reply-only

`reconstructPersistedRecords` turns those same prompts into cards; `isValidRecord`
makes sure the *original* prompt text never renders as a bubble. **They are a pair —
if you teach one about a new prompt shape, teach the other too.**

---

## Gotcha: the empty-content guard

The render loop skips records with no visible content:
```js
if (!content && recordAttachments.length === 0 && !hasPlanOrThought &&
    !record.isThinking && !record.isSynthesizing && !record.isExecutingPlan) {
  return null;
}
```
A reconstructed ExecutionPlan record has **empty `content`** (its payload is the
plan, not text). Without `!hasPlanOrThought` in this guard it would be dropped and
the plan would not render on reload. `hasPlanOrThought` = `record.thought` or a
non-empty `record.execution_plan`. **Any new content-less control must be added to
this guard** or it will be silently swallowed.

---

## Checklist — adding a NEW in-conversation control

To make a control appear **live and on reload** on both surfaces:

1. **Live record** — where the live flow produces the artifact, `setRecords` a
   typed record (`type: 'my-thing'`, `role: 'system'`, plus your fields). If it
   must survive Command Center close/reopen, also write it to
   `appEmbedRecordsCache` keyed by `conversationId` (follow the app-embed writes).
2. **Persist reconstruction data** — put whatever the card needs into the
   `metadata` of the context prompt the execution already sends to
   `executeStream` (mirror `app_embeds` / `execution_plan` / `thought`). Do **not**
   invent a new persisted record type.
3. **`reconstructPersistedRecords`** — add a branch that detects your persisted
   prompt (by `metadata` key or text prefix) and emits your typed record.
4. **`isValidRecord`** — if the persisted prompt has raw text that must not render
   as a bubble, add a prefix guard so it is filtered.
5. **Render switch** — add `if (record.type === 'my-thing') return <MyCard … />;`
   in the `validRecords.map` block, above the role-based fallback.
6. **Empty-content guard** — if your control renders with no `content`, extend the
   `hasPlanOrThought`-style guard so it is not returned as `null`.
7. **Verify BOTH lifecycles:** send a fresh message (live), then hard-reload the
   page **and** reopen the sidebar. The control must look identical in all three.

Skipping step 2–4 is the classic failure mode: the control works while chatting
and disappears forever on reload.

---

## Do / Don't

- **Do** keep all rendering in `CognitiveEntryManager`. The full-page view
  (`ConversationManagementEdit`) must render by mounting
  `<CognitiveEntryManager mode="page" … />`, never by re-implementing the loop.
- **Don't** persist typed records (`app-embed`, etc.) directly — persist context
  prompts + `metadata`, and reconstruct. The typed records are a render-time
  projection, not a storage format.
- **Don't** rely on `appEmbedRecordsCache` for correctness across reloads — it is
  a module-level in-memory cache (survives unmount, **not** a full page reload).
  Reload correctness comes only from `reconstructPersistedRecords`.
