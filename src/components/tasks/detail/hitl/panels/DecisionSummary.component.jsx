import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { THEME_COLORS } from '../theme.js';

const DECISION_CONFIG = {
  approved: {
    label: 'Approved',
    color: THEME_COLORS.successDark,
    softBg: 'rgba(48, 187, 183, 0.10)',
    icon: CheckCircleOutlineIcon,
  },
  rejected: {
    label: 'Rejected',
    color: THEME_COLORS.errorDark,
    softBg: 'rgba(251, 113, 133, 0.12)',
    icon: CancelOutlinedIcon,
  },
  edited: {
    label: 'Edited',
    color: THEME_COLORS.brandPrimary,
    softBg: 'rgba(58, 46, 79, 0.08)',
    icon: EditOutlinedIcon,
  },
};

export default function DecisionSummary({ task }) {
  const outputs = task?.payload?.outputs || task?.outputs || {};
  const decision = outputs.decision;

  if (!decision) {
    return null;
  }

  const config = DECISION_CONFIG[decision] || DECISION_CONFIG.approved;
  const DecisionIcon = config.icon;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: '10px 12px',
          borderRadius: '8px',
          backgroundColor: config.softBg,
          border: `1px solid ${THEME_COLORS.border}`,
        }}
      >
        <DecisionIcon sx={{ fontSize: 18, color: config.color }} />
        <Typography
          sx={{ fontSize: '0.82rem', fontWeight: 600, color: config.color, flex: 1 }}
        >
          {config.label}
        </Typography>
        {outputs.approver && (
          <Typography sx={{ fontSize: '0.75rem', color: THEME_COLORS.textSecondary }}>
            by {outputs.approver}
          </Typography>
        )}
      </Box>

      {outputs.comment && (
        <Box>
          <Typography
            sx={{ fontSize: '0.72rem', color: THEME_COLORS.textSecondary, mb: 0.25 }}
          >
            Comment
          </Typography>
          <Typography
            sx={{
              fontSize: '0.82rem',
              color: THEME_COLORS.textPrimary,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5,
            }}
          >
            {outputs.comment}
          </Typography>
        </Box>
      )}

      {outputs.selected?.length > 0 && (
        <Box>
          <Typography
            sx={{ fontSize: '0.72rem', color: THEME_COLORS.textSecondary, mb: 0.5 }}
          >
            Selected
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {outputs.selected.map((item, index) => (
              <Chip
                key={item.id || index}
                label={item.title || item.name || item.id}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem', borderColor: THEME_COLORS.border }}
              />
            ))}
          </Box>
        </Box>
      )}

      {outputs.edited_content?.text && (
        <Box>
          <Typography
            sx={{ fontSize: '0.72rem', color: THEME_COLORS.textSecondary, mb: 0.25 }}
          >
            Edited content
          </Typography>
          <Box
            component="pre"
            sx={{
              background: THEME_COLORS.surface,
              border: `1px solid ${THEME_COLORS.border}`,
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: THEME_COLORS.textPrimary,
              overflow: 'auto',
              maxHeight: 120,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {outputs.edited_content.text}
          </Box>
        </Box>
      )}
    </Box>
  );
}
