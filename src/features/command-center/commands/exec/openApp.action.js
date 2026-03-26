/**
 * Opens a Sommatic App by its slug (App Engine) or by a registered surface ID (legacy HITL).
 *
 * When the target is an App Engine app (no matching surface found), the action returns
 * a special `type: 'app-embed'` result so the Command Center can render the app inline.
 *
 * @param {Object} args
 * @param {string} [args.app_slug] - App Engine app slug (e.g. 'sommatic-tabular-workbench').
 * @param {string} [args.surface_id] - Registered HITL surface ID (legacy).
 * @param {string} [args.app_id] - Alias for surface_id (backward compat).
 * @param {Object} [args.input_data] - Data payload to send to the app.
 * @param {string} [args.route_path] - Internal route to open within the app.
 * @param {Object} [args.initial_state] - Legacy alias for input_data.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with app outputs or an app-embed descriptor.
 */
export const action = async (args, registry) => {
  const { app_id, surface_id, app_slug, input_data, route_path, initial_state } = args || {};
  const resolvedId = app_slug || app_id || surface_id;

  if (!resolvedId) {
    return { ok: false, error: { code: 'MISSING_APP_ID', message: 'app_slug or surface_id is required' } };
  }

  // Legacy path: registered surface with an open handler
  const surface = registry?.getSurface?.(resolvedId);
  if (surface?.handlers?.open) {
    let outputs;
    try {
      outputs = await surface.handlers.open(initial_state || input_data);
    } catch (err) {
      return { ok: false, error: { code: 'APP_OPEN_FAILED', message: err.message } };
    }

    const receipt = registry.pushReceipt?.({
      command_id: 'command_center.exec.app.open',
      args,
      reversible: false,
      outputs,
    });

    return { ok: true, title: `Opened app [${resolvedId}]`, outputs, receipt_id: receipt?.id };
  }

  // New path: App Engine app — return embed descriptor for inline rendering
  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.app.open',
    args,
    reversible: false,
  });

  return {
    ok: true,
    type: 'app-embed',
    title: `Opening app [${resolvedId}]`,
    app_embed: {
      app_slug: resolvedId,
      route_path: route_path || '/',
      input_payload: input_data || initial_state || {},
      launch_mode: 'command-center',
    },
    receipt_id: receipt?.id,
  };
};
