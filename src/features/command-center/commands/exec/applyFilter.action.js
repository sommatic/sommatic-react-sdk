/**
 * Applies filters on a Grid/List surface.
 * @param {Object} args
 * @param {string} args.surface_id - The ID of the grid/list surface.
 * @param {Object} args.filter - Filter criteria to apply.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with filter application result.
 */
export const action = async (args, registry) => {
  const { surface_id, filter } = args || {};

  if (!surface_id) {
    return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };
  }

  if (!filter) {
    return { ok: false, error: { code: 'MISSING_FILTER', message: 'filter object is required' } };
  }

  const surface = registry?.getSurface?.(surface_id);
  if (!surface) {
    return { ok: false, error: { code: 'SURFACE_NOT_FOUND', message: `Surface [${surface_id}] not found` } };
  }

  if (!surface.handlers?.applyFilter) {
    return { ok: false, error: { code: 'NO_FILTER_HANDLER', message: `Surface [${surface_id}] has no applyFilter handler` } };
  }

  let result;
  try {
    result = await surface.handlers.applyFilter(filter);
  } catch (err) {
    return { ok: false, error: { code: 'FILTER_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.apply_filter',
    args,
    reversible: !!surface.handlers?.clearFilter,
    previous_filter: result?.previous_filter,
  });

  return { ok: true, title: `Applied filter on [${surface_id}]`, data: result, receipt_id: receipt?.id };
};
