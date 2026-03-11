/**
 * Discovers candidate actions from a natural language instruction (Stagehand-like).
 * Analyzes available surfaces and targets to suggest matching actions.
 * @param {Object} args
 * @param {string} args.instruction - Natural language instruction describing desired action.
 * @param {string} [args.surface_id] - Optional surface to limit search scope.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} { candidates: Array<{ target_ref, method, description, arguments_hint? }> }
 */
export const action = (args, registry) => {
  const { instruction, surface_id } = args || {};

  if (!instruction) {
    return { ok: false, error: { code: 'MISSING_INSTRUCTION', message: 'instruction is required' } };
  }

  const candidates = [];
  const normalizedInstruction = instruction.toLowerCase();

  let surfaceIds;
  if (surface_id) {
    surfaceIds = [surface_id];
  } else {
    surfaceIds = (registry?.getSurfaces?.() || []).map((s) => s.id);
  }

  for (const sid of surfaceIds) {
    let targets = registry?.getTargets?.(sid) || [];
    let isVirtualSurface = false;

    // When a surface has no explicit targets, derive virtual targets from its
    // surface-level handlers (e.g. applyFilter, selectRows, open, close).
    if (targets.length === 0) {
      const surface = registry?.getSurface?.(sid);
      if (surface?.handlers) {
        targets = buildVirtualTargets(sid, surface);
        isVirtualSurface = true;
      }
    }

    // Compute surface-level score for:
    // 1. Virtual surfaces — allows general queries to match surface handlers
    // 2. Explicitly targeted surfaces (surface_id provided) — the LLM already
    //    identified the surface, so all its targets should be considered even
    //    when the instruction is generic (e.g. "what actions can I do?")
    const shouldScoreSurface = isVirtualSurface || Boolean(surface_id);
    const scoringSurface = shouldScoreSurface ? registry?.getSurface?.(sid) : null;
    let surfaceScore = scoringSurface ? computeSurfaceScore(normalizedInstruction, scoringSurface, sid) : 0;

    // When the LLM explicitly targets a surface, guarantee a minimum base score
    // so all targets are evaluated even with generic/translated instructions.
    if (surface_id && surfaceScore === 0) {
      surfaceScore = 1;
    }

    for (const target of targets) {
      const targetScore = computeRelevanceScore(normalizedInstruction, target);
      const effectiveScore = targetScore + surfaceScore;

      if (effectiveScore <= 0) {
        continue;
      }

      const methods = target.methods || [];
      for (const method of methods) {
        // Skip method-keyword filtering when:
        // 1. Virtual surface and surface already scored — general query about a surface
        // 2. Specific surface_id was provided — LLM already identified the target surface
        const methodOk = (isVirtualSurface || Boolean(surface_id)) && surfaceScore > 0
          ? true
          : isMethodRelevant(normalizedInstruction, method);

        if (!methodOk) {
          continue;
        }

        candidates.push({
          target_ref: target.ref,
          surface_id: sid,
          method,
          description: target.label || target.ref,
          score: effectiveScore,
          arguments_hint: getArgumentsHint(method, target),
        });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  return { ok: true, candidates: candidates.slice(0, 10) };
};

const METHOD_KEYWORDS = {
  click: ['click', 'press', 'tap', 'hit', 'open', 'activate', 'trigger', 'button'],
  fill: ['fill', 'type', 'enter', 'input', 'write', 'set'],
  select: ['select', 'choose', 'pick', 'option'],
  hover: ['hover', 'mouse over', 'point'],
  scroll: ['scroll', 'go to', 'move to'],
  toggle: ['toggle', 'switch', 'enable', 'disable', 'turn on', 'turn off', 'activar', 'desactivar'],
  clear: ['clear', 'reset', 'empty', 'remove', 'limpiar', 'borrar', 'deselect'],
  getValue: ['get', 'read', 'check', 'ver', 'leer', 'obtener', 'value', 'valor', 'estado', 'state', 'current', 'actual', 'cuál', 'what', 'show me'],
  // Surface-level handler methods
  applyFilter: ['filter', 'filtrar', 'show', 'mostrar', 'hide', 'ocultar', 'deleted', 'eliminados', 'buscar', 'search'],
  selectRows: ['select', 'seleccionar', 'rows', 'filas', 'items', 'pick', 'elegir', 'mark'],
  open: ['open', 'abrir', 'show', 'mostrar', 'launch', 'display'],
  close: ['close', 'cerrar', 'hide', 'ocultar', 'dismiss'],
  setFields: ['set', 'fill', 'rellenar', 'write', 'escribir', 'field', 'campo', 'form', 'formulario'],
  submit: ['submit', 'enviar', 'guardar', 'save', 'confirm', 'confirmar'],
  undo: ['undo', 'deshacer', 'revert', 'revertir'],
};

/**
 * Scores how relevant an instruction is to a surface as a whole.
 * Checks against the surface id, label, type, and description.
 * Used to allow general queries ("what can I do in the grid?") to match virtual surfaces.
 */
function computeSurfaceScore(instruction, surface, surfaceId) {
  let score = 0;
  const fields = [
    (surface?.id || surfaceId || '').toLowerCase(),
    (surface?.label || '').toLowerCase(),
    (surface?.type || '').toLowerCase(),
    (surface?.description || '').toLowerCase(),
  ].join(' ');

  const words = instruction.split(/\s+/);
  for (const word of words) {
    if (word.length < 3) continue;
    if (fields.includes(word)) {
      score += 2;
    }
  }
  return score;
}

function computeRelevanceScore(instruction, target) {
  let score = 0;
  const label = (target.label || '').toLowerCase();
  const ref = (target.ref || '').toLowerCase();

  const words = instruction.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) {
      continue;
    }
    if (label.includes(word)) {
      score += 2;
    }
    if (ref.includes(word)) {
      score += 1;
    }
  }

  return score;
}

function isMethodRelevant(instruction, method) {
  const keywords = METHOD_KEYWORDS[method] || [method];
  return keywords.some((keyword) => instruction.includes(keyword));
}

function getArgumentsHint(method, target) {
  if (method === 'fill' || method === 'select') {
    return ['<value>'];
  }
  if (method === 'applyFilter') {
    return ['{ showDeleted: true | false }'];
  }
  if (method === 'selectRows') {
    return ['["<row_id_1>", "<row_id_2>", ...]'];
  }
  if (method === 'setFields') {
    return ['{ fieldName: value, ... }'];
  }
  return undefined;
}

/**
 * Builds virtual targets from surface-level handlers when no explicit targets are registered.
 * This allows observe.ui to discover actions on surfaces like grids and forms that expose
 * operations through handlers rather than individual DOM targets.
 * @param {string} surfaceId
 * @param {Object} surface
 * @returns {Array}
 */
function buildVirtualTargets(surfaceId, surface) {
  const HANDLER_META = {
    applyFilter: { label: 'Apply Filter', type: 'action' },
    selectRows: { label: 'Select Rows', type: 'action' },
    open: { label: 'Open', type: 'action' },
    close: { label: 'Close', type: 'action' },
    setFields: { label: 'Set Fields', type: 'form-action' },
    submit: { label: 'Submit Form', type: 'form-action' },
    undo: { label: 'Undo', type: 'action' },
  };

  return Object.keys(surface.handlers)
    .filter((handlerName) => typeof surface.handlers[handlerName] === 'function')
    .map((handlerName) => {
      const meta = HANDLER_META[handlerName] || { label: handlerName, type: 'action' };
      return {
        ref: `${surfaceId}.${handlerName}`,
        type: meta.type,
        label: `${surface.label || surfaceId} — ${meta.label}`,
        methods: [handlerName],
        virtual: true,
      };
    });
}
