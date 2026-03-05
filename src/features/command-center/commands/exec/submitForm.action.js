/**
 * Submits a published form surface without needing to interact with the DOM directly.
 * @param {Object} args
 * @param {string} args.surface_id - The ID of the form surface to submit.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with submission result.
 */
export const action = async (args, registry) => {
  const { surface_id } = args || {};

  if (!surface_id) {
    return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };
  }

  const surface = registry?.getSurface?.(surface_id);
  if (!surface) {
    return { ok: false, error: { code: 'SURFACE_NOT_FOUND', message: `Surface [${surface_id}] not found` } };
  }

  if (!surface.handlers?.submit) {
    return { ok: false, error: { code: 'NO_SUBMIT_HANDLER', message: `Surface [${surface_id}] has no submit handler` } };
  }

  let result;
  try {
    result = await surface.handlers.submit();
  } catch (err) {
    return { ok: false, error: { code: 'SUBMIT_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.submit_form',
    args,
    reversible: false,
    result,
  });

  return { ok: true, title: `Submitted form [${surface_id}]`, data: result, receipt_id: receipt?.id };
};
