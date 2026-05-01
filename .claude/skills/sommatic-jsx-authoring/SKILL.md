---
name: sommatic-jsx-authoring
description: Use when creating or editing `*.sommatic.jsx` co-located files that expose page context and Surfaces to the Sommatic Command Center. Triggers on `useSommaticContextSource`, `useSommaticSurface`, `useSommaticSelection`, `useSommaticFocus`, surface registration with id/label/type/aliases/methods/handlers, target authoring, or filenames matching `*.sommatic.jsx`.
---

# Authoring `*.sommatic.jsx` files

This skill loads when you need to expose a page or component to the Command Center via a co-located Sommatic wrapper file.

## What `*.sommatic.jsx` is

A `*.sommatic.jsx` file is a tiny React component that **registers metadata only**. It renders nothing (`return null`) and lives next to its parent component. It receives the parent's refs/handlers as props and uses Sommatic hooks to expose:

- a **context source** (a snapshot the LLM can read), and
- one or more **surfaces** (panels, forms, grids, modals) with **targets** the LLM can act on.

## File contract

```jsx
import { useSommaticContextSource, useSommaticSurface } from '@sommatic/react-sdk';

function ParentComponentSommatic({ formDataRef, handleSubmit, setIsOpen }) {
  useSommaticContextSource(
    {
      id: 'organization-edit-form-context',
      description: 'Organization management edit form context.',
      getData: () => ({ ...formDataRef?.current }),
    },
    [],
  );

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
      ],
    },
    [],
  );

  return null;
}

export default ParentComponentSommatic;
```

(Verbatim shape from `bsh.sommatic.client.webapp/src/components/pages/identity/organization/organization-management/edit/OrganizationManagementEdit.sommatic.jsx`.)

## Conventions

- **Filename:** `<ParentComponent>.sommatic.jsx` — co-located in the parent's folder.
- **Naming:** function and default export end in `Sommatic` (e.g. `OrganizationManagementEditSommatic`).
- **Returns `null` always.** No JSX. No DOM.
- **Props:** receive what the parent already has (refs, handlers, setters). Do not duplicate state.
- **Multiple surfaces are allowed** in one wrapper (e.g. a panel + a form + a grid). Each is its own `useSommaticSurface` call.
- **Stable IDs.** Use kebab-case IDs that won't churn (`organization-edit-form`, not random hashes).
- **Do not put business logic here.** Only registration; the handlers proxy to the parent.

## Surface object shape

```javascript
{
  id: string,                    // stable kebab-case
  type: 'panel' | 'form' | 'grid' | 'modal' | 'list' | 'dialog',
  label: string,                 // human-readable
  description?: string,          // hint shown to the LLM
  targets?: Target[],            // act-able controls
  handlers?: {                   // surface-level operations
    submit?: () => any,
    cancel?: () => any,
    open?: (initialState) => any,
    close?: () => any,
    setFields?: (fieldsMap) => any,
  },
}
```

## Target object shape

```javascript
{
  id: string,                                            // unique within surface
  type: 'input' | 'link' | 'button' | 'row' | 'text',
  label: string,                                         // human-readable
  aliases?: string[],                                    // alternative names for fuzzy matching
  methods?: ('click' | 'fill' | 'select' | 'hover' | 'scroll' | 'toggle' | 'clear')[],
  handlers: {
    click?: () => any,
    fill?: (value) => any,
    getValue?: () => any,
    scroll?: () => any,
  },
}
```

## Context source object shape

```javascript
{
  id: string,                  // unique source ID — `page-context` is the conventional default
  description: string,
  namespace?: string,          // optional grouping
  title?: string,
  getData: () => any,          // called on demand; result cached for ttl_ms
  ttl_ms?: number,             // default 30_000 (30s)
}
```

## Tips for fuzzy matching

The Command Center's target resolver scores aliases (0.9), label/id substrings (0.75–0.85), token overlap (0.5–0.8), and trigram Dice (~0.78). To improve hit rate:

- Add **multilingual aliases** for cross-language input (`['display name', 'nombre', 'razón social']`).
- Use **descriptive labels** rather than acronyms.
- Avoid stopwords inside IDs (`org-name` better than `the-org-name`).

See [docs/command-center/target-resolution.en.md](../../../docs/command-center/target-resolution.en.md) for the full algorithm.

## When to load this skill

Examples that should trigger it:
- "Add a Sommatic wrapper for the new ProjectEdit form."
- "Why isn't the LLM finding my `display_name` field?"
- "Should I split this into two surfaces or one?"

Examples that should NOT trigger it:
- "How does `classifyIntent` build the envelope?" → That's `sommatic-command-center`.
- "What does `/apply-filter` accept?" → That's `sommatic-command-reference`.

## See also

- [docs/command-center/sommatic-jsx-authoring.en.md](../../../docs/command-center/sommatic-jsx-authoring.en.md)
- [docs/command-center/target-resolution.en.md](../../../docs/command-center/target-resolution.en.md)

---

## Autoría de archivos `*.sommatic.jsx` (Español)

Este skill se carga al crear o editar archivos `*.sommatic.jsx` co‑localizados que exponen una página o componente al Command Center.

### Qué es

Un `*.sommatic.jsx` es un componente React diminuto que **solo registra metadata**. No pinta nada (`return null`) y vive junto a su componente padre. Recibe los refs/handlers del padre como props y usa hooks Sommatic para exponer:

- una **fuente de contexto** (un snapshot que el LLM puede leer), y
- una o más **surfaces** (panels, forms, grids, modals) con **targets** sobre los que el LLM puede actuar.

### Convenciones

- **Nombre del archivo:** `<ParentComponent>.sommatic.jsx`, co-localizado.
- **Nombre del componente:** termina en `Sommatic`.
- **Siempre retorna `null`.** Sin JSX, sin DOM.
- **Props:** lo que el padre ya tiene (refs, handlers, setters). No duplicar estado.
- **Varias surfaces** permitidas en un mismo wrapper.
- **IDs estables** en kebab-case, no hashes aleatorios.
- **No poner lógica de negocio.** Solo registro; los handlers proxy al padre.

### Tips de matching difuso

El resolver puntúa aliases (0.9), substrings de label/id (0.75–0.85), token overlap (0.5–0.8) y trigram Dice (~0.78). Para mejorar coincidencias:

- Añade **aliases multilingües** (`['display name', 'nombre', 'razón social']`).
- Usa **labels descriptivos** y no acrónimos.
- Evita stopwords en IDs.

Ver [docs/command-center/target-resolution.es.md](../../../docs/command-center/target-resolution.es.md).

### Ver también

- [docs/command-center/sommatic-jsx-authoring.es.md](../../../docs/command-center/sommatic-jsx-authoring.es.md)
- [docs/command-center/target-resolution.es.md](../../../docs/command-center/target-resolution.es.md)
