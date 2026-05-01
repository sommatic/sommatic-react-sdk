# Autoría de archivos `*.sommatic.jsx`

> ES · también disponible en [sommatic-jsx-authoring.en.md](sommatic-jsx-authoring.en.md)

Los archivos `*.sommatic.jsx` son la capa de integración entre una página/componente React habitual y el Command Center. Exponen contexto (qué hay en la página) y surfaces (qué se puede accionar), y son el único lugar donde la mayoría de las features tocan el Command Center directamente.

## Contrato de archivo

Un `*.sommatic.jsx`:

1. Se llama `<ParentComponent>.sommatic.jsx` y vive junto a su padre.
2. Importa los hooks pertinentes de `@sommatic/react-sdk` (`useSommaticContextSource`, `useSommaticSurface`, `useSommaticSelection`, `useSommaticFocus`).
3. Recibe los refs/handlers del padre como props — nunca duplica estado.
4. Llama uno o más hooks de registro.
5. Retorna `null`.
6. Hace default-export de una función cuyo nombre termina en `Sommatic`.

## Walkthrough con un ejemplo real

Archivo de referencia: `bsh.sommatic.client.webapp/src/components/pages/identity/organization/organization-management/edit/OrganizationManagementEdit.sommatic.jsx`.

```jsx
/**
 * Sommatic wrapper for OrganizationManagementEdit.jsx
 */
import { useSommaticContextSource, useSommaticSurface } from '@sommatic/react-sdk';

function OrganizationManagementEditSommatic({ formDataRef, handleSubmit, setIsOpen }) {
  // 1) Context source — qué debería saber el LLM de la página.
  useSommaticContextSource(
    {
      id: 'organization-edit-form-context',
      description: 'Organization management edit form context.',
      getData: () => ({ ...formDataRef?.current }),
    },
    [],
  );

  // 2) Surface a nivel panel — qué puede hacer el LLM a nivel panel.
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

  // 3) Surface de formulario — controles finos.
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

Línea por línea:

- **Nombre de función** termina en `Sommatic`. El default export lleva ese nombre.
- **Props** reflejan los refs y setters del padre. El wrapper nunca tiene estado propio.
- **Primer hook** publica una fuente de contexto cuyo `getData` retorna un snapshot. El Command Center cachea el snapshot por `ttl_ms` (default 30s). El LLM la consulta para responder "qué hay en la página" o para llenar valores extraídos de contexto.
- **Segundo hook** registra una surface a nivel panel. `handlers.submit` y `handlers.cancel` hacen proxy al padre — el LLM puede llamarlos vía `/act-ui` con `{ surface_id: 'organization-edit-panel', method: 'submit' }`.
- **Tercer hook** registra una surface de formulario con dos targets. Cada target tiene `handlers.getValue` y `handlers.fill` para que `/extract-from-targets` y `/set-fields` funcionen. Nota el hint `description` guiando al LLM a combinar comandos.
- **Valor de retorno** siempre es `null`. Sin DOM, sin estilos, nada renderizado.

## Referencia de hooks

### `useSommaticContextSource(source, deps)`

Registra un proveedor de snapshot.

```javascript
{
  id: 'page-context' | string,    // único. Usar 'page-context' como default
  description: string,             // mostrado al LLM
  namespace?: string,              // agrupación opcional
  title?: string,                  // título de display opcional
  getData: () => any,              // llamado on-demand; resultado cacheado
  ttl_ms?: number,                 // default 30000 (30s)
}
```

`page-context` es la convención. Cuando una read como `/page-outline` se invoca sin `source_id` específico, hace fallback a `page-context`, luego a la primera fuente registrada si no existe.

### `useSommaticSurface(surface, deps)`

Registra una Surface (región publicada de UI).

```javascript
{
  id: string,                                  // kebab-case estable
  type: 'panel' | 'form' | 'grid' | 'modal' | 'list' | 'dialog',
  label: string,                               // legible
  description?: string,                        // hint para el LLM
  targets?: Target[],                          // controles accionables
  handlers?: {                                 // operaciones a nivel surface
    submit?: () => any,
    cancel?: () => any,
    open?: (initialState) => any,
    close?: () => any,
    setFields?: (fieldsMap) => any,
  },
}
```

Puedes llamar este hook varias veces en el mismo wrapper — típicamente uno por surface lógica (panel + form + grid).

### `useSommaticSelection(selection, deps)`

Publica la selección actual del usuario (p.ej. filas seleccionadas en un grid). El Command Center la lee vía `/get-selection`.

### `useSommaticFocus(focus, deps)`

Publica el foco activo del usuario (p.ej. la entidad expandida en un manager view). Lectura vía `/get-focus`.

## Shape del Target

```javascript
{
  id: string,                                                       // único dentro de la surface
  type: 'input' | 'link' | 'button' | 'row' | 'text',
  label: string,                                                    // legible
  aliases?: string[],                                               // nombres alternos para fuzzy matching
  methods?: ('click' | 'fill' | 'select' | 'hover' | 'scroll' | 'toggle' | 'clear')[],
  handlers: {
    click?: () => any,
    fill?: (value) => any,
    getValue?: () => any,
    scroll?: () => any,
  },
}
```

Un target se referencia como `surface_id::target_id` (p.ej. `organization-edit-form::organization-edit-display-name`).

## Patrones

### Múltiples surfaces en un mismo wrapper

Una página suele tener más de una surface: un panel con un form, una lista arriba del panel, y un modal de confirmación. Registra cada una por separado para que tengan su propio ID y set de handlers. No las metas en una mega-surface — el fuzzy matching funciona mejor con surfaces enfocadas.

### Contexto reactivo

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
  [organizations, currentPage, total],   // reevalúa cuando cambian
);
```

El array de dependencias invalida el snapshot cacheado cuando los datos cambian.

### Targets con aliases multilingües

```javascript
{
  id: 'organization-edit-display-name',
  type: 'input',
  label: 'Display Name',
  aliases: ['name', 'nombre', 'razón social', 'business name'],
  handlers: { /* ... */ },
}
```

Los aliases puntúan 0.9 en fuzzy matching, ganando a la mayoría de heurísticas. Añádelos cuando el campo tenga un nombre alterno común en otro idioma.

### Lookups por item para `/select-rows`

Para grids, expone el array `items` en tu snapshot `page-context`:

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

`/select-rows` con `{ identifiers: ['acme'], match_field: 'slug' }` encontrará `id: r.id` de la fila correspondiente.

## No hacer

- No poner lógica de negocio dentro del wrapper. Proxy a los handlers del padre.
- No retornar JSX. El wrapper es solo metadata.
- No usar IDs aleatorios o generados en runtime. Solo IDs estables en kebab-case.
- No duplicar estado. Usa refs y getters que lean directo del padre.
- No omitir los arrays de dependencias — vienen snapshots stale y handlers muertos.

## Referencias cruzadas

- [architecture.es.md](architecture.es.md) — semántica del registry.
- [target-resolution.es.md](target-resolution.es.md) — cómo encuentra el LLM tus targets.
- Referencia por comando: `src/features/command-center/docs/commands/`.
