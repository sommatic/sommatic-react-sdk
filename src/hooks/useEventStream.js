import { useEffect, useRef, useCallback } from 'react';
import WorkManagementTaskStreamService from '../streams/work-management/task/task-stream.service';

/**
 * Connects to the backend SSE endpoint for real-time task notifications.
 * Dispatches `sommatic::task-notification` DOM events on incoming task events.
 *
 * @param {Object} options
 * @param {string} options.userIdentity - Current user identity ID (Veripass)
 * @param {boolean} options.enabled - Whether to enable the connection (default: true)
 * @param {string} options.baseUrl - Backend URL (defaults to VITE_APP_BACKEND_URL)
 */
export function useEventStream({ userIdentity, enabled = true, baseUrl } = {}) {
  const serviceRef = useRef(null);

  const handleTaskAssigned = useCallback((data) => {
    if (!data?.task) return;

    window.dispatchEvent(
      new CustomEvent('sommatic::task-notification', {
        detail: {
          kind: data.kind || 'assigned',
          task: data.task,
          actions: [{ id: 'open', title: 'Open' }],
          meta: {
            source: 'event-stream',
            timestamp: String(Date.now()),
          },
        },
      }),
    );
  }, []);

  useEffect(() => {
    if (!enabled || !userIdentity) return;

    const service = new WorkManagementTaskStreamService({ baseUrl });

    service.setParams({ user_identity: userIdentity });
    service.on('task-assigned', handleTaskAssigned);
    service.connect();

    serviceRef.current = service;

    return () => {
      service.disconnect();
      serviceRef.current = null;
    };
  }, [enabled, userIdentity, baseUrl, handleTaskAssigned]);
}
