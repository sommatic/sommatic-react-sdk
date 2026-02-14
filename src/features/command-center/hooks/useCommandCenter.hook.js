import { useCommandCenterContext } from '../context/CommandCenter.context';

/**
 * Hook for consuming Command Center functionality.
 * Exposed to the rest of the application.
 */
export const useCommandCenter = () => {
  return useCommandCenterContext();
};
