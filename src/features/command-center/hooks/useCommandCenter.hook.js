import { useCommandCenterContextOptional } from '../context/CommandCenter.context';

/**
 * Hook for consuming Command Center functionality.
 * Exposed to the rest of the application. Returns null when no
 * CommandCenterProvider is mounted, so callers can opt out gracefully
 * (e.g. `useCommandCenter() || {}`).
 */
export const useCommandCenter = () => {
  return useCommandCenterContextOptional();
};
