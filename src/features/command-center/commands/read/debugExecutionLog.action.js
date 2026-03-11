/**
 * Returns the last N command execution results (receipts) for debugging.
 * @param {Object} args
 * @param {number} [args.limit=10] - Number of entries to return.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} { entries: Array }
 */
export const action = (args, registry) => {
  const limit = args?.limit || 10;

  if (!registry?.getExecutionLog) {
    return { entries: [] };
  }

  return { entries: registry.getExecutionLog(limit) };
};
