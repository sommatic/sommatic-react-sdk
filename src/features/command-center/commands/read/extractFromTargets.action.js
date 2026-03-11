/**
 * Extracts data from published targets (inputs, labels, values).
 * Resolves each target reference and extracts its current value/state.
 * @param {Object} args
 * @param {Array<string>} [args.targets] - Array of target references to extract from.
 * @param {Array<string>} [args.target_refs] - Alias for targets (used by command schema).
 * @param {Object} [args.schema] - Optional schema to map extracted values.
 * @param {string} [args.schema_id] - Reserved for named schema lookup (future use).
 * @param {Object} registry - Command Center registry.
 * @returns {Object} Extracted data from targets.
 */
export const action = (args, registry) => {
  const { schema } = args || {};
  const targets = Array.isArray(args?.targets) ? args.targets : args?.target_refs;

  if (!Array.isArray(targets) || targets.length === 0) {
    return { ok: false, error: { code: 'MISSING_TARGETS', message: 'targets array is required' } };
  }

  const extractedItems = [];
  const errors = [];

  for (const targetRef of targets) {
    let resolved = registry?.resolveTarget?.(targetRef);
    let resolvedRef = targetRef;
    if (!resolved && registry?.resolveTargetFuzzy) {
      resolved = registry.resolveTargetFuzzy(targetRef);
      if (resolved) {
        const { surface, target } = resolved;
        resolvedRef = `${surface.id}::${target.ref || target.id}`;
      }
    }
    if (!resolved) {
      errors.push({ target_ref: targetRef, error: 'Target not found' });
      continue;
    }

    const { target } = resolved;
    const item = {
      ref: targetRef,
      label: target.label || '',
      type: target.type || 'unknown',
    };
    if (resolvedRef !== targetRef) {
      item.resolved_ref = resolvedRef;
    }

    if (target.handlers?.getValue) {
      try {
        item.value = target.handlers.getValue();
      } catch (err) {
        item.value = null;
        item.error = err.message;
      }
    } else if (target.value !== undefined) {
      item.value = target.value;
    }

    extractedItems.push(item);
  }

  let data = extractedItems;
  if (schema && typeof schema === 'object' && schema.properties) {
    const mapped = {};
    for (const [key, descriptor] of Object.entries(schema.properties)) {
      const sourceRef = descriptor?.source_ref || key;
      const matchingItem = extractedItems.find(
        (item) => item.ref === sourceRef || item.resolved_ref === sourceRef,
      );
      mapped[key] = matchingItem?.value ?? null;
    }
    data = mapped;
  }

  return {
    ok: errors.length === 0,
    data,
    errors: errors.length > 0 ? errors : undefined,
  };
};
