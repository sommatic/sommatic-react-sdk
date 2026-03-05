import { useEffect } from 'react';
import { useCommandCenterContext } from '../context/CommandCenter.context';

/**
 * Hook to register a UI surface (grid, form, modal, panel) with the Command Center.
 * Surfaces expose targets and handlers that commands can interact with.
 *
 * @param {Object} surface
 * @param {string} surface.id - Unique surface identifier (e.g. 'project-list-grid').
 * @param {string} surface.type - Surface type: 'grid' | 'form' | 'modal' | 'panel' | 'list'.
 * @param {string} surface.label - Human-readable label for the surface.
 * @param {string} [surface.description] - Description of what the surface contains.
 * @param {Array} [surface.targets] - Array of actionable targets within the surface.
 * @param {Object} [surface.handlers] - Handler functions for surface operations.
 * @param {Function} [surface.handlers.open] - Open the surface.
 * @param {Function} [surface.handlers.close] - Close the surface.
 * @param {Function} [surface.handlers.setFields] - Set form fields.
 * @param {Function} [surface.handlers.submit] - Submit the form.
 * @param {Function} [surface.handlers.applyFilter] - Apply filters.
 * @param {Function} [surface.handlers.selectRows] - Select rows by IDs.
 * @param {Function} [surface.handlers.undo] - Undo the last action on this surface.
 * @param {Array} deps - Dependencies to trigger re-registration.
 */
export const useSommaticSurface = (surface, deps = []) => {
  if (!surface || !surface.id) {
    throw new Error('useSommaticSurface requires a surface with an id');
  }

  const { registerSurface } = useCommandCenterContext();

  useEffect(() => {
    const unregister = registerSurface(surface);
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerSurface, surface.id, ...deps]);
};
