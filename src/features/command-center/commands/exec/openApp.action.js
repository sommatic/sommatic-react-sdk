/**
 * Opens a Sommatic App by its slug (App Engine) or by a registered surface ID (legacy HITL).
 *
 * Resolution order for the requested app:
 * 1. Exact match on a registered HITL surface (legacy path with handlers.open).
 * 2. `app_slug` lookup against `registry.appCatalog` (when populated by the host).
 * 3. `app_name` (case-insensitive) match against the catalog when no slug was provided.
 * 4. Soft normalization of `app_slug` (lowercase + kebab-case) to forgive minor model errors.
 * 5. As a last resort, dispatch the embed with the slug as-is so the runtime decides.
 *
 * When the matched catalog entry has a `default_route` and no explicit `route_path`
 * was passed, the catalog default is used.
 *
 * @param {Object} args
 * @param {string} [args.app_slug] - App Engine app slug.
 * @param {string} [args.app_name] - Human-readable app name (catalog `name`). Used to recover the slug when only the name is provided.
 * @param {string} [args.surface_id] - Registered HITL surface ID (legacy).
 * @param {string} [args.app_id] - Alias for surface_id (backward compat).
 * @param {Object} [args.input_data] - Data payload to send to the app.
 * @param {string} [args.route_path] - Internal route to open within the app.
 * @param {Object} [args.initial_state] - Legacy alias for input_data.
 * @param {Object} registry - Command Center registry. May expose `appCatalog`.
 * @returns {Promise<Object>} Receipt with app outputs or an app-embed descriptor.
 */
export const action = async (args, registry) => {
  const { app_id, surface_id, app_slug, app_name, input_data, route_path, initial_state } = args || {};

  let resolvedId = app_slug || app_id || surface_id;

  if (!resolvedId && !app_name) {
    return { ok: false, error: { code: 'MISSING_APP_ID', message: 'app_slug, app_name or surface_id is required' } };
  }

  // Legacy path: registered surface with an open handler
  if (resolvedId) {
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
  }

  // App Engine path: resolve through registry.appCatalog when available.
  const catalog = registry?.appCatalog || {};
  const catalogSlugs = Object.keys(catalog);

  // (a) If we have a slug, see if it matches the catalog directly. If not, try
  // a soft normalization (lowercase + kebab) to forgive minor model errors.
  if (resolvedId && catalogSlugs.length > 0 && !catalog[resolvedId]) {
    const normalized = String(resolvedId)
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (catalog[normalized]) {
      resolvedId = normalized;
    }
  }

  // (b) If we still have no slug but were given an app_name, resolve it
  // case-insensitively against the catalog `name` field.
  if (!catalog[resolvedId] && app_name && catalogSlugs.length > 0) {
    const target = String(app_name).trim().toLowerCase();
    const found = catalogSlugs.find((slug) => {
      const entry = catalog[slug];
      return String(entry?.name || '').trim().toLowerCase() === target;
    });
    if (found) {
      resolvedId = found;
    }
  }

  if (!resolvedId) {
    return { ok: false, error: { code: 'APP_NOT_RESOLVED', message: `Could not resolve an app from app_name [${app_name}].` } };
  }

  const catalogEntry = catalog[resolvedId];
  const effectiveRoutePath = route_path || catalogEntry?.default_route || '/';

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
      route_path: effectiveRoutePath,
      input_payload: input_data || initial_state || {},
      launch_mode: 'command-center',
    },
    receipt_id: receipt?.id,
  };
};
