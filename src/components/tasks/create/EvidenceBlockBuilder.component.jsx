import React, { useCallback } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const EVIDENCE_KINDS = [
  { value: 'summary', label: 'Summary' },
  { value: 'task_context', label: 'Task Context' },
  { value: 'financial_summary', label: 'Financial Summary' },
  { value: 'entity_snapshot', label: 'Entity Snapshot' },
  { value: 'activity_timeline', label: 'Activity Timeline' },
  { value: 'recommended_next_steps', label: 'Recommended Steps' },
  { value: 'viewport_overview', label: 'Viewport Overview' },
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
            <Select
              size="small"
              value={block.kind || 'summary'}
              onChange={(e) => handleBlockChange(idx, 'kind', e.target.value)}
              sx={{ minWidth: 160, fontSize: '0.8rem' }}
            >
              {EVIDENCE_KINDS.map((k) => (
                <MenuItem key={k.value} value={k.value} sx={{ fontSize: '0.8rem' }}>
                  {k.label}
                </MenuItem>
              ))}
            </Select>
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" onClick={() => removeBlock(idx)} color="error">
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          {CodeEditor ? (
            <CodeEditor
              value={JSON.stringify(block.payload || {}, null, 2)}
              onChange={(val) => handlePayloadChange(idx, val)}
              height="80px"
              language="json"
            />
          ) : (
            <TextField
              size="small"
              multiline
              rows={3}
              value={JSON.stringify(block.payload || {}, null, 2)}
              onChange={(e) => handlePayloadChange(idx, e.target.value)}
              sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
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
