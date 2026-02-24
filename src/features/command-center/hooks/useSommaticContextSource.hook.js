import { useEffect } from 'react';
import { useCommandCenterContext } from '../context/CommandCenter.context';

/**
 * Hook to register a component as a data source for the Command Center.
 * Automatically handles registration and unregistration on mount/unmount.
 *
 * @param {Object} source
 * @param {string} source.id - Unique ID for the source (e.g. 'page-context').
 * @param {string} source.description - Description for the agent.
 * @param {Function} source.getData - Function that returns the data snapshot.
 * @param {Array} deps - Dependencies to trigger re-registration (optional).
 */
export const useSommaticContextSource = (source, deps = []) => {
  if (!source || !source.id) {
    throw new Error('Invalid source provided to useSommaticContextSource');
  }
  const { registerContextSource } = useCommandCenterContext();

  useEffect(() => {
    const unregister = registerContextSource(source);
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerContextSource, source.id, ...deps]);
};
