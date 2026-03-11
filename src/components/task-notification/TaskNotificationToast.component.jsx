import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Chip, Typography, IconButton } from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

// ─── Helpers ────────────────────────────────────────────────────────────────

const SEVERITY_COLORS = {
  info: '#0288d1',
  warning: '#ed6c02',
  error: '#d32f2f',
  success: '#2e7d32',
};

const SEVERITY_ICONS = {
  info: <InfoIcon fontSize="small" />,
  warning: <WarningIcon fontSize="small" />,
  error: <ErrorIcon fontSize="small" />,
  success: <SuccessIcon fontSize="small" />,
};

function resolveSeverity(kind, priorityName) {
  switch (kind) {
    case 'assigned':
      return priorityName === 'critical'
        ? { severity: 'warning', duration: 10000 }
        : { severity: 'info', duration: 6000 };
    case 'dueSoon':
      return { severity: 'warning', duration: 10000 };
    case 'overdue':
      return { severity: 'error', duration: null };
    case 'completed':
      return { severity: 'success', duration: 4000 };
    default:
      return { severity: 'info', duration: 6000 };
  }
}

function formatDueAt(dueAt) {
  if (!dueAt) return '';
  try {
    return new Date(Number(dueAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function resolveMessage(kind, task, messageOverride) {
  if (messageOverride?.title) return messageOverride;
  switch (kind) {
    case 'assigned':  return { title: 'New task assigned',  subtitle: task.title };
    case 'dueSoon':   return { title: 'Task due soon',      subtitle: `${task.title} — Due at ${formatDueAt(task.due_at)}` };
    case 'overdue':   return { title: 'Task overdue',       subtitle: task.title };
    case 'completed': return { title: 'Task completed',     subtitle: task.title };
    default:          return { title: 'Task notification',  subtitle: task.title };
  }
}

// ─── Single Toast Card ───────────────────────────────────────────────────────

function ToastCard({ toast, onDismiss, onAction }) {
  const color = SEVERITY_COLORS[toast.severity] || SEVERITY_COLORS.info;
  const icon = SEVERITY_ICONS[toast.severity] || SEVERITY_ICONS.info;

  return (
    <article
      style={{
        backgroundColor: '#fff',
        borderLeft: `4px solid ${color}`,
        borderRadius: 6,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        padding: '10px 12px',
        position: 'relative',
        width: 320,
      }}
    >
      {/* Close button */}
      <IconButton
        size="small"
        onClick={() => onDismiss(toast.uid)}
        style={{ position: 'absolute', top: 4, right: 4, padding: 2 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingRight: 24 }}>
        <span style={{ color, flexShrink: 0, marginTop: 2 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {toast.message.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {toast.message.subtitle}
          </Typography>
        </div>
      </div>

      {/* Chips */}
      {(toast.task.priority || toast.task.type) && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          {toast.task.priority && (
            <Chip
              label={toast.task.priority.title || toast.task.priority.name}
              size="small"
              sx={{ backgroundColor: toast.task.priority.color || '#546e7a', color: '#fff', fontSize: '0.65rem', height: 18 }}
            />
          )}
          {toast.task.type && (
            <Chip
              label={toast.task.type.title || toast.task.type.name}
              size="small"
              sx={{ backgroundColor: toast.task.type.color || '#546e7a', color: '#fff', fontSize: '0.65rem', height: 18 }}
            />
          )}
        </div>
      )}

      {/* Actions */}
      {toast.actions?.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
          {toast.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="btn btn-sm btn-soft-secondary"
              style={{ fontSize: '0.7rem', padding: '2px 8px' }}
              onClick={() => onAction(toast, action)}
            >
              {action.title}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function TaskNotificationToast() {
  const [toasts, setToasts] = useState([]);
  const timerRefs = useRef({});

  const dismissToast = useCallback((uid) => {
    clearTimeout(timerRefs.current[uid]);
    delete timerRefs.current[uid];
    setToasts((prev) => prev.filter((t) => t.uid !== uid));
  }, []);

  const handleAction = useCallback((toast, action) => {
    if (action.id === 'snooze') {
      const minutes = action.payload?.minutes ?? 10;
      localStorage.setItem(
        `sommatic-task-snooze-${toast.task.id}`,
        String(Date.now() + minutes * 60000),
      );
    }

    window.dispatchEvent(new CustomEvent('sommatic::task-notification-action', {
      detail: {
        task_id: toast.task.id,
        action_id: action.id,
        action_payload: action.payload,
      },
    }));

    dismissToast(toast.uid);
  }, [dismissToast]);

  const handleNotification = useCallback((event) => {
    const { kind, task, message, actions, meta } = event.detail || {};

    if (!kind || !task?.id || !task?.title) return;

    if (kind === 'dueSoon') {
      const snoozedUntil = localStorage.getItem(`sommatic-task-snooze-${task.id}`);
      if (snoozedUntil && Date.now() < Number(snoozedUntil)) return;
    }

    const { severity, duration } = resolveSeverity(kind, task.priority?.name);

    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast = {
      uid,
      kind,
      task,
      message: resolveMessage(kind, task, message),
      actions: actions || [],
      severity,
      duration,
      addedAt: Date.now(),
    };

    setToasts((prev) => [newToast, ...prev]);

    if (duration !== null) {
      timerRefs.current[uid] = setTimeout(() => dismissToast(uid), duration);
    }
  }, [dismissToast]);

  useEffect(() => {
    window.addEventListener('sommatic::task-notification', handleNotification);
    return () => {
      window.removeEventListener('sommatic::task-notification', handleNotification);
    };
  }, [handleNotification]);

  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(clearTimeout);
    };
  }, []);

  const visibleToasts = toasts.slice(0, 4);

  if (visibleToasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        zIndex: 1500,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 320,
        pointerEvents: 'auto',
      }}
    >
      {visibleToasts.map((toast) => (
        <ToastCard
          key={toast.uid}
          toast={toast}
          onDismiss={dismissToast}
          onAction={handleAction}
        />
      ))}
    </div>
  );
}

export default TaskNotificationToast;
