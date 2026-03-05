/**
 * Retrieves the currently focused entity or active panel.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} { focus } containing the focus data or null.
 */
export const action = (registry) => {
  if (!registry?.getFocusData) {
    return { focus: null };
  }

  const focus = registry.getFocusData();
  return { focus };
};
