import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { THEME_COLORS as T } from '../theme.js';

export default function PlanReviewPanel({ hitl, onSubmit, isSubmitting, canSubmit = true }) {
  const [comment, setComment] = useState('');

  const title = hitl?.title || 'Review plan before execution';
  const description = hitl?.description || 'Approve or reject the proposed plan.';
  const steps = hitl?.plan?.steps || [];

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

      {steps.length > 0 && (
        <Box
          sx={{
            background: T.surfaceGray,
            border: `1px solid ${T.border}`,
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {steps.map((step, index) => (
            <Box
              key={step.id || index}
              sx={{
                display: 'flex',
                gap: 1.5,
                padding: '10px 14px',
                borderBottom: index < steps.length - 1 ? `1px solid ${T.border}` : 'none',
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  backgroundColor: T.brandPrimary,
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {index + 1}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.textPrimary }}>
                  {step.title}
                </Typography>
                {step.detail && (
                  <Typography sx={{ fontSize: '0.78rem', color: T.textSecondary, mt: 0.25 }}>
                    {step.detail}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
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
          Reject
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
          Approve
        </Button>
      </Box>
    </Box>
  );
}
