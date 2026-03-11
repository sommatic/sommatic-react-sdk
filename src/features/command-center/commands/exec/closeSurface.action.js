/**
 * Closes a published surface (modal, panel, drawer) by its ID.
 * @param {Object} args
 * @param {string} args.surface_id - The surface to close.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with success status.
 */
export const action = async (args, registry) => {
  const { surface_id } = args || {};

  if (!surface_id) {
    return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };
  }

  const surface = registry?.getSurface?.(surface_id);
  let surfaceResolved = surface;
  if (!surfaceResolved) {
    const normalize = (s) =>
      String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[\s_-]+/g, ' ')
        .trim();
    const search = normalize(surface_id);
    const all = registry?.getSurfaces?.() || [];
    const match = all.find((s) => {
      const nId = normalize(s.id);
      const nLabel = normalize(s.label || '');
      return (
        nId === search ||
        nLabel === search ||
        nId.includes(search) ||
        search.includes(nId) ||
        nLabel.includes(search) ||
        search.includes(nLabel)
      );
    });
    if (match) surfaceResolved = registry.getSurface(match.id);
  }
  if (!surfaceResolved) {
    return { ok: false, error: { code: 'SURFACE_NOT_FOUND', message: `Surface [${surface_id}] not found` } };
  }

  if (!surfaceResolved.handlers?.close) {
    return {
      ok: false,
      error: { code: 'NO_CLOSE_HANDLER', message: `Surface [${surface_id}] has no close handler` },
    };
  }

  try {
    await surfaceResolved.handlers.close();
  } catch (err) {
    return { ok: false, error: { code: 'CLOSE_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.close_surface',
    args,
    reversible: false,
  });

  return { ok: true, title: `Closed surface [${surface_id}]`, receipt_id: receipt?.id };
};
