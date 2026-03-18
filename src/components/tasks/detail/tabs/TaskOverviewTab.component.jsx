import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import SummarizeIcon from '@mui/icons-material/Summarize';
import LinkIcon from '@mui/icons-material/Link';

// ─── Theme tokens ───────────────────────────────────────────────────────────

const T = {
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  surfaceGray: '#F9FAFB',
  border: '#E5E7EB',
};

// ─── Styled boxes ───────────────────────────────────────────────────────────

const descriptionBoxSx = {
  background: T.surfaceGray,
  border: `1px solid ${T.border}`,
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '0.85rem',
  color: T.textPrimary,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  minHeight: 40,
};

const sectionLabelSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  fontSize: '0.82rem',
  color: T.textSecondary,
  mb: 1,
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function TaskOverviewTab({ task }) {
  if (!task) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Description / Instructions */}
      <Box>
        <Box sx={sectionLabelSx}>
          <DescriptionIcon sx={{ fontSize: 14 }} />
          Description
        </Box>
        <Box sx={descriptionBoxSx}>{task.details || 'No description provided.'}</Box>
      </Box>

      {/* Summary */}
      {task.payload?.summary && (
        <Box>
          <Box sx={sectionLabelSx}>
            <SummarizeIcon sx={{ fontSize: 14 }} />
            Summary
          </Box>
          <Box sx={descriptionBoxSx}>{task.payload.summary}</Box>
        </Box>
      )}

      {/* Linked Entities */}
      {task.payload?.linked_entities?.length > 0 && (
        <Box>
          <Box sx={sectionLabelSx}>
            <LinkIcon sx={{ fontSize: 14 }} />
            Linked Entities
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {task.payload.linked_entities.map((entity, idx) => (
              <Chip
                key={idx}
                size="small"
                icon={<LinkIcon sx={{ fontSize: 14 }} />}
                label={`${entity.system_domain || ''}: ${entity.system_entity_id || '-'}`}
                variant="outlined"
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  borderColor: T.border,
                  color: T.textPrimary,
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
