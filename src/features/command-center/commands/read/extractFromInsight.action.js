/**
 * Extracts structured data from an InsightSource by applying a schema.
 * If a schema object is provided, only matching fields are extracted from the payload.
 * @param {Object} args
 * @param {string} args.source_id - The InsightSource to extract from.
 * @param {Object} [args.schema] - Schema describing which fields to extract.
 * @param {string} [args.schema_id] - Reserved for named schema lookup (future use).
 * @param {Object} registry - Command Center registry.
 * @returns {Object} Extracted structured data.
 */
export const action = (args, registry) => {
  const { source_id, schema } = args || {};

  if (!source_id) {
    return { ok: false, error: { code: 'MISSING_SOURCE_ID', message: 'source_id is required' } };
  }

  const block = registry?.getSnapshot?.(source_id);
  if (!block) {
    return { ok: false, error: { code: 'SOURCE_NOT_FOUND', message: `InsightSource [${source_id}] not found or has no data` } };
  }

  const payload = block.payload;
  if (!payload) {
    return { ok: true, data: null, source_id };
  }

  if (!schema || typeof schema !== 'object') {
    return { ok: true, data: payload, source_id };
  }

  const extracted = {};
  const schemaFields = schema.properties || schema;
  for (const [key, descriptor] of Object.entries(schemaFields)) {
    const sourceKey = descriptor?.source_key || key;
    if (payload[sourceKey] !== undefined) {
      extracted[key] = payload[sourceKey];
    } else {
      extracted[key] = resolveNestedValue(payload, sourceKey);
    }
  }

  return { ok: true, data: extracted, source_id };
};

function resolveNestedValue(obj, path) {
  if (!path || !obj) {
    return undefined;
  }

  return path.split('.').reduce((current, segment) => {
    if (current === null || current === undefined) {
      return undefined;
    }
    return current[segment];
  }, obj);
}
