/**
 * Opens a HITL App (wizard, grid, or custom UI) and waits for its outputs.
 * The app is located by searching for a registered surface of type 'app'.
 * @param {Object} args
 * @param {string} args.app_id - The app identifier or surface ID.
 * @param {Object} [args.initial_state] - Initial state to pass to the app.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with app outputs.
 */
export const action = async (args, registry) => {
  const { app_id, initial_state } = args || {};

  if (!app_id) {
    return { ok: false, error: { code: 'MISSING_APP_ID', message: 'app_id is required' } };
  }

  const surface = registry?.getSurface?.(app_id);
  if (!surface) {
    return { ok: false, error: { code: 'APP_NOT_FOUND', message: `App [${app_id}] not found in surface registry` } };
  }

  if (!surface.handlers?.open) {
    return { ok: false, error: { code: 'NO_OPEN_HANDLER', message: `App [${app_id}] has no open handler` } };
  }

  let outputs;
  try {
    outputs = await surface.handlers.open(initial_state);
  } catch (err) {
    return { ok: false, error: { code: 'APP_OPEN_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.app.open',
    args,
    reversible: false,
    outputs,
  });

  return { ok: true, title: `Opened app [${app_id}]`, outputs, receipt_id: receipt?.id };
};
