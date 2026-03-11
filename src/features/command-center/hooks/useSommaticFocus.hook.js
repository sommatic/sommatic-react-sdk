import { useEffect } from 'react';
import { useCommandCenterContext } from '../context/CommandCenter.context';

/**
 * Hook to report the currently focused entity/panel to the Command Center.
 * Use this in detail views or editors where a specific entity is active.
 *
 * @param {Object|null} focus - The current focus data.
 * @param {string} [focus.entity_type] - Type of the focused entity (e.g. 'project', 'agent-profile').
 * @param {string} [focus.entity_id] - ID of the focused entity.
 * @param {string} [focus.label] - Human-readable label.
 * @param {Object} [focus.metadata] - Additional metadata about the focused entity.
 * @param {Array} deps - Dependencies to trigger re-registration.
 */
export const useSommaticFocus = (focus, deps = []) => {
  const { setFocusData } = useCommandCenterContext();

  useEffect(() => {
    setFocusData(focus);
    return () => setFocusData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFocusData, ...deps]);
};
