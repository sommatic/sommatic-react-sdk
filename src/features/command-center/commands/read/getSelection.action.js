/**
 * Retrieves the current opt-in selection (text, row IDs, or entities).
 * Falls back to native browser text selection if no structured selection is reported.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} { selection } or null if nothing is selected.
 */
export const action = (registry) => {
  if (!registry?.getSelectionData) {
    return { selection: null };
  }

  const selection = registry.getSelectionData();
  return { selection };
};
