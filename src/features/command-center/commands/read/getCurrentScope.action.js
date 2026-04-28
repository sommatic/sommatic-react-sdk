/**
 * Retrieves the current scope context.
 *
 * Primary: returns the snapshot published as `page-context` by the active page's
 * `.sommatic.jsx` wrapper. If that source is not registered, falls back to the
 * first registered InsightSource so the command never returns null on pages that
 * have not yet adopted the canonical id.
 *
 * @param {Object|null} context - Snapshot from `getContext('page-context')`.
 * @param {Object} [registry] - Command Center registry (used for fallback discovery).
 * @returns {Object} Scope envelope with route + payload + source attribution.
 */
export const action = (context, registry) => {
  if (context) {
    return {
      ok: true,
      source_id: 'page-context',
      route: typeof window !== 'undefined' ? window.location.pathname : null,
      context,
    };
  }

  const sources = registry?.listAllSources?.() || [];
  if (sources.length === 0) {
    return {
      ok: true,
      source_id: null,
      route: typeof window !== 'undefined' ? window.location.pathname : null,
      context: null,
      note: "No InsightSource is registered on this page. The current page does not publish a context wrapper.",
    };
  }

  const fallback = sources[0];
  const snapshot = registry?.getSnapshot?.(fallback.id);
  return {
    ok: true,
    source_id: fallback.id,
    route: typeof window !== 'undefined' ? window.location.pathname : null,
    context: snapshot?.payload ?? null,
    note: `'page-context' is not registered on this page; falling back to source [${fallback.id}].`,
  };
};
