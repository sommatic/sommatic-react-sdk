import React, { useCallback, useEffect, useRef } from 'react';
import {
  CheckCircleOutline as SuccessIcon,
  WarningAmberOutlined as WarningIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { openToast } from '@link-loom/react-sdk';

// ─── Severity icon config ─────────────────────────────────────────────────────

const SEVERITY_ICON_CONFIG = {
  info:    { Icon: InfoIcon,    color: '#3B82F6' },
  warning: { Icon: WarningIcon, color: '#F59E0B' },
  error:   { Icon: ErrorIcon,   color: '#EF4444' },
  success: { Icon: SuccessIcon, color: '#22C55E' },
};

// ─── Kind config ──────────────────────────────────────────────────────────────

const KIND_CONFIG = {
  assigned: {
    severity: 'info',
    title: 'New task assigned',
    defaultActions: [
      { id: 'open', title: 'Open' },
      { id: 'claim', title: 'Claim' },
    ],
    duration: 6000,
  },
  dueSoon: {
    severity: 'warning',
    title: 'Task due soon',
    defaultActions: [
      { id: 'open', title: 'Open' },
      { id: 'snooze', title: 'Snooze 10m', payload: { minutes: 10 } },
    ],
    duration: 10000,
  },
  overdue: {
    severity: 'error',
    title: 'Task overdue',
    defaultActions: [{ id: 'open', title: 'Open' }],
    duration: null,
  },
  completed: {
    severity: 'success',
    title: 'Task completed',
    defaultActions: [{ id: 'view', title: 'View' }],
    duration: 4000,
  },
};

const DEFAULT_CONFIG = {
  severity: 'info',
  title: 'Task notification',
  defaultActions: [{ id: 'open', title: 'Open' }],
  duration: 6000,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSlaCountdown(dueAt) {
  if (!dueAt) return null;
  const diff = Number(dueAt) - Date.now();
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (diff < 0) return h > 24 ? `Overdue ${Math.floor(h / 24)}d` : `Overdue ${h}h ${m}m`;
  if (h >= 24) return `Due in ${Math.floor(h / 24)}d`;
  if (h === 0) return `Due in ${m}m`;
  return `Due in ${h}h ${m}m`;
}

function resolveAssigneeName(assignee) {
  if (!assignee) return null;
  if (assignee.assignee_type === 'user') {
    return (
      assignee.user?.profile?.primary_email_address ||
      assignee.user?.profile?.display_name ||
      assignee.user?.identity ||
      assignee.user?.name ||
      null
    );
  }
  return assignee.group?.name || null;
}

function isSnoozed(taskId) {
  const val = localStorage.getItem(`sommatic-task-snooze-${taskId}`);
  if (!val) return false;
  if (Date.now() < Number(val)) return true;
  localStorage.removeItem(`sommatic-task-snooze-${taskId}`);
  return false;
}

function snoozeTask(taskId, minutes) {
  localStorage.setItem(`sommatic-task-snooze-${taskId}`, String(Date.now() + minutes * 60000));
}

// ─── Severity gradient colors (used for card background, not priority) ────────

const SEVERITY_GRADIENT_COLOR = {
  info:    '#3B82F6',
  warning: '#F59E0B',
  error:   '#EF4444',
  success: '#22C55E',
};

// ─── Custom Task Toast Card ───────────────────────────────────────────────────

function TaskToastCard({ title, task, severity, actions, onDismiss, onNavigateRef }) {
  const priorityColor = task.priority?.color || '#6B7280';
  const { Icon: SeverityIcon, color: iconColor } = SEVERITY_ICON_CONFIG[severity] || SEVERITY_ICON_CONFIG.info;

  // Gradient uses SEVERITY color (not priority), so overdue is always red regardless of priority
  const gradientColor = SEVERITY_GRADIENT_COLOR[severity] || SEVERITY_GRADIENT_COLOR.info;

  const dueText = formatSlaCountdown(task.sla?.due_at || task.due_at);
  const assigneeName = resolveAssigneeName(task.assignee);
  const descriptionText = task.details || task.payload?.summary || task.description || '';

  // Layered diagonal gradient for visual dynamism — uses severity color
  const cardBg = [
    `linear-gradient(160deg, ${gradientColor}18 0%, transparent 50%)`,
    `linear-gradient(220deg, ${gradientColor}10 0%, transparent 35%)`,
    '#ffffff',
  ].join(', ');

  function handleAction(action) {
    if (action.id === 'snooze') {
      snoozeTask(task.id, action.payload?.minutes ?? 10);
    }

    window.dispatchEvent(
      new CustomEvent('sommatic::task-notification-action', {
        detail: {
          task_id: task.id,
          action_id: action.id,
          action_payload: action.payload,
          meta: { timestamp: String(Date.now()) },
        },
      })
    );

    if (action.id === 'open' || action.id === 'view' || action.id === 'claim') {
      window.dispatchEvent(new CustomEvent('sommatic::open-task', { detail: { task } }));
    }

    onDismiss();
  }

  return (
    // Outer wrapper — gives space above for the priority tag that protrudes upward
    <div
      style={{
        position: 'relative',
        width: 300,
        pointerEvents: 'auto',
        animation: 'll-toast-slide-in 0.28s ease forwards',
        marginTop: task.priority?.title ? 22 : 0,
      }}
    >
      {/* ── Priority tag — sits behind the card (zIndex: 0) ── */}
      {task.priority?.title && (
        <mark
          style={{
            position: 'absolute',
            top: -20,
            left: 0,
            height: 30,
            zIndex: 0,
            backgroundColor: priorityColor,
            color: '#fff',
            fontSize: '0.52rem',
            fontWeight: 700,
            padding: '4px 10px 0',
            borderRadius: '6px 6px 0 0',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            boxShadow: `0 -2px 6px ${priorityColor}30`,
            whiteSpace: 'nowrap',
            display: 'block',
          }}
        >
          {task.priority.title}
        </mark>
      )}

      {/* ── Card — sits on top of the priority tag ── */}
      <article
        role="alert"
        style={{
          position: 'relative',
          zIndex: 1,
          background: cardBg,
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          padding: '8px 10px',
        }}
      >
        {/* ── Header: task type chip · due date · dismiss ── */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
          {task.type?.title && (
            <span
              style={{
                fontSize: '0.58rem',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 20,
                backgroundColor: `${task.type.color || '#546e7a'}18`,
                color: task.type.color || '#546e7a',
                border: `1px solid ${task.type.color || '#546e7a'}40`,
                whiteSpace: 'nowrap',
              }}
            >
              {task.type.title}
            </span>
          )}

          <span style={{ flex: 1 }} />

          {dueText && (
            <time
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                fontSize: '0.58rem',
                color: '#9CA3AF',
                whiteSpace: 'nowrap',
              }}
            >
              <AccessTimeIcon style={{ fontSize: 10 }} />
              {dueText}
            </time>
          )}

          <button
            type="button"
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              padding: 2,
              cursor: 'pointer',
              color: '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              lineHeight: 1,
            }}
            aria-label="Dismiss"
          >
            <CloseIcon style={{ fontSize: 12 }} />
          </button>
        </header>

        {/* ── Body: severity icon · kind label · title · description ── */}
        <section style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom:'12px' }}>
          <figure
            style={{
              margin: 0,
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SeverityIcon style={{ fontSize: 16, color: iconColor }} />
          </figure>

          <hgroup style={{ flex: 1, minWidth: 0, margin: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.55rem',
                fontWeight: 400,
                color: iconColor,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {title}
            </p>

            <h3
              style={{
                margin: '2px 0 0',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#0F172A',
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={task.title}
            >
              {task.title}
            </h3>

            {descriptionText && (
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '0.68rem',
                  fontWeight: 400,
                  color: '#9CA3AF',
                  lineHeight: 1.35,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={descriptionText}
              >
                {descriptionText}
              </p>
            )}
          </hgroup>
        </section>

        {/* ── Footer: assignee · action buttons ── */}
        <footer
          style={{
            borderTop: '1px dashed #E5E7EB',
            marginTop: 7,
            paddingTop: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <address
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flex: 1,
              minWidth: 0,
              fontStyle: 'normal',
            }}
          >
            {assigneeName && (
              <>
                <PersonIcon style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: '#9CA3AF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={assigneeName}
                >
                  {assigneeName}
                </span>
              </>
            )}
          </address>

          <menu style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 'auto', padding: 0, margin: 0 }}>
            {actions.slice(0, 2).map((action) => (
              <li key={action.id} style={{ listStyle: 'none' }}>
                <button
                  type="button"
                  onClick={() => handleAction(action)}
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 20,
                    border: `1px solid ${gradientColor}60`,
                    background: `${gradientColor}12`,
                    color: gradientColor,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${gradientColor}28`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${gradientColor}12`; }}
                >
                  {action.title}
                </button>
              </li>
            ))}
          </menu>
        </footer>
      </article>
    </div>
  );
}

// ─── Main Component (pure event bridge) ──────────────────────────────────────

/**
 * TaskNotificationToast
 *
 * Event bridge: listens for `sommatic::task-notification`, maps it to `openToast()`
 * with a custom task card renderer. Handles snooze + navigation directly in the card.
 *
 * @param {Function} onNavigate - ({ taskId, actionId }) => void
 */
function TaskNotificationToast({ onNavigate }) {
  const onNavigateRef = useRef(onNavigate);
  useEffect(() => { onNavigateRef.current = onNavigate; }, [onNavigate]);

  const handleNotification = useCallback((event) => {
    const { kind, task, message, actions } = event.detail || {};

    if (!kind || !task?.id || !task?.title) return;
    if (kind === 'dueSoon' && isSnoozed(task.id)) return;

    const config = KIND_CONFIG[kind] || DEFAULT_CONFIG;

    let severity = config.severity;
    if (kind === 'assigned' && task.priority?.name === 'critical') {
      severity = 'warning';
    }

    const title = message?.title || config.title;
    const resolvedActions = actions?.length > 0 ? actions : config.defaultActions;

    openToast({
      severity,
      title,
      subtitle: task.title,
      duration: config.duration,
      renderCard: (dismiss) => (
        <TaskToastCard
          title={title}
          task={task}
          severity={severity}
          actions={resolvedActions}
          onDismiss={dismiss}
          onNavigateRef={onNavigateRef}
        />
      ),
    });
  }, []);

  useEffect(() => {
    window.addEventListener('sommatic::task-notification', handleNotification);
    return () => window.removeEventListener('sommatic::task-notification', handleNotification);
  }, [handleNotification]);

  useEffect(() => {
    const handleViewAll = () => {
      onNavigateRef.current?.({ taskId: null, actionId: 'view-all' });
    };
    window.addEventListener('linkloom::toast-view-all', handleViewAll);
    return () => window.removeEventListener('linkloom::toast-view-all', handleViewAll);
  }, []);

  return null;
}

export default TaskNotificationToast;
