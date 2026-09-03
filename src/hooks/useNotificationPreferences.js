import { useCallback, useEffect, useState } from 'react';

/**
 * Client-side notification preferences.
 *
 * The gate is intentionally client-side (localStorage) so the toast layer can
 * decide synchronously whether to interrupt the operator — no backend round-trip
 * on every SSE event. The config page persists the same shape to the backend
 * (durable / cross-device) AND mirrors it here for the local gate.
 *
 * Shape (localStorage key `sommatic::notification-prefs`):
 *   {
 *     paused: boolean,
 *     quiet_hours: { enabled: boolean, start: "HH:MM", end: "HH:MM" },
 *     min_priority: 'low' | 'medium' | 'high' | 'critical',
 *     muted_types: string[]   // task type names to silence (toast only)
 *   }
 */
export const NOTIFICATION_PREFS_KEY = 'sommatic::notification-prefs';
export const NOTIFICATION_PREFS_EVENT = 'sommatic::notification-prefs-changed';

const PRIORITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };

const DEFAULT_PREFS = {
  paused: false,
  quiet_hours: { enabled: false, start: '20:00', end: '07:00' },
  min_priority: 'high',
  muted_types: [],
};

function readPrefs() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      quiet_hours: { ...DEFAULT_PREFS.quiet_hours, ...(parsed.quiet_hours || {}) },
      muted_types: Array.isArray(parsed.muted_types) ? parsed.muted_types : [],
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Persist prefs and notify listeners (config page calls this). */
export function writeNotificationPreferences(prefs) {
  try {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent(NOTIFICATION_PREFS_EVENT, { detail: prefs }));
  } catch {
    // storage unavailable — gate falls back to defaults
  }
}

function minutesOfDay(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** True when `now` falls inside the quiet window (handles overnight ranges). */
export function isQuietNow(quietHours, now = new Date()) {
  if (!quietHours?.enabled) return false;
  const start = minutesOfDay(quietHours.start);
  const end = minutesOfDay(quietHours.end);
  if (start == null || end == null) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  // Overnight window (e.g. 20:00 → 07:00) wraps past midnight.
  if (start > end) return cur >= start || cur < end;
  return cur >= start && cur < end;
}

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState(readPrefs);

  useEffect(() => {
    const reload = () => setPrefs(readPrefs());
    window.addEventListener(NOTIFICATION_PREFS_EVENT, reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener(NOTIFICATION_PREFS_EVENT, reload);
      window.removeEventListener('storage', reload);
    };
  }, []);

  // Decide whether a task notification is allowed to interrupt with a toast.
  // The notification center still records everything regardless of this gate.
  const shouldToast = useCallback(
    (task) => {
      if (prefs.paused) return false;
      if (isQuietNow(prefs.quiet_hours)) return false;

      const typeName = task?.type?.name;
      if (typeName && prefs.muted_types.includes(typeName)) return false;

      const rank = PRIORITY_RANK[task?.priority?.name] || 0;
      const minRank = PRIORITY_RANK[prefs.min_priority] || PRIORITY_RANK.high;
      return rank >= minRank;
    },
    [prefs],
  );

  return { prefs, shouldToast };
}
