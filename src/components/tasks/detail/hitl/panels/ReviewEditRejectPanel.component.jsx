import React, { useState, useMemo } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { THEME_COLORS as T } from '../theme.js';

export default function ReviewEditRejectPanel({ hitl, onSubmit, isSubmitting, canSubmit = true }) {
  const content = hitl?.content || {};
  const editable = content.editable !== false;

  const originalBody = useMemo(() => {
    if (content.text) return content.text;
    if (content.markdown) return content.markdown;
    if (content.json) return JSON.stringify(content.json, null, 2);
    return '';
  }, [content]);

  const [body, setBody] = useState(originalBody);
  const [comment, setComment] = useState('');

  const title = hitl?.title || 'Review content';
  const description = hitl?.description || 'Approve, edit, or reject the generated content.';
  const hasEdits = body !== originalBody;

  const handleSubmit = (decision) => {
    const payload = {
      decision,
      approval_type: hitl?.approval_type,
      comment: comment.trim() || undefined,
    };

    if (decision === 'edited') {
      payload.edited_content = { ...content, text: body };
    }

    onSubmit(payload);
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

      {originalBody ? (
        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={12}
          size="small"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isSubmitting || !editable}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              lineHeight: 1.6,
            },
          }}
        />
      ) : (
        <Typography sx={{ fontSize: '0.82rem', color: T.textSecondary, fontStyle: 'italic' }}>
          No content provided in HITL payload.
        </Typography>
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
          flexWrap: 'wrap',
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
        {editable && hasEdits && (
          <Button
            variant="outlined"
            size="small"
            disabled={isSubmitting || !canSubmit}
            onClick={() => handleSubmit('edited')}
            sx={{
              color: T.brandPrimary,
              borderColor: T.brandPrimary,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                borderColor: T.brandPrimaryDark,
                backgroundColor: 'rgba(58,46,79,0.04)',
              },
            }}
          >
            Submit edits
          </Button>
        )}
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
          Approve original
        </Button>
      </Box>
    </Box>
  );
}
