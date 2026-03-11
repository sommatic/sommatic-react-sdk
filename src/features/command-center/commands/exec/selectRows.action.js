/**
 * Selects specific rows/items in a Grid surface.
 * Supports selection by row IDs directly, or by matching a field value (e.g. slug, name)
 * resolved from the current page-context snapshot.
 *
 * @param {Object} args
 * @param {string} args.surface_id - The ID of the grid surface.
 * @param {string[]} [args.row_ids] - Array of exact row IDs to select.
 * @param {string[]} [args.identifiers] - Values to match against match_field (e.g. slugs, names).
 * @param {string} [args.match_field] - Field name to match identifiers against (e.g. 'slug', 'name').
 *   Defaults to 'id'. Resolved from 'page-context' snapshot items.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with selection result.
 */
export const action = async (args, registry) => {
  const { surface_id, row_ids, identifiers, match_field = 'id' } = args || {};

  if (!surface_id) {
    return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };
  }

  const surface = registry?.getSurface?.(surface_id);
  if (!surface) {
    return { ok: false, error: { code: 'SURFACE_NOT_FOUND', message: `Surface [${surface_id}] not found` } };
  }

  if (!surface.handlers?.selectRows) {
    return { ok: false, error: { code: 'NO_SELECT_HANDLER', message: `Surface [${surface_id}] has no selectRows handler` } };
  }

  // Resolve identifiers (e.g. slugs, names) to actual row IDs using the snapshot.
  let resolvedIds = Array.isArray(row_ids) ? [...row_ids] : [];

  if (Array.isArray(identifiers) && identifiers.length > 0 && match_field !== 'id') {
    const snapshot = registry?.getSnapshot?.('page-context');
    const items = snapshot?.payload?.items;

    if (!Array.isArray(items)) {
      return {
        ok: false,
        error: {
          code: 'NO_SNAPSHOT_ITEMS',
          message: `Cannot resolve ${match_field} identifiers: page-context snapshot has no items array. Navigate to a list page first.`,
        },
      };
    }

    const normalizedIdentifiers = identifiers.map((v) => String(v).toLowerCase());
    const matched = items.filter((item) =>
      normalizedIdentifiers.includes(String(item[match_field] ?? '').toLowerCase()),
    );

    if (matched.length === 0) {
      return {
        ok: false,
        error: {
          code: 'NO_MATCHING_ITEMS',
          message: `No items found with ${match_field} in [${identifiers.join(', ')}]. Available ${match_field}s: ${items.map((i) => i[match_field]).filter(Boolean).join(', ')}`,
        },
      };
    }

    resolvedIds = [...resolvedIds, ...matched.map((item) => item.id)];
  }

  if (resolvedIds.length === 0) {
    return {
      ok: false,
      error: { code: 'MISSING_ROW_IDS', message: 'Provide row_ids or identifiers + match_field to select rows.' },
    };
  }

  let result;
  try {
    result = await surface.handlers.selectRows(resolvedIds);
  } catch (err) {
    return { ok: false, error: { code: 'SELECT_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.select_rows',
    args,
    reversible: !!surface.handlers?.clearSelection,
  });

  return {
    ok: true,
    title: `Selected ${resolvedIds.length} row(s) on [${surface_id}]`,
    resolved_ids: resolvedIds,
    data: result,
    receipt_id: receipt?.id,
  };
};
