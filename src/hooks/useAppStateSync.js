import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Generic hook for synchronizing app view state with the SDK session.
 *
 * Handles three concerns for ALL App Engine apps:
 * 1. Capture: registers a state provider for synchronous escalation capture
 * 2. Persist: debounced save to backend via sdk.saveViewState
 * 3. Restore: calls onRestore(viewState) once on mount when _restored_view_state exists
 *
 * @param {object} sdk - SDK object from AppRuntimeHost
 * @param {object} stateObj - Current view state to expose (app-specific shape)
 * @param {Array} deps - Dependency array for detecting state changes
 * @param {object} [options]
 * @param {function} [options.onRestore] - Called once with restored view state. App applies it.
 * @param {number} [options.debounceMs=5000] - Debounce interval for backend persistence
 */
export default function useAppStateSync(sdk, stateObj, deps, options = {}) {
  const { onRestore, debounceMs = 5000 } = options;
  const location = useLocation();
  const restoredRef = useRef(false);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // 1. Register state provider (synchronous capture for escalation)
  useEffect(() => {
    if (!sdk?.registerStateProvider) return;

    sdk.registerStateProvider(() => ({
      currentRoute: location.pathname,
      ...stateObj,
    }));
  }, [sdk, location.pathname, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Expose via global for StateManager backward compat
  useEffect(() => {
    window.__LOOM_APP_STATE__ = stateObj;
    return () => {
      delete window.__LOOM_APP_STATE__;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Persist view_state debounced
  useEffect(() => {
    if (!sdk?.saveViewState) return;

    const timer = setTimeout(() => {
      sdk.saveViewState({
        currentRoute: location.pathname,
        ...stateObj,
      });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [sdk, location.pathname, debounceMs, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  // 4. Restore once on mount
  useEffect(() => {
    if (restoredRef.current) return;

    const restored = sdk?.input?._restored_view_state;
    if (!restored) return;

    restoredRef.current = true;
    if (onRestoreRef.current) {
      onRestoreRef.current(restored);
    }
  }, [sdk?.input?._restored_view_state]);
}
