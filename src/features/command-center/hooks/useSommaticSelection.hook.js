import { useEffect } from 'react';
import { useCommandCenterContext } from '../context/CommandCenter.context';

/**
 * Hook to report the current selection state to the Command Center.
 * Use this when a component manages user selection (e.g. selected rows, text, IDs).
 *
 * @param {Object|null} selection - The current selection data.
 * @param {string} [selection.type] - Selection type: 'text' | 'rows' | 'ids' | 'entity'.
 * @param {any} [selection.content] - The selected content.
 * @param {string} [selection.surface_id] - The surface the selection belongs to.
 * @param {Array} deps - Dependencies to trigger re-registration.
 */
export const useSommaticSelection = (selection, deps = []) => {
  const { setSelection } = useCommandCenterContext();

  useEffect(() => {
    setSelection(selection);
    return () => setSelection(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSelection, ...deps]);
};
