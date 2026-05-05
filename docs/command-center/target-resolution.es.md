# Resolución de Targets

> ES · también disponible en [target-resolution.en.md](target-resolution.en.md)

Cómo se resuelven en runtime las referencias `surface_id::target_id` que emite el LLM contra los Targets registrados.

## Por qué importa

El LLM emite refs de target a partir de un prompt humano difuso. A veces acierta el `id` canónico; a veces produce un label, un alias, otro idioma o un fraseo distinto. El registry resuelve con una estrategia por capas para que la surface gane igual.

Helpers de lookup (en `CommandCenter.context.jsx`):
- `resolveTarget(ref)` — match exacto por `surface_id::target_id`.
- `resolveTargetFuzzy(ref)` — resolver multi-estrategia que devuelve `{ surface, target, score }`.

## Capas de scoring

Listadas en orden de preferencia. Gana la primera capa con score fuerte.

| Capa | Score típico | Qué matchea |
|---|---|---|
| **1. Alias exacto** | 0.9 | `target.aliases[]` contiene el string de entrada (case-insensitive). |
| **2. Substring de label / id** | 0.75–0.85 | El input es substring del label o id (o viceversa). |
| **3. Token overlap** | 0.5–0.8 | Intersección sobre unión de tokens filtrando stopwords (estilo Jaccard). |
| **4. Dice de trigramas** | ~0.78 | Trigramas de carácter compartidos entre input y label. Atrapa cognados como `organizacion` ↔ `organization`. |
| **5. Puente semántico** | 0.65–0.75 | Pares cross-language conocidos por el resolver (p.ej. `nombre` ↔ `name`, `tipo` ↔ `type`, `correo` ↔ `email`). |

El resolver elige la capa con score no-trivial más alto. En empate gana la capa más temprana.

## Ejemplo

Prompt usuario: *"fill display name with Acme"*. LLM emite `{ target_ref: 'organization-edit-form::display-name', method: 'fill', arguments: ['Acme'] }`.

Target registrado:
```javascript
{
  id: 'organization-edit-display-name',
  label: 'Display Name',
  aliases: ['display name', 'name', 'nombre', 'razón social'],
}
```

Resolver:
- Lookup exacto de `display-name` dentro de surface `organization-edit-form` → miss (el id real es `organization-edit-display-name`).
- Chequeo de aliases contra `'display-name'` (con normalización de caso y guión/espacio) → matchea alias `'display name'` → score 0.9. GANA.

## Tuneo de aliases

Si el LLM falla repetidamente en un target, casi siempre la causa son aliases faltantes. Añade los nombres alternos que la gente realmente dice:

```javascript
{
  id: 'organization-edit-display-name',
  label: 'Display Name',
  aliases: [
    'display name',        // inglés coloquial
    'name',                // forma corta inglés
    'nombre',              // español primario
    'razón social',        // español formal
    'business name',
    'org name',
  ],
}
```

Los aliases puntúan 0.9 — muy por encima de las otras capas — así que un target bien aliaseado casi siempre gana.

## Higiene de IDs

Los IDs de target y surface deben ser:

- **Estables** entre re-renders. Sin UUIDs, timestamps, ni contadores de mount.
- **Descriptivos por sí mismos** — `organization-edit-form` mejor que `form-3`.
- **Sin stopwords** — `org-name` mejor que `the-org-name`. La capa de token overlap filtra stopwords del input, no de tus IDs.
- **Kebab-case** — consistente con el resto del codebase.

## Campos multilingües

Si tu app puede recibir prompts en español o inglés:

- Pon el `label` en el inglés canónico (matchea con strings estáticos de UI).
- Añade aliases en ambos idiomas.
- El puente semántico cubre pares obvios (`nombre`↔`name`) sin aliases, pero los aliases explícitos puntúan más alto y son predecibles.

## Desambiguación

Cuando dos targets puntúan igual, el resolver prefiere:

1. La misma surface que el LLM insinuó (si el prompt referenció una).
2. El target ID alfabéticamente primero (desempate determinístico).

Si ambos targets son legítimamente ambiguos, añade aliases o renombra uno.

## Debug de mismatches

1. Activa `VITE_COMMAND_CENTER_DEBUG=true` en tu env. Cada paso ejecutado loguea `command result` a consola.
2. Usa `/observe-ui` con la instrucción del usuario para ver candidatos y scores.
3. Usa `/list-targets` con el `surface_id` sospechoso para verificar que el target está registrado.
4. Inspecciona el registry en DevTools: `window.__SOMMATIC_CC_DEBUG__?.surfaces` (solo presente con debug activo).

Si el target está registrado pero nunca gana, tus aliases son la palanca a mover.

## Referencias cruzadas

- [architecture.es.md](architecture.es.md) — semántica del registry.
- [sommatic-jsx-authoring.es.md](sommatic-jsx-authoring.es.md) — dónde colocar aliases.
- `src/features/command-center/docs/commands/read/observe.ui.md` — detalles de observe-ui.
