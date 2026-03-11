/**
 * Lists all published surfaces (modals, grids, forms, panels) in the Command Center.
 * @param {Object} registry - Command Center registry.
 * @returns {Object} { surfaces: Array<{ id, type, label, description }> }
 */
export const action = (registry) => {
  if (!registry?.getSurfaces) {
    return { surfaces: [] };
  }

  return { surfaces: registry.getSurfaces() };
};
