import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
} from '@mui/material';
import { THEME_COLORS as T } from '../theme.js';

export default function MultiSelectPanel({ hitl, onSubmit, isSubmitting, canSubmit = true }) {
  const options = hitl?.options || [];
  const minSelection = hitl?.min_selection ?? 1;
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [comment, setComment] = useState('');

  const title = hitl?.title || 'Choose one or more options';
  const description = hitl?.description || '';

  const toggleOption = (optionId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  };

  const handleSubmit = (decision) => {
    const selectedOptions = options.filter((o) => selectedIds.has(o.id));
    onSubmit({
      decision,
      approval_type: hitl?.approval_type,
      selected: selectedOptions,
      comment: comment.trim() || undefined,
    });
  };

  const canConfirm = selectedIds.size >= minSelection;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: T.textPrimary }}>
          {title}
        </Typography>
        {description && (
          <Typography sx={{ fontSize: '0.82rem', color: T.textSecondary, mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          background: T.surfaceGray,
          border: `1px solid ${T.border}`,
          borderRadius: '8px',
          padding: '8px 14px',
        }}
      >
        <FormGroup>
          {options.map((option) => (
            <FormControlLabel
              key={option.id}
              disabled={isSubmitting}
              control={
                <Checkbox
                  size="small"
                  checked={selectedIds.has(option.id)}
                  onChange={() => toggleOption(option.id)}
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: T.textPrimary }}>
                    {option.title || option.name}
                  </Typography>
                  {option.description && (
                    <Typography sx={{ fontSize: '0.75rem', color: T.textSecondary }}>
                      {option.description}
                    </Typography>
                  )}
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 0.5, '& .MuiCheckbox-root': { pt: 0.5 } }}
            />
          ))}
        </FormGroup>
      </Box>

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
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={isSubmitting || !canConfirm || !canSubmit}
          onClick={() => handleSubmit('approved')}
          sx={{
            backgroundColor: T.successDark,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': { backgroundColor: T.success, boxShadow: 'none' },
          }}
        >
          {`Confirm (${selectedIds.size})`}
        </Button>
      </Box>
    </Box>
  );
}
