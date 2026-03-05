/**
 * Retrieves a page outline using insight sources (non-DOM).
 * Combines the page context with a summary of all registered insight sources.
 * @param {Object} context - The page context retrieved from getContext('page-context').
 * @param {Object} [args] - Optional arguments.
 * @param {string} [args.detail_level] - 'low' or 'high' detail level.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} Page outline with context and available sources.
 */
export const action = (context, args, registry) => {
  const detailLevel = args?.detail_level || 'low';

  const outline = {
    route: window.location.pathname,
    page_context: context || null,
    sources: [],
  };

  if (!registry?.listAllSources) {
    return outline;
  }

  const allSources = registry.listAllSources();
  if (detailLevel === 'high') {
    outline.sources = allSources.map((source) => {
      const snapshot = registry.getSnapshot(source.id);
      return {
        id: source.id,
        description: source.description,
        has_data: !!snapshot?.payload,
        payload_keys: snapshot?.payload ? Object.keys(snapshot.payload) : [],
      };
    });
  } else {
    outline.sources = allSources;
  }

  const surfaces = registry.getSurfaces?.() || [];
  if (surfaces.length > 0) {
    outline.surfaces = surfaces;
  }

  return outline;
};
