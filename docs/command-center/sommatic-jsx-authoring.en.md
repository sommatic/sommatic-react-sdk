# Authoring `*.sommatic.jsx` files

> EN · also available in [sommatic-jsx-authoring.es.md](sommatic-jsx-authoring.es.md)

`*.sommatic.jsx` files are the integration layer between a regular React page/component and the Command Center. They expose context (what's on the page) and surfaces (what can be acted on), and they are the only place where most features touch the Command Center directly.

## File contract

A `*.sommatic.jsx` file:

1. Is named `<ParentComponent>.sommatic.jsx` and lives next to its parent.
2. Imports the relevant hooks from `@sommatic/react-sdk` (`useSommaticContextSource`, `useSommaticSurface`, `useSommaticSelection`, `useSommaticFocus`).
3. Receives the parent's refs/handlers as props — never duplicates state.
4. Calls one or more registration hooks.
5. Returns `null`.
6. Default-exports a function whose name ends in `Sommatic`.

## Worked walkthrough

Reference file: `bsh.sommatic.client.webapp/src/components/pages/identity/organization/organization-management/edit/OrganizationManagementEdit.sommatic.jsx`.

```jsx
/**
 * Sommatic wrapper for OrganizationManagementEdit.jsx
 */
import { useSommaticContextSource, useSommaticSurface } from '@sommatic/react-sdk';

function OrganizationManagementEditSommatic({ formDataRef, handleSubmit, setIsOpen }) {
  // 1) Context source — what the LLM should know about the page.
  useSommaticContextSource(
    {
      id: 'organization-edit-form-context',
      description: 'Organization management edit form context.',
      getData: () => ({ ...formDataRef?.current }),
    },
    [],
  );

  // 2) Panel-level surface — what the LLM can do at the panel level.
  useSommaticSurface(
    {
      id: 'organization-edit-panel',
      type: 'panel',
      label: 'Edit Organization',
      handlers: {
        submit: () => { handleSubmit?.(); return { submitted: true }; },
        cancel: () => { setIsOpen?.(false); return { cancelled: true }; },
      },
    },
    [],
  );

  // 3) Form surface — fine-grained controls.
  useSommaticSurface(
    {
      id: 'organization-edit-form',
      type: 'form',
      label: 'Edit Organization Form',
      description: 'Form for editing an organization; use with /extract-targets to read current values.',
      targets: [
        {
          id: 'organization-edit-display-name',
          type: 'input',
          label: 'Display Name',
          handlers: {
            getValue: () => formDataRef?.current?.display_name,
            fill: (value) => formDataRef?.current && (formDataRef.current.display_name = value),
          },
        },
        {
          id: 'organization-edit-slug',
          type: 'input',
          label: 'Slug',
          handlers: {
            getValue: () => formDataRef?.current?.slug,
            fill: (value) => formDataRef?.current && (formDataRef.current.slug = value),
          },
        },
      ],
    },
    [],
  );

  return null;
}

export default OrganizationManagementEditSommatic;
```

Line-by-line:

- **Function name** ends in `Sommatic`. The default export carries the name.
- **Props** mirror the parent's refs and setters. The wrapper never owns its own state.
- **First hook** publishes a context source whose `getData` returns a snapshot. The Command Center caches the snapshot for `ttl_ms` (default 30s). The LLM consults this when answering "what's on the page" questions or when filling form values from extracted context.
- **Second hook** registers a panel-level surface. `handlers.submit` and `handlers.cancel` proxy to the parent — the LLM can call them via `/act-ui` with `{ surface_id: 'organization-edit-panel', method: 'submit' }`.
- **Third hook** registers a form surface with two targets. Each target has `handlers.getValue` and `handlers.fill` so `/extract-from-targets` and `/set-fields` work. Note the `description` hint guiding the LLM to combine commands.
- **Return value** is always `null`. No DOM, no styling, nothing rendered.

## Hook reference

### `useSommaticContextSource(source, deps)`

Registers a snapshot provider.

```javascript
{
  id: 'page-context' | string,    // unique. Use 'page-context' as the default
  description: string,             // shown to the LLM
  namespace?: string,              // optional grouping
  title?: string,                  // optional display title
  getData: () => any,              // called on demand; result cached
  ttl_ms?: number,                 // default 30000 (30s)
}
```

`page-context` is the convention. When a read action like `/page-outline` is invoked without a specific `source_id`, it falls back to `page-context`, then to the first registered source if missing.

### `useSommaticSurface(surface, deps)`

Registers a Surface (a published UI region).

```javascript
{
  id: string,                                  // stable kebab-case
  type: 'panel' | 'form' | 'grid' | 'modal' | 'list' | 'dialog',
  label: string,                               // human-readable
  description?: string,                        // hint for the LLM
  targets?: Target[],                          // act-able controls
  handlers?: {                                 // surface-level operations
    submit?: () => any,
    cancel?: () => any,
    open?: (initialState) => any,
    close?: () => any,
    setFields?: (fieldsMap) => any,
  },
}
```

You may call this hook multiple times in the same wrapper — typically once per logical surface (panel + form + grid).

### `useSommaticSelection(selection, deps)`

Publishes the user's current selection (e.g. selected rows in a grid). The Command Center reads it via `/get-selection`.

### `useSommaticFocus(focus, deps)`

Publishes the user's active focus (e.g. the entity currently expanded in a manager view). Read via `/get-focus`.

## Target shape

```javascript
{
  id: string,                                                       // unique within surface
  type: 'input' | 'link' | 'button' | 'row' | 'text',
  label: string,                                                    // human-readable
  aliases?: string[],                                               // alternative names for fuzzy matching
  methods?: ('click' | 'fill' | 'select' | 'hover' | 'scroll' | 'toggle' | 'clear')[],
  handlers: {
    click?: () => any,
    fill?: (value) => any,
    getValue?: () => any,
    scroll?: () => any,
  },
}
```

A target is referenced as `surface_id::target_id` (e.g. `organization-edit-form::organization-edit-display-name`).

## Patterns

### Multiple surfaces in one wrapper

A page often has more than one surface: a panel containing a form, a list above the panel, and a confirmation modal. Register each separately so each has its own ID and handler set. Don't bundle them into one mega-surface — fuzzy matching works better with focused surfaces.

### Reactive context

```jsx
useSommaticContextSource(
  {
    id: 'organization-list-context',
    description: 'Visible organizations and their current page',
    getData: () => ({
      type: 'grid',
      items: organizations.map(o => ({ id: o.id, name: o.display_name, slug: o.slug })),
      page: currentPage,
      total: total,
    }),
  },
  [organizations, currentPage, total],   // re-evaluate when these change
);
```

The dependency array invalidates the cached snapshot when the underlying data changes.

### Targets with multilingual aliases

```javascript
{
  id: 'organization-edit-display-name',
  type: 'input',
  label: 'Display Name',
  aliases: ['name', 'nombre', 'razón social', 'business name'],
  handlers: { /* ... */ },
}
```

Aliases score 0.9 in fuzzy matching, beating most other heuristics. Add them whenever the field has a common alternative name in another language.

### Item lookups for `/select-rows`

For grids, expose the items array in your `page-context` snapshot:

```jsx
useSommaticContextSource(
  {
    id: 'page-context',
    getData: () => ({
      type: 'grid',
      items: rows.map(r => ({ id: r.id, slug: r.slug, name: r.display_name })),
    }),
  },
  [rows],
);
```

`/select-rows` with `{ identifiers: ['acme'], match_field: 'slug' }` will find `id: r.id` for the matching row.

## Don't

- Don't put business logic inside the wrapper. Proxy to the parent's handlers.
- Don't return JSX. The wrapper is metadata-only.
- Don't use random or runtime-generated IDs. Stable kebab-case IDs only.
- Don't duplicate state. Use refs and getters that read directly from the parent.
- Don't omit the dependency arrays — stale snapshots and dead handlers will follow.

## Cross-references

- [architecture.en.md](architecture.en.md) — registry semantics.
- [target-resolution.en.md](target-resolution.en.md) — how the LLM finds your targets.
- Per-command reference: `src/features/command-center/docs/commands/`.
