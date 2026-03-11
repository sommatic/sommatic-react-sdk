/**
 * Returns metadata and an inferred schema for a specific InsightSource.
 * @param {Object} args
 * @param {string} args.source_id - The ID of the InsightSource to describe.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} Source metadata or error.
 */
export const action = (args, registry) => {
  const { source_id } = args || {};

  if (!source_id) {
    return { ok: false, error: { code: 'MISSING_SOURCE_ID', message: 'source_id is required' } };
  }

  if (!registry?.getSourceMetadata) {
    return { ok: false, error: { code: 'REGISTRY_UNAVAILABLE', message: 'Registry not available' } };
  }

  const metadata = registry.getSourceMetadata(source_id);
  if (!metadata) {
    return { ok: false, error: { code: 'SOURCE_NOT_FOUND', message: `InsightSource [${source_id}] not found` } };
  }

  const snapshot = registry.getSnapshot(source_id);
  const inferredSchema = snapshot?.payload ? Object.keys(snapshot.payload) : [];

  return {
    ok: true,
    source: {
      ...metadata,
      inferred_fields: inferredSchema,
      has_data: !!snapshot?.payload,
      captured_at: snapshot?.captured_at || null,
    },
  };
};
