import React, { useState } from 'react';
import { Box, Button, Chip, TextField, Typography } from '@mui/material';
import { THEME_COLORS as T } from '../theme.js';

const RISK_COLORS = {
  low: T.successDark,
  medium: T.warning,
  high: T.errorDark,
  critical: T.errorDark,
};

export default function ToolApprovalPanel({ hitl, onSubmit, isSubmitting, canSubmit = true }) {
  const [comment, setComment] = useState('');

  const tool = hitl?.tool || {};
  const title = hitl?.title || `Allow tool: ${tool.name || 'unknown'}?`;
  const description = hitl?.description || 'An agent requests permission to call this tool.';
  const riskLevel = tool.risk_level || 'medium';
  const riskColor = RISK_COLORS[riskLevel] || RISK_COLORS.medium;

  const handleSubmit = (decision) => {
    onSubmit({
      decision,
      approval_type: hitl?.approval_type,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: T.textPrimary }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', color: T.textSecondary, mt: 0.5 }}>
          {description}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={tool.name || 'unknown'}
          size="small"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            fontFamily: 'monospace',
            backgroundColor: T.surfaceGray,
            border: `1px solid ${T.border}`,
          }}
        />
        <Chip
          label={riskLevel}
          size="small"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: '#fff',
            backgroundColor: riskColor,
          }}
        />
      </Box>

      {tool.args && (
        <Box
          component="pre"
          sx={{
            background: T.surfaceGray,
            border: `1px solid ${T.border}`,
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            color: T.textPrimary,
            overflow: 'auto',
            maxHeight: 160,
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {typeof tool.args === 'string' ? tool.args : JSON.stringify(tool.args, null, 2)}
        </Box>
      )}

      <TextField
        fullWidth
        multiline
        rows={2}
        size="small"
        label="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={isSubmitting}
        sx={{ '& .MuiInputBase-input': { fontSize: '0.82rem' } }}
      />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 1,
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          mx: -2,
          px: 2,
          py: 1.5,
          mt: 1,
          backgroundColor: T.surface,
          borderTop: `1px solid ${T.border}`,
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
        }}
      >
        {!canSubmit && (
          <Typography sx={{ fontSize: '0.72rem', color: T.textSecondary }}>
            Fill required outputs to continue
          </Typography>
        )}
        <Button
          variant="outlined"
          size="small"
          disabled={isSubmitting || !canSubmit}
          onClick={() => handleSubmit('rejected')}
          sx={{
            color: T.errorDark,
            borderColor: T.errorDark,
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': { borderColor: T.errorDark, backgroundColor: 'rgba(159,18,57,0.04)' },
          }}
        >
          Deny
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={isSubmitting || !canSubmit}
          onClick={() => handleSubmit('approved')}
          sx={{
            backgroundColor: T.successDark,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': { backgroundColor: T.success, boxShadow: 'none' },
          }}
        >
          Allow
        </Button>
      </Box>
    </Box>
  );
}
