import React, { useCallback } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  IconButton,
  Typography,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

// Preset kinds shown as autocomplete suggestions. The field is free-solo, so a
// custom kind (e.g. "error", "email_context") is accepted and shown as typed —
// unknown kinds are valid, not hidden.
const EVIDENCE_KINDS = [
  'summary',
  'error',
  'email_context',
  'task_context',
  'entity_snapshot',
  'financial_summary',
  'activity_timeline',
  'recommended_next_steps',
  'viewport_overview',
];

export default function EvidenceBlockBuilder({
  evidence,
  onEvidenceChange,
  CodeEditor,
}) {
  const handleBlockChange = useCallback(
    (index, key, value) => {
      const updated = [...evidence];
      updated[index] = { ...updated[index], [key]: value };
      onEvidenceChange(updated);
    },
    [evidence, onEvidenceChange]
  );

  const handlePayloadChange = useCallback(
    (index, jsonString) => {
      try {
        const parsed = JSON.parse(jsonString);
        const updated = [...evidence];
        updated[index] = { ...updated[index], payload: parsed };
        onEvidenceChange(updated);
      } catch {
        // Invalid JSON, ignore until valid
      }
    },
    [evidence, onEvidenceChange]
  );

  const addBlock = useCallback(() => {
    onEvidenceChange([...evidence, { kind: 'summary', payload: {} }]);
  }, [evidence, onEvidenceChange]);

  const removeBlock = useCallback(
    (index) => {
      onEvidenceChange(evidence.filter((_, i) => i !== index));
    },
    [evidence, onEvidenceChange]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Evidence Blocks
      </Typography>

      {evidence.map((block, idx) => (
        <Paper
          key={idx}
          variant="outlined"
          sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Autocomplete
              size="small"
              freeSolo
              fullWidth
              options={EVIDENCE_KINDS}
              value={block.kind || ''}
              onChange={(_, v) => handleBlockChange(idx, 'kind', v || '')}
              onInputChange={(_, v, reason) => {
                if (reason === 'input') handleBlockChange(idx, 'kind', v || '');
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Kind (e.g. error, email_context)" />
              )}
              sx={{ minWidth: 220, '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
            />
            <IconButton size="small" onClick={() => removeBlock(idx)} color="error">
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
            Value
          </Typography>
          {CodeEditor ? (
            <CodeEditor
              defaultValue={JSON.stringify(block.payload || {}, null, 2)}
              onChange={(val) => handlePayloadChange(idx, val)}
              height="120px"
              language="json"
            />
          ) : (
            <TextField
              size="small"
              multiline
              minRows={3}
              maxRows={12}
              fullWidth
              value={JSON.stringify(block.payload || {}, null, 2)}
              onChange={(e) => handlePayloadChange(idx, e.target.value)}
              InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.72rem' } }}
            />
          )}
        </Paper>
      ))}

      <Box
        onClick={addBlock}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          color: 'text.secondary',
          '&:hover': { color: 'primary.main' },
          py: 0.5,
        }}
      >
        <AddIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption">Add evidence block</Typography>
      </Box>
    </Box>
  );
}
