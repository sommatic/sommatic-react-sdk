/**
 * Pulls snapshots from multiple InsightSources (by IDs or Top-N).
 * @param {Object} args
 * @param {string[]} [args.source_ids] - Specific source IDs to snapshot.
 * @param {number} [args.top_n] - Number of top sources to snapshot if source_ids not provided.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} { blocks: ContextBlock[] }
 */
export const action = (args, registry) => {
  if (!registry?.listAllSources || !registry?.getSnapshot) {
    return { blocks: [] };
  }

  const { source_ids, top_n } = args || {};
  let targetIds;

  if (Array.isArray(source_ids) && source_ids.length > 0) {
    targetIds = source_ids;
  } else {
    const allSources = registry.listAllSources();
    const limit = top_n && top_n > 0 ? top_n : allSources.length;
    targetIds = allSources.slice(0, limit).map((s) => s.id);
  }

  const blocks = [];
  for (const id of targetIds) {
    const block = registry.getSnapshot(id);
    if (block) {
      blocks.push(block);
    }
  }

  return { blocks };
};
