import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Collapse,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SummarizeIcon from '@mui/icons-material/Summarize';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StorageIcon from '@mui/icons-material/Storage';
import TimelineIcon from '@mui/icons-material/Timeline';
import ChecklistIcon from '@mui/icons-material/Checklist';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';

const KIND_CONFIG = {
  summary: { icon: SummarizeIcon, label: 'Summary', color: '#1976d2' },
  task_context: { icon: InfoOutlinedIcon, label: 'Task Context', color: '#7b1fa2' },
  financial_summary: { icon: AttachMoneyIcon, label: 'Financial Summary', color: '#2e7d32' },
  entity_snapshot: { icon: StorageIcon, label: 'Entity Snapshot', color: '#455a64' },
  activity_timeline: { icon: TimelineIcon, label: 'Activity Timeline', color: '#0288d1' },
  recommended_next_steps: { icon: ChecklistIcon, label: 'Recommended Steps', color: '#f57c00' },
  viewport_overview: { icon: VisibilityIcon, label: 'Viewport Overview', color: '#546e7a' },
};

function SummaryCard({ payload }) {
  return (
    <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
      {payload?.issue || payload?.summary || JSON.stringify(payload)}
    </Alert>
  );
}

function FinancialSummaryCard({ payload }) {
  if (!payload) {
    return null;
  }

  return (
    <Table size="small">
      <TableBody>
        {Object.entries(payload).map(([key, value]) => (
          <TableRow key={key} sx={{ '&:last-child td': { borderBottom: 0 } }}>
            <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 0.5, px: 1, width: '40%' }}>
              {key.replace(/_/g, ' ')}
            </TableCell>
            <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500, py: 0.5, px: 1 }}>
              {typeof value === 'number' ? value.toLocaleString() : String(value)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EntitySnapshotCard({ payload }) {
  if (!payload) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {payload.system_entity && (
        <Chip
          size="small"
          label={`${payload.system_entity}: ${payload.system_entity_id}`}
          variant="outlined"
          sx={{ fontSize: '0.7rem', alignSelf: 'flex-start' }}
        />
      )}
      {payload.state && (
        <Table size="small">
          <TableBody>
            {Object.entries(payload.state).map(([key, value]) => (
              <TableRow key={key} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 0.25, px: 1 }}>
                  {key.replace(/_/g, ' ')}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem', py: 0.25, px: 1 }}>
                  {String(value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

function ActivityTimelineCard({ payload }) {
  const events = payload?.last_events || [];

  return (
    <List dense disablePadding>
      {events.map((event, idx) => (
        <ListItem key={idx} sx={{ py: 0.25, px: 0 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#1976d2',
              mr: 1,
              flexShrink: 0,
            }}
          />
          <ListItemText
            primary={event.title}
            secondary={
              <>
                {event.actor?.name || event.actor?.type || ''}
                {event.timestamp && ` · ${new Date(Number(event.timestamp)).toLocaleString()}`}
              </>
            }
            primaryTypographyProps={{ fontSize: '0.8rem' }}
            secondaryTypographyProps={{ fontSize: '0.7rem' }}
          />
        </ListItem>
      ))}
    </List>
  );
}

function RecommendedStepsCard({ payload }) {
  const steps = payload?.steps || [];

  return (
    <List dense disablePadding>
      {steps
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((step, idx) => (
          <ListItem key={idx} sx={{ py: 0.25, px: 0 }}>
            <Chip
              size="small"
              label={step.order || idx + 1}
              sx={{ mr: 1, fontSize: '0.7rem', height: 20, minWidth: 20 }}
            />
            <ListItemText
              primary={step.action}
              secondary={step.hint}
              primaryTypographyProps={{ fontSize: '0.8rem' }}
              secondaryTypographyProps={{ fontSize: '0.7rem' }}
            />
          </ListItem>
        ))}
    </List>
  );
}

function DefaultCard({ payload }) {
  return (
    <Typography
      variant="caption"
      sx={{ fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}
    >
      {JSON.stringify(payload, null, 2)}
    </Typography>
  );
}

function EvidenceCard({ block }) {
  const [expanded, setExpanded] = useState(true);
  const config = KIND_CONFIG[block.kind] || { icon: InfoOutlinedIcon, label: block.kind, color: '#757575' };
  const IconComponent = config.icon;

  const renderContent = () => {
    switch (block.kind) {
      case 'summary':
        return <SummaryCard payload={block.payload} />;
      case 'financial_summary':
        return <FinancialSummaryCard payload={block.payload} />;
      case 'entity_snapshot':
        return <EntitySnapshotCard payload={block.payload} />;
      case 'activity_timeline':
        return <ActivityTimelineCard payload={block.payload} />;
      case 'recommended_next_steps':
        return <RecommendedStepsCard payload={block.payload} />;
      case 'task_context':
      case 'viewport_overview':
        return <FinancialSummaryCard payload={block.payload} />;
      default:
        return <DefaultCard payload={block.payload} />;
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderLeft: `3px solid ${config.color}` }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.75,
          cursor: 'pointer',
          '&:hover': { backgroundColor: '#f5f7f9' },
        }}
      >
        <IconComponent sx={{ fontSize: 16, color: config.color }} />
        <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>
          {config.label}
        </Typography>
        <IconButton size="small" sx={{ p: 0 }}>
          {expanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ px: 1.5, pb: 1 }}>
          {renderContent()}
        </Box>
      </Collapse>
    </Paper>
  );
}

export default function TaskEvidenceTab({ task }) {
  const evidence = task?.payload?.evidence || [];

  if (evidence.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No evidence blocks attached to this task.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1 }}>
      {evidence.map((block, idx) => (
        <EvidenceCard key={idx} block={block} />
      ))}
    </Box>
  );
}
