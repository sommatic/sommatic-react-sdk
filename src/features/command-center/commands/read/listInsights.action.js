/**
 * Lists all available InsightSources registered in the Command Center.
 * @param {Object} args
 * @param {string} [args.scope_filter] - Optional scope filter to narrow results.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} { sources: Array<{ id, description }> }
 */
export const action = (args, registry) => {
  if (!registry?.listAllSources) {
    return { sources: [] };
  }

  let sources = registry.listAllSources();

  const scopeFilter = args?.scope_filter;
  if (scopeFilter) {
    sources = sources.filter(
      (source) =>
        source.id.includes(scopeFilter) ||
        (source.description || '').toLowerCase().includes(scopeFilter.toLowerCase()),
    );
  }

  return { sources };
};
