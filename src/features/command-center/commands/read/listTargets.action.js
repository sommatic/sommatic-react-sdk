/**
 * Lists all targets within a specific published surface.
 * @param {Object} args
 * @param {string} args.surface_id - The ID of the surface to inspect.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} { surface_id, targets: Array<{ ref, id, label, type, methods, target_ref }> }
 */
export const action = (args, registry) => {
  const { surface_id } = args || {};

  if (!surface_id) {
    return { ok: false, error: { code: 'MISSING_SURFACE_ID', message: 'surface_id is required' } };
  }

  if (!registry?.getTargets) {
    return { surface_id, targets: [] };
  }

  const rawTargets = registry.getTargets(surface_id);
  const targets = rawTargets.map((t) => {
    const ref = t.ref || t.id || '';
    return {
      ref,
      id: ref,
      label: t.label || '',
      type: t.type || 'unknown',
      methods: t.methods || [],
      target_ref: `${surface_id}::${ref}`,
    };
  });

  return { surface_id, targets };
};
