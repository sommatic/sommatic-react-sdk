/**
 * Executes a sequence of UI actions on registered targets.
 * Each step is executed sequentially; execution halts on first error unless all steps are independent.
 * @param {Object} args
 * @param {Array<Object>} args.steps - Array of action steps.
 * @param {string} args.steps[].target_ref - Target reference.
 * @param {string} args.steps[].method - Action method.
 * @param {string[]} [args.steps[].arguments] - Optional method arguments.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Aggregated receipt with step results.
 */
export const action = async (args, registry) => {
  const { steps } = args || {};

  if (!Array.isArray(steps) || steps.length === 0) {
    return { ok: false, error: { code: 'MISSING_STEPS', message: 'steps array is required and must not be empty' } };
  }

  const stepResults = [];
  let hasError = false;

  for (const step of steps) {
    const { target_ref, method, arguments: methodArgs } = step;

    if (!target_ref || !method) {
      stepResults.push({ target_ref, method, ok: false, error: 'Missing target_ref or method' });
      hasError = true;
      continue;
    }

    let resolved = registry?.resolveTarget?.(target_ref);
    if (!resolved && registry?.resolveTargetFuzzy) {
      resolved = registry.resolveTargetFuzzy(target_ref);
    }
    if (!resolved) {
      stepResults.push({ target_ref, method, ok: false, error: `Target [${target_ref}] not found` });
      hasError = true;
      continue;
    }

    const handler = resolved.target.handlers?.[method];
    if (!handler) {
      stepResults.push({ target_ref, method, ok: false, error: `Method [${method}] not supported` });
      hasError = true;
      continue;
    }

    // Normalize methodArgs to always be an array to guard against the model
    // sending a bare value instead of an array.
    const normalizedArgs = Array.isArray(methodArgs)
      ? methodArgs
      : methodArgs !== undefined && methodArgs !== null
        ? [methodArgs]
        : [];

    try {
      const result = await handler(...normalizedArgs);
      stepResults.push({ target_ref, method, ok: true, result });
    } catch (err) {
      stepResults.push({ target_ref, method, ok: false, error: err.message });
      hasError = true;
    }
  }

  const receipt = registry?.pushReceipt?.({
    command_id: 'command_center.exec.ui.act_batch',
    args,
    reversible: false,
    step_count: steps.length,
    success_count: stepResults.filter((r) => r.ok).length,
  });

  return {
    ok: !hasError,
    title: `Executed ${stepResults.filter((r) => r.ok).length}/${steps.length} steps`,
    step_results: stepResults,
    receipt_id: receipt?.id,
  };
};
