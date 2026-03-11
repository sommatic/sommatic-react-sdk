/**
 * Sets multiple field values on a FormSurface.
 *
 * Resolution strategy for each field key:
 * 1. Try resolveTarget(surface_id::key) — exact match by target id.
 * 2. Try resolveTargetFuzzy(surface_id::key) — fuzzy match by label/alias/trigram/bridge.
 * 3. If a target with a `fill` handler is found via either step, call fill(value) directly.
 *    This bypasses the form's key-based setFields and guarantees the correct React setter
 *    is invoked regardless of whether the model sent an id, a label, or a translated name.
 * 4. Keys that do not resolve to any target are batched and passed to surface.handlers.setFields
 *    for backward compatibility (legacy keys already matching form state properties).
 *
 * @param {Object} args
 * @param {string} args.surface_id - The ID of the form surface.
 * @param {Object} args.fields - Key-value pairs of field names and values.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with applied fields.
 */
export const action = async (args, registry) => {
  const { surface_id, fields } = args || {};

  if (!surface_id) {
    return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };
  }

  if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
    return { ok: false, error: { code: 'MISSING_FIELDS', message: 'fields object is required and must not be empty' } };
  }

  const surface = registry?.getSurface?.(surface_id);
  if (!surface) {
    return { ok: false, error: { code: 'SURFACE_NOT_FOUND', message: `Surface [${surface_id}] not found` } };
  }

  // --- Per-field target resolution ---
  // For each key, attempt to resolve it to a target and call fill() directly.
  // This ensures labels, translations, and aliases always reach the correct setter.
  const resolvedByTarget = [];
  const unresolved = {};

  for (const [key, value] of Object.entries(fields)) {
    const targetRef = `${surface_id}::${key}`;
    let resolved = registry?.resolveTarget?.(targetRef);
    if (!resolved && registry?.resolveTargetFuzzy) {
      resolved = registry.resolveTargetFuzzy(targetRef);
    }
    if (resolved?.target?.handlers?.fill) {
      try {
        await resolved.target.handlers.fill(value);
        resolvedByTarget.push(key);
      } catch (err) {
        // Fall through to the surface-level setFields so the key still gets a chance.
        unresolved[key] = value;
      }
    } else {
      unresolved[key] = value;
    }
  }

  // --- Surface-level setFields for remaining keys ---
  let applied;
  if (Object.keys(unresolved).length > 0) {
    if (!surface.handlers?.setFields) {
      if (resolvedByTarget.length === 0) {
        return {
          ok: false,
          error: { code: 'NO_SET_FIELDS_HANDLER', message: `Surface [${surface_id}] has no setFields handler` },
        };
      }
      // Some fields were already set via fill(); treat unresolved as a soft warning.
    } else {
      try {
        applied = await surface.handlers.setFields(unresolved);
      } catch (err) {
        if (resolvedByTarget.length === 0) {
          return { ok: false, error: { code: 'SET_FIELDS_FAILED', message: err.message } };
        }
      }
    }
  }

  const allApplied = [...resolvedByTarget, ...(applied?.applied || Object.keys(unresolved))];

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.set_fields',
    args,
    reversible: !!surface.handlers?.undo,
    previous_values: applied?.previous_values,
  });

  return {
    ok: true,
    title: `Set ${allApplied.length} field(s) on [${surface_id}]`,
    applied: allApplied,
    receipt_id: receipt?.id,
  };
};
