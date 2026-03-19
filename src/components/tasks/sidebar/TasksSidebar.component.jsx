import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material';
import { Chip } from '@mui/material';
import {
  Inbox as TasksIcon,
  MoreHoriz as SeeMoreIcon,
  ErrorOutline as OverdueIcon,
  WarningAmberOutlined as DueSoonIcon,
  PriorityHigh as CriticalIcon,
  TaskAlt as NormalIcon,
} from '@mui/icons-material';
import { SidebarGroup as SidebarGroupComponent } from '@link-loom/react-sdk';
import { useTaskInbox } from '../../../hooks/useTaskInbox';

// ─── Severity config ─────────────────────────────────────────────────────────

// ─── Theme tokens (aligned with TaskDetailHeader) ────────────────────────────

const T = {
  error: '#FB7185',
  warning: '#F59E0B',
  purple: '#8B5CF6',
};

const SEVERITY_CONFIG = {
  overdue: {
    id: 'group-overdue',
    label: 'Overdue',
    Icon: OverdueIcon,
    color: T.error,
  },
  dueSoon: {
    id: 'group-due-soon',
    label: 'Due soon',
    Icon: DueSoonIcon,
    color: T.warning,
  },
  critical: {
    id: 'group-critical',
    label: 'Critical',
    Icon: CriticalIcon,
    color: T.purple,
  },
  normal: {
    id: 'group-open',
    label: 'Open',
    Icon: NormalIcon,
    color: '#6B7280',
  },
};

// ─── Styled ──────────────────────────────────────────────────────────────────

const StyledTasksIcon = styled(TasksIcon)({
  color: '#838790',
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CountChip({ count, color }) {
  return (
    <span
      style={{
        fontSize: '0.6rem',
        fontWeight: 700,
        padding: '1px 6px',
        borderRadius: 10,
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        lineHeight: '1.4',
        whiteSpace: 'nowrap',
      }}
    >
      {count}
    </span>
  );
}

function taskToSidebarItem(task) {
  return {
    id: String(task.id),
    label: task.title || 'Untitled task',
    onClick: () => {
      window.dispatchEvent(
        new CustomEvent('sommatic::open-task', { detail: { task } })
      );
    },
  };
}

function buildGroupItem(groupKey, tasks) {
  if (!tasks || tasks.length === 0) return null;

  const config = SEVERITY_CONFIG[groupKey];
  if (!config) return null;

  const { Icon } = config;

  return {
    id: config.id,
    label: config.label,
    icon: <Icon style={{ fontSize: 16, color: config.color }} />,
    defaultExpanded: groupKey === 'overdue' || groupKey === 'dueSoon',
    actions: <CountChip count={tasks.length} color={config.color} />,
    children: tasks.map(taskToSidebarItem),
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * TasksSidebar
 *
 * Shared sidebar section for Tasks. Shows task count badge in header,
 * groups tasks by severity (overdue → due soon → critical → normal),
 * and opens tasks in-place via the TaskQuickViewOverlay.
 *
 * @param {Object} props
 * @param {string} props.basePath - Route base for "See more" navigation (e.g. '/client/work-management/task')
 * @param {boolean} [props.isCondensed=false] - Sidebar condensed mode
 * @param {number} [props.pollIntervalMs=60000] - Polling interval
 * @param {number} [props.pageSize=10] - Tasks per fetch
 */
function TasksSidebar({ basePath, isCondensed = false, pollIntervalMs, pageSize }) {
  const navigate = useNavigate();
  const { groups, counts, badgeSeverity } = useTaskInbox({
    pollIntervalMs,
    pageSize,
  });

  // Build sidebar items grouped by severity
  const sidebarItems = useMemo(() => {
    const items = [];

    const overdueItem = buildGroupItem('overdue', groups.overdue);
    if (overdueItem) items.push(overdueItem);

    const dueSoonItem = buildGroupItem('dueSoon', groups.dueSoon);
    if (dueSoonItem) items.push(dueSoonItem);

    const criticalItem = buildGroupItem('critical', groups.critical);
    if (criticalItem) items.push(criticalItem);

    const normalItem = buildGroupItem('normal', groups.normal);
    if (normalItem) items.push(normalItem);

    return items;
  }, [groups]);

  const badgeColor = badgeSeverity === 'error' ? T.error : badgeSeverity === 'warning' ? T.warning : '#6B7280';

  const badgeComponent = counts.total > 0 ? (
    <Chip
      label={counts.total > 99 ? '99+' : counts.total}
      size="small"
      sx={{
        height: 18,
        fontSize: '0.6rem',
        fontWeight: 700,
        backgroundColor: `${badgeColor}18`,
        color: badgeColor,
        border: `1px solid ${badgeColor}40`,
        '& .MuiChip-label': { px: 0.75 },
      }}
    />
  ) : null;

  return (
    <div className="tasks-sidebar-wrapper">
      <SidebarGroupComponent
        title="Tasks"
        actions={badgeComponent}
        badge={badgeComponent}
        icon={<StyledTasksIcon fontSize="small" />}
        isCondensed={isCondensed}
        items={sidebarItems}
        defaultExpanded={false}
        footer={{
          label: 'See more',
          onClick: () => navigate(basePath),
          icon: <SeeMoreIcon fontSize="small" />,
        }}
      />
    </div>
  );
}

export default TasksSidebar;
