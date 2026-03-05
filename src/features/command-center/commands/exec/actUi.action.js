/**
 * Executes a deterministic UI action on a registered target.
 * Supported methods: click, fill, select, hover, scroll, toggle, clear.
 * @param {Object} args
 * @param {string} args.target_ref - Reference to the target element.
 * @param {string} args.method - Action method to execute.
 * @param {string[]} [args.arguments] - Optional arguments for the method.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with execution result.
 */
export const action = async (args, registry) => {
  const { target_ref, method, arguments: methodArgs } = args || {};

  if (!target_ref) {
    return { ok: false, error: { code: 'MISSING_TARGET_REF', message: 'target_ref is required' } };
  }

  if (!method) {
    return { ok: false, error: { code: 'MISSING_METHOD', message: 'method is required' } };
  }

  let resolved = registry?.resolveTarget?.(target_ref);
  if (!resolved && registry?.resolveTargetFuzzy) {
    resolved = registry.resolveTargetFuzzy(target_ref);
  }
  if (!resolved) {
    return { ok: false, error: { code: 'TARGET_NOT_FOUND', message: `Target [${target_ref}] not found in any surface` } };
  }

  const { target } = resolved;
  const handler = target.handlers?.[method];

  if (!handler) {
    return {
      ok: false,
      error: {
        code: 'METHOD_NOT_SUPPORTED',
        message: `Method [${method}] not supported on target [${target_ref}]. Available: ${Object.keys(target.handlers || {}).join(', ')}`,
      },
    };
  }

  // Normalize methodArgs to always be an array to guard against the model
  // sending a bare value (e.g. "John") instead of an array (["John"]).
  const normalizedArgs = Array.isArray(methodArgs)
    ? methodArgs
    : methodArgs !== undefined && methodArgs !== null
      ? [methodArgs]
      : [];

  let result;
  try {
    result = await handler(...normalizedArgs);
  } catch (err) {
    return { ok: false, error: { code: 'EXECUTION_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.ui.act',
    args,
    reversible: !!target.handlers?.undo,
    undo_args: { target_ref, method: 'undo' },
    result,
  });

  return { ok: true, title: `Executed [${method}] on [${target_ref}]`, data: result, receipt_id: receipt?.id };
};
