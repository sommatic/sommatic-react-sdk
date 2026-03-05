/**
 * Pulls a snapshot from a specific InsightSource, respecting TTL/cache.
 * @param {Object} args
 * @param {string} args.source_id - The ID of the InsightSource.
 * @param {string} [args.scope] - Optional scope context.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} A ContextBlock with the snapshot data.
 */
export const action = (args, registry) => {
  const { source_id } = args || {};

  if (!source_id) {
    return { ok: false, error: { code: 'MISSING_SOURCE_ID', message: 'source_id is required' } };
  }

  if (!registry?.getSnapshot) {
    return { ok: false, error: { code: 'REGISTRY_UNAVAILABLE', message: 'Registry not available' } };
  }

  const block = registry.getSnapshot(source_id);
  if (!block) {
    return { ok: false, error: { code: 'SOURCE_NOT_FOUND', message: `InsightSource [${source_id}] not found` } };
  }

  return { ok: true, block };
};
