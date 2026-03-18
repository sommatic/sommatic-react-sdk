import React, { useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

function buildActivityTimeline(task) {
  if (!task) {
    return [];
  }

  const events = [];

  if (task.created?.timestamp) {
    events.push({
      label: 'Created',
      timestamp: Number(task.created.timestamp),
      actor: task.created.user?.name || 'System',
      color: '#757575',
    });
  }

  if (task.assignee?.user?.name || task.assignee?.group?.name) {
    const assigneeName =
      task.assignee.assignee_type === 'user'
        ? task.assignee.user?.name
        : task.assignee.group?.name;
    events.push({
      label: `Assigned to ${assigneeName}`,
      timestamp: task.created?.timestamp ? Number(task.created.timestamp) + 1 : null,
      actor: 'System',
      color: '#0288d1',
    });
  }

  if (task.ownership?.claimed_at) {
    events.push({
      label: 'Claimed',
      timestamp: Number(task.ownership.claimed_at),
      actor: task.ownership.claimed_by?.name || 'Unknown',
      color: '#5e35b1',
    });
  }

  if (task.status?.name === 'in_progress' && task.modified?.timestamp) {
    events.push({
      label: 'Work started',
      timestamp: Number(task.modified.timestamp),
      actor: task.ownership?.claimed_by?.name || 'Unknown',
      color: '#1976d2',
    });
  }

  if (task.status?.name === 'completed' && task.modified?.timestamp) {
    events.push({
      label: 'Completed',
      timestamp: Number(task.modified.timestamp),
      actor: task.modified.user?.name || task.ownership?.claimed_by?.name || 'Unknown',
      color: '#2e7d32',
    });
  }

  if (task.status?.name === 'rejected' && task.modified?.timestamp) {
    events.push({
      label: 'Rejected',
      timestamp: Number(task.modified.timestamp),
      actor: task.modified.user?.name || task.ownership?.claimed_by?.name || 'Unknown',
      color: '#d32f2f',
    });
  }

  if (task.status?.name === 'expired') {
    events.push({
      label: 'Expired (SLA breached)',
      timestamp: task.sla?.due_at ? Number(task.sla.due_at) : null,
      actor: 'System',
      color: '#757575',
    });
  }

  if (task.status?.name === 'invalidated' && task.modified?.timestamp) {
    events.push({
      label: 'Invalidated',
      timestamp: Number(task.modified.timestamp),
      actor: task.modified.user?.name || 'System',
      color: '#546e7a',
    });
  }

  return events.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

export default function TaskActivityTab({ task }) {
  const timeline = useMemo(() => buildActivityTimeline(task), [task]);

  if (timeline.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No activity recorded yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      {timeline.map((event, idx) => (
        <Box
          key={idx}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            position: 'relative',
            pb: 2,
            '&:not(:last-child)::before': {
              content: '""',
              position: 'absolute',
              left: 7,
              top: 16,
              bottom: 0,
              width: 2,
              backgroundColor: '#e0e0e0',
            },
          }}
        >
          <FiberManualRecordIcon
            sx={{ fontSize: 14, color: event.color, mt: 0.25, flexShrink: 0 }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
              {event.label}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {event.actor}
              </Typography>
              {event.timestamp && (
                <Typography variant="caption" color="text.secondary">
                  · {new Date(event.timestamp).toLocaleString()}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
