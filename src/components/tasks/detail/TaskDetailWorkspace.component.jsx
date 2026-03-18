import React, { useState, useCallback } from 'react';
import { Box, Tabs, Tab, Divider, IconButton, Tooltip } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import OutputOutlinedIcon from '@mui/icons-material/OutputOutlined';
import HistoryIcon from '@mui/icons-material/History';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import { openSnackbar } from '@link-loom/react-sdk';
import TaskDetailHeader from './TaskDetailHeader.component.jsx';
import TaskOverviewTab from './tabs/TaskOverviewTab.component.jsx';
import TaskEvidenceTab from './tabs/TaskEvidenceTab.component.jsx';
import TaskOutputTab from './tabs/TaskOutputTab.component.jsx';
import TaskActivityTab from './tabs/TaskActivityTab.component.jsx';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const T = {
  brandPrimary: '#3A2E4F',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  surfaceGray: '#F9FAFB',
};

// ─── Tab definitions (Evidence is the default so empty state is visible) ──────

const TABS = [
  { id: 'evidence', label: 'Evidence', icon: DescriptionOutlinedIcon },
  { id: 'output', label: 'Output', icon: OutputOutlinedIcon },
  { id: 'activity', label: 'Activity', icon: HistoryIcon },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskDetailWorkspace({
  task,
  onTransition,
  onComplete,
  onOpenApp,
  onEvent,
  onClose,
  onToggleEdit,
  onCopyLink,
  CodeEditor,
  height,
}) {
  // Default to 'evidence' so the Evidence empty state is visible on first open
  const [activeTab, setActiveTab] = useState('evidence');

  const handleTransition = useCallback(
    (transitionName) => {
      onTransition?.(transitionName);
      onEvent?.('task-detail::transition', { transition_name: transitionName, task_id: task?.id });
    },
    [onTransition, onEvent, task?.id]
  );

  const handleComplete = useCallback(
    (outputs) => {
      onComplete?.(outputs);
      onEvent?.('task-detail::complete', { task_id: task?.id, outputs });
    },
    [onComplete, onEvent, task?.id]
  );

  if (!task) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: T.textSecondary, fontSize: '0.85rem' }}>
        No task selected
      </Box>
    );
  }

  const containerHeight = height || 680;

  function handleCopyLink() {
    if (onCopyLink) {
      onCopyLink(task);
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
    openSnackbar('Link copied!', 'success');
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: containerHeight,
        overflow: 'hidden',
      }}
    >
      {/* ── Sticky breadcrumb bar ── */}
      <Box
        sx={{
          flexShrink: 0,
          padding: '17px 60px 12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#9CA3AF', fontSize: '0.8rem' }}>
          <span>Tasks /</span>
          <span style={{ color: T.textPrimary, fontWeight: 500 }}>{task?.title || 'Untitled'}</span>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <Tooltip title="Copy link">
            <IconButton size="small" onClick={handleCopyLink} sx={{ color: '#9CA3AF' }}>
              <LinkIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          {onToggleEdit && (
            <Tooltip title="Edit task">
              <IconButton size="small" onClick={onToggleEdit} sx={{ color: '#9CA3AF' }}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── Scrollable content area (everything below breadcrumb) ── */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {/* ── Header (title, fields, transitions) ── */}
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <TaskDetailHeader
            task={task}
            onTransition={handleTransition}
            onToggleEdit={onToggleEdit}
          />
        </Box>

        <Divider sx={{ borderColor: T.border }} />

        {/* ── Overview section ── */}
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <TaskOverviewTab task={task} />
        </Box>

        <Divider sx={{ borderColor: T.border }} />

        {/* ── Tab bar ── */}
        <Box sx={{ px: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{ sx: { backgroundColor: T.brandPrimary } }}
            sx={{
              minHeight: 38,
              '& .MuiTab-root': {
                minHeight: 38,
                textTransform: 'none',
                fontSize: '0.82rem',
                fontWeight: 500,
                color: T.textSecondary,
                py: 0.5,
                '&.Mui-selected': {
                  color: T.brandPrimary,
                  fontWeight: 600,
                },
              },
            }}
          >
            {TABS.map((tab) => {
              const IconComp = tab.icon;
              return (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  label={tab.label}
                  icon={<IconComp sx={{ fontSize: 15 }} />}
                  iconPosition="start"
                  sx={{ gap: 0.5, px: 1.5 }}
                />
              );
            })}
          </Tabs>
        </Box>

        <Divider sx={{ borderColor: T.border }} />

        {/* ── Tab content ── */}
        <Box sx={{ px: 3, py: 2 }}>
          {activeTab === 'evidence' && <TaskEvidenceTab task={task} />}
          {activeTab === 'output' && (
            <TaskOutputTab
              task={task}
              onComplete={handleComplete}
              onOpenApp={onOpenApp}
              CodeEditor={CodeEditor}
            />
          )}
          {activeTab === 'activity' && <TaskActivityTab task={task} />}
        </Box>
      </Box>
    </Box>
  );
}
