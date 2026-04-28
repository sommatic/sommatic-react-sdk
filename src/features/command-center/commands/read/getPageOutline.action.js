/**
 * Retrieves a page outline using insight sources (non-DOM).
 *
 * Combines the current `page-context` snapshot with a summary of all registered
 * insight sources and surfaces. If `page-context` is not published on this page,
 * falls back to the first registered InsightSource so callers always get
 * something actionable instead of an empty outline.
 *
 * @param {Object|null} context - Snapshot from `getContext('page-context')`.
 * @param {Object} [args] - Optional arguments.
 * @param {string} [args.detail_level] - 'low' or 'high'.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} Page outline.
 */
export const action = (context, args, registry) => {
  const detailLevel = args?.detail_level || 'low';

  const allSources = registry?.listAllSources?.() || [];

  let pageContext = context;
  let pageContextSourceId = 'page-context';
  let fallbackNote;

  if (!pageContext && allSources.length > 0) {
    const fallback = allSources[0];
    const snapshot = registry?.getSnapshot?.(fallback.id);
    pageContext = snapshot?.payload ?? null;
    pageContextSourceId = fallback.id;
    fallbackNote = `'page-context' is not registered on this page; using source [${fallback.id}] as the page summary.`;
  }

  const outline = {
    route: typeof window !== 'undefined' ? window.location.pathname : null,
    page_context_source_id: pageContext ? pageContextSourceId : null,
    page_context: pageContext,
    sources: [],
  };

  if (fallbackNote) {
    outline.note = fallbackNote;
  }

  if (!registry?.listAllSources) {
    return outline;
  }

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
