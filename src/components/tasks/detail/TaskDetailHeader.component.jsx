import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LabelIcon from '@mui/icons-material/Label';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const T = {
  brandPrimary: '#3A2E4F',
  success: '#30BBB7',
  error: '#FB7185',
  warning: '#F59E0B',
  purple: '#8B5CF6',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  surfaceGray: '#F9FAFB',
  border: '#E5E7EB',
};

// ─── SLA countdown ────────────────────────────────────────────────────────────

function formatSlaCountdown(dueAt) {
  if (!dueAt) return null;

  const now = Date.now();
  const due = Number(dueAt);
  const diff = due - now;
  const absDiff = Math.abs(diff);

  const hours = Math.floor(absDiff / 3600000);
  const minutes = Math.floor((absDiff % 3600000) / 60000);

  // Overdue
  if (diff < 0) {
    const text = hours > 24 ? `Overdue by ${Math.floor(hours / 24)}d` : `Overdue by ${hours}h ${minutes}m`;
    return { text, severity: 'error' };
  }

  // < 2h remaining → red danger
  if (diff < 2 * 3600000) {
    return { text: `Due in ${hours}h ${minutes}m`, severity: 'error' };
  }

  // 2h – 12h remaining → yellow warning
  if (diff < 12 * 3600000) {
    return { text: `Due in ${hours}h ${minutes}m`, severity: 'warning' };
  }

  // > 12h remaining → green success
  if (hours >= 24) {
    return { text: `Due in ${Math.floor(hours / 24)}d`, severity: 'success' };
  }

  return { text: `Due in ${hours}h ${minutes}m`, severity: 'success' };
}

// ─── Transition config — icons match TaskManagerList ─────────────────────────

const TRANSITION_CONFIG = {
  queued: [
    { name: 'assign', label: 'Assign', icon: PersonAddAlt1Icon, color: T.textPrimary },
    { name: 'claim', label: 'Claim', icon: PlayArrowIcon, color: T.textPrimary },
  ],
  assigned: [{ name: 'claim', label: 'Claim', icon: PlayArrowIcon, color: T.textPrimary }],
  claimed: [
    { name: 'start', label: 'Start', icon: PlayCircleIcon, color: T.textPrimary },
    { name: 'reject', label: 'Reject', icon: CancelIcon, color: T.error },
  ],
  in_progress: [
    { name: 'complete', label: 'Complete', icon: CheckCircleIcon, color: T.success },
    { name: 'reject', label: 'Reject', icon: CancelIcon, color: T.error },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveAssigneeName(assignee) {
  if (!assignee) return '-';
  if (assignee.assignee_type === 'user') {
    return (
      assignee.user?.profile?.primary_email_address ||
      assignee.user?.profile?.display_name ||
      assignee.user?.identity ||
      assignee.user?.name ||
      assignee.user?.id ||
      '-'
    );
  }
  return assignee.group?.name || assignee.group?.id || '-';
}

function chipTint(color, fallback) {
  const c = color || fallback;
  return {
    backgroundColor: `${c}18`,
    color: c,
    border: `1px solid ${c}40`,
  };
}

function slaSeverityStyle(severity) {
  if (severity === 'error') return chipTint(T.error, T.error);
  if (severity === 'warning') return chipTint(T.warning, T.warning);
  return chipTint(T.success, T.success);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskDetailHeader({ task, onTransition, onToggleEdit }) {
  const [menuAnchor, setMenuAnchor] = useState(null);

  const statusName = task?.status?.name || 'queued';
  const slaInfo = useMemo(() => formatSlaCountdown(task?.sla?.due_at), [task?.sla?.due_at]);
  // HITL tasks must be resolved via the embedded Approval Gate, not via the
  // generic transitions menu — hide complete/reject for them.
  const hasHitl = !!task?.payload?.hitl;
  const rawTransitions = TRANSITION_CONFIG[statusName] || [];
  const transitions = hasHitl
    ? rawTransitions.filter((t) => t.name !== 'complete' && t.name !== 'reject')
    : rawTransitions;
  const assigneeName = resolveAssigneeName(task?.assignee);

  const fullDueDate = task?.sla?.due_at
    ? new Date(Number(task.sla.due_at)).toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Created — local time, from the entity timestamp (Unix ms string).
  const createdDate = task?.created?.timestamp
    ? new Date(Number(task.created.timestamp)).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Project — prefer a resolved snapshot name, fall back to the raw id.
  const projectLabel = task?.context?.project?.name || task?.project_id || null;

  function handleMenuOpen(event) {
    setMenuAnchor(event.currentTarget);
  }

  function handleMenuClose() {
    setMenuAnchor(null);
  }

  function handleTransitionClick(transitionName) {
    handleMenuClose();
    onTransition?.(transitionName);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Title row with 3-dot actions menu ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: T.textPrimary,
            lineHeight: 1.3,
            fontSize: '1.3rem',
            flex: 1,
            pr: 1,
          }}
        >
          {task?.title || 'Untitled Task'}
        </Typography>

        {transitions.length > 0 && (
          <>
            <Tooltip title="Actions">
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ color: T.textSecondary, flexShrink: 0 }}
              >
                <MoreVertIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 3,
                sx: {
                  borderRadius: '10px',
                  minWidth: 160,
                  mt: 0.5,
                  border: `1px solid ${T.border}`,
                },
              }}
            >
              {transitions.map((transition) => {
                const IconComp = transition.icon;
                return (
                  <MenuItem
                    key={transition.name}
                    onClick={() => handleTransitionClick(transition.name)}
                    sx={{
                      fontSize: '0.85rem',
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <IconComp sx={{ fontSize: 18, color: transition.color }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={transition.label}
                      primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500, color: transition.color }}
                    />
                  </MenuItem>
                );
              })}
            </Menu>
          </>
        )}
      </Box>

      {/* ── Field rows ── */}

      {/* Status */}
      <FieldRow label="Status" icon={<InfoOutlinedIcon sx={{ fontSize: 14, color: T.brandPrimary }} />}>
        {task?.status?.title ? (
          <Chip
            label={task.status.title}
            size="small"
            sx={{
              ...chipTint(task.status.color, T.success),
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 24,
            }}
          />
        ) : (
          <span style={{ color: T.textTertiary, fontSize: '0.82rem' }}>—</span>
        )}
      </FieldRow>

      {/* Assignee */}
      <FieldRow
        label="Assignee"
        icon={
          task?.assignee?.assignee_type === 'user' ? (
            <PersonIcon sx={{ fontSize: 14, color: T.brandPrimary }} />
          ) : (
            <GroupIcon sx={{ fontSize: 14, color: T.brandPrimary }} />
          )
        }
      >
        <Chip
          icon={
            task?.assignee?.assignee_type === 'user' ? (
              <PersonIcon sx={{ fontSize: 13 }} />
            ) : (
              <GroupIcon sx={{ fontSize: 13 }} />
            )
          }
          label={assigneeName}
          size="small"
          variant="outlined"
          sx={{ borderColor: T.border, color: T.textPrimary, fontSize: '0.78rem', height: 26 }}
        />
      </FieldRow>

      {/* Project */}
      <FieldRow label="Project" icon={<FolderOutlinedIcon sx={{ fontSize: 14, color: T.brandPrimary }} />}>
        {projectLabel ? (
          <Chip
            label={projectLabel}
            size="small"
            variant="outlined"
            sx={{ borderColor: T.border, color: T.textPrimary, fontSize: '0.78rem', height: 26 }}
          />
        ) : (
          <span style={{ color: T.textTertiary, fontSize: '0.82rem' }}>—</span>
        )}
      </FieldRow>

      {/* Due Date — chip only with tooltip for full date */}
      <FieldRow label="Due Date" icon={<CalendarTodayIcon sx={{ fontSize: 14, color: T.brandPrimary }} />}>
        {slaInfo ? (
          <Tooltip title={fullDueDate || 'No due date'} placement="top" arrow>
            <Chip
              size="small"
              icon={(() => {
                const iconColor =
                  slaInfo.severity === 'error' ? T.error : slaInfo.severity === 'warning' ? T.warning : T.success;
                return slaInfo.severity === 'error' ? (
                  <WarningAmberIcon sx={{ fontSize: 14, color: `${iconColor} !important` }} />
                ) : (
                  <AccessTimeIcon sx={{ fontSize: 14, color: `${iconColor} !important` }} />
                );
              })()}
              label={slaInfo.text}
              sx={{
                ...slaSeverityStyle(slaInfo.severity),
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 24,
                cursor: 'default',
              }}
            />
          </Tooltip>
        ) : (
          <span style={{ color: T.textTertiary, fontSize: '0.82rem' }}>No due date</span>
        )}
      </FieldRow>

      {/* Created — local time */}
      <FieldRow label="Created" icon={<EventOutlinedIcon sx={{ fontSize: 14, color: T.brandPrimary }} />}>
        {createdDate ? (
          <span style={{ color: T.textPrimary, fontSize: '0.82rem' }}>{createdDate}</span>
        ) : (
          <span style={{ color: T.textTertiary, fontSize: '0.82rem' }}>—</span>
        )}
      </FieldRow>

      {/* Tags (Type + Priority) */}
      <FieldRow label="Tags" icon={<LabelIcon sx={{ fontSize: 14, color: T.brandPrimary }} />}>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {task?.type?.title && (
            <Chip
              label={task.type.title}
              size="small"
              sx={{ ...chipTint(task.type.color, T.brandPrimary), fontWeight: 500, fontSize: '0.75rem', height: 24 }}
            />
          )}
          {task?.priority?.title && (
            <Chip
              label={task.priority.title}
              size="small"
              sx={{ ...chipTint(task.priority.color, T.purple), fontWeight: 500, fontSize: '0.75rem', height: 24 }}
            />
          )}
          {!task?.type?.title && !task?.priority?.title && (
            <span style={{ color: T.textTertiary, fontSize: '0.82rem' }}>—</span>
          )}
        </Box>
      </FieldRow>
    </Box>
  );
}

// ─── Field row helper ─────────────────────────────────────────────────────────

function FieldRow({ label, icon, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.6 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          fontSize: '0.82rem',
          color: T.textSecondary,
          minWidth: 96,
          flexShrink: 0,
        }}
      >
        {icon}
        {label}
      </Box>
      <Box sx={{ fontSize: '0.85rem', color: T.textPrimary }}>{children}</Box>
    </Box>
  );
}
