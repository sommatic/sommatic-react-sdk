import { useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL_MS = 60000; // 60 seconds
const DUE_SOON_THRESHOLD_MS = 30 * 60000; // 30 minutes
const SNOOZE_KEY_PREFIX = 'sommatic-task-snooze-';

function isSnoozed(taskId) {
  try {
    const snoozeUntil = localStorage.getItem(`${SNOOZE_KEY_PREFIX}${taskId}`);
    if (!snoozeUntil) {
      return false;
    }
    return Date.now() < Number(snoozeUntil);
  } catch {
    return false;
  }
}

function emitTaskNotification(kind, task, actions) {
  const detail = {
    kind,
    task: {
      id: task.id,
      title: task.title,
      type: task.type,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee,
      details: task.details,
      sla: task.sla,
      payload: task.payload,
      due_at: task.sla?.due_at,
    },
    actions: actions || [{ id: 'open', title: 'Open' }],
    meta: {
      source: 'sla-monitor',
      timestamp: String(Date.now()),
    },
  };

  window.dispatchEvent(
    new CustomEvent('sommatic::task-notification', { detail })
  );
}

/**
 * Hook that monitors active tasks for SLA deadlines.
 * Emits `sommatic::task-notification` DOM events for dueSoon and overdue tasks.
 *
 * @param {Function} fetchActiveTasks - async function that returns array of active tasks for the current user
 * @param {Object} options
 * @param {boolean} options.enabled - whether to enable monitoring (default: true)
 * @param {number} options.intervalMs - polling interval in ms (default: 60000)
 * @param {number} options.dueSoonThresholdMs - threshold for dueSoon notification (default: 30min)
 */
export function useTaskSLAMonitor(fetchActiveTasks, options = {}) {
  const {
    enabled = true,
    intervalMs = POLL_INTERVAL_MS,
    dueSoonThresholdMs = DUE_SOON_THRESHOLD_MS,
  } = options;

  const notifiedRef = useRef(new Set());

  const checkTasks = useCallback(async () => {
    if (!fetchActiveTasks) {
      return;
    }

    try {
      const tasks = await fetchActiveTasks();
      if (!Array.isArray(tasks)) {
        return;
      }

      const now = Date.now();

      for (const task of tasks) {
        if (!task.sla?.due_at) {
          continue;
        }

        const dueAt = Number(task.sla.due_at);
        const timeUntilDue = dueAt - now;

        if (isSnoozed(task.id)) {
          continue;
        }

        // Overdue
        if (timeUntilDue < 0) {
          const notifyKey = `overdue-${task.id}`;
          if (!notifiedRef.current.has(notifyKey)) {
            emitTaskNotification('overdue', task, [{ id: 'open', title: 'Open' }]);
            notifiedRef.current.add(notifyKey);
          }
          continue;
        }

        // Due soon
        if (timeUntilDue < dueSoonThresholdMs) {
          const notifyKey = `dueSoon-${task.id}`;
          if (!notifiedRef.current.has(notifyKey)) {
            emitTaskNotification('dueSoon', task, [
              { id: 'open', title: 'Open' },
              { id: 'snooze', title: 'Snooze 10m', payload: { minutes: 10 } },
            ]);
            notifiedRef.current.add(notifyKey);
          }
        }
      }
    } catch {
      // Silently fail — do not break the UI
    }
  }, [fetchActiveTasks, dueSoonThresholdMs]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initial check after a short delay
    const initialTimeout = setTimeout(checkTasks, 5000);

    // Recurring check
    const interval = setInterval(checkTasks, intervalMs);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [enabled, intervalMs, checkTasks]);

  // Reset notified set periodically to allow re-notification
  useEffect(() => {
    const resetInterval = setInterval(() => {
      notifiedRef.current.clear();
    }, intervalMs * 10);

    return () => clearInterval(resetInterval);
  }, [intervalMs]);
}
