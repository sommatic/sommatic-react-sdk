import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@veripass/react-sdk';
import WorkManagementTaskService from '../services/work-management/task/task.service.js';
import { fetchEntityCollection } from '../services/utils/entityServiceAdapter.js';

const DEFAULT_POLL_INTERVAL_MS = 60000;
const DEFAULT_DUE_SOON_THRESHOLD_MS = 30 * 60000;
const DEFAULT_PAGE_SIZE = 10;

/**
 * classifyTasks
 *
 * Sorts tasks into severity groups. Each task falls into exactly one group
 * based on priority: overdue > dueSoon > critical > normal.
 */
function classifyTasks(tasks, dueSoonThresholdMs) {
  const now = Date.now();
  const groups = { overdue: [], dueSoon: [], critical: [], normal: [] };

  for (const task of tasks) {
    const dueAt = task.sla?.due_at ? Number(task.sla.due_at) : null;

    if (dueAt && dueAt < now) {
      groups.overdue.push(task);
      continue;
    }

    if (dueAt && (dueAt - now) < dueSoonThresholdMs) {
      groups.dueSoon.push(task);
      continue;
    }

    if (task.priority?.name === 'critical') {
      groups.critical.push(task);
      continue;
    }

    groups.normal.push(task);
  }

  return groups;
}

function resolveBadgeSeverity(counts) {
  if (counts.overdue > 0) return 'error';
  if (counts.dueSoon > 0) return 'warning';
  if (counts.critical > 0) return 'warning';
  return 'info';
}

/**
 * useTaskInbox
 *
 * Fetches the current user's task inbox, classifies tasks by severity,
 * and polls at a configurable interval.
 *
 * @param {Object} options
 * @param {boolean} [options.enabled=true] - Enable/disable the hook
 * @param {number} [options.pollIntervalMs=60000] - Polling interval in ms
 * @param {number} [options.dueSoonThresholdMs=1800000] - Threshold for "due soon" (default 30min)
 * @param {number} [options.pageSize=10] - Number of tasks to fetch
 *
 * @returns {{ tasks, groups, counts, badgeSeverity, isLoading, refresh }}
 */
export function useTaskInbox(options = {}) {
  const {
    enabled = true,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    dueSoonThresholdMs = DEFAULT_DUE_SOON_THRESHOLD_MS,
    pageSize = DEFAULT_PAGE_SIZE,
  } = options;

  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInbox = useCallback(async () => {
    if (!user?.identity) return;

    try {
      setIsLoading(true);
      const response = await fetchEntityCollection({
        service: WorkManagementTaskService,
        payload: {
          queryselector: 'inbox',
          user_id: user.identity,
          organization_id: user?.payload?.organization_id,
          exclude_status: 'deleted',
          page: 1,
          pageSize,
        },
      });

      if (!response?.success) return;

      const items = response.result?.items || [];
      setTasks(items);
      setTotalItems(response.result?.totalItems || items.length);
    } catch {
      // Fail silently — sidebar is non-critical
    } finally {
      setIsLoading(false);
    }
  }, [user?.identity, user?.payload?.organization_id, pageSize]);

  // Initial fetch + polling
  useEffect(() => {
    if (!enabled || !user?.identity) return;

    fetchInbox();
    const interval = setInterval(fetchInbox, pollIntervalMs);
    return () => clearInterval(interval);
  }, [enabled, user?.identity, pollIntervalMs, fetchInbox]);

  // Classify tasks into severity groups
  const groups = classifyTasks(tasks, dueSoonThresholdMs);

  const counts = {
    total: totalItems,
    overdue: groups.overdue.length,
    dueSoon: groups.dueSoon.length,
    critical: groups.critical.length,
  };

  const badgeSeverity = resolveBadgeSeverity(counts);

  return {
    tasks,
    groups,
    counts,
    badgeSeverity,
    isLoading,
    refresh: fetchInbox,
  };
}
