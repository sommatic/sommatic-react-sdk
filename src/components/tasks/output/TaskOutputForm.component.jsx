import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
  Typography,
  Paper,
  Alert,
  Chip,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

function renderFieldInput(name, prop, value, onChange) {
  if (prop.enum) {
    return (
      <Select
        size="small"
        fullWidth
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        displayEmpty
      >
        <MenuItem value="" disabled>
          <em>Select {name}</em>
        </MenuItem>
        {prop.enum.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    );
  }

  if (prop.type === 'boolean') {
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={!!value}
            onChange={(e) => onChange(name, e.target.checked)}
          />
        }
        label={name}
      />
    );
  }

  if (prop.type === 'number') {
    return (
      <TextField
        size="small"
        fullWidth
        type="number"
        label={name}
        value={value ?? ''}
        onChange={(e) => onChange(name, Number(e.target.value))}
      />
    );
  }

  // Default: string
  const isLongText = prop.minLength > 50 || name === 'reason' || name === 'notes';
  return (
    <TextField
      size="small"
      fullWidth
      multiline={isLongText}
      rows={isLongText ? 3 : 1}
      label={name}
      value={value || ''}
      onChange={(e) => onChange(name, e.target.value)}
      inputProps={{ minLength: prop.minLength }}
    />
  );
}

function ApprovalLayout({ schema, uiHint, outputs, onOutputsChange, onComplete, isReadOnly }) {
  const decisionLabels = uiHint?.decision_labels || {
    approved: 'Approve',
    rejected: 'Reject',
  };
  const decisionOptions = schema.properties?.decision?.enum || ['approved', 'rejected'];

  const handleDecision = (decision) => {
    onOutputsChange({ ...outputs, decision });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Decision buttons */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {decisionOptions.map((opt) => (
          <Button
            key={opt}
            variant={outputs.decision === opt ? 'contained' : 'outlined'}
            color={opt === 'approved' ? 'success' : 'error'}
            startIcon={
              opt === 'approved' ? <CheckCircleOutlineIcon /> : <CancelOutlinedIcon />
            }
            onClick={() => handleDecision(opt)}
            disabled={isReadOnly}
            sx={{ flex: 1, textTransform: 'none' }}
          >
            {decisionLabels[opt] || opt}
          </Button>
        ))}
      </Box>

      {/* Reason (if required or selected rejection) */}
      {(uiHint?.require_reason || outputs.decision === 'rejected') && (
        <TextField
          size="small"
          fullWidth
          multiline
          rows={3}
          label="Reason"
          placeholder="Provide a reason for your decision..."
          value={outputs.reason || ''}
          onChange={(e) => onOutputsChange({ ...outputs, reason: e.target.value })}
          disabled={isReadOnly}
          required
        />
      )}

      {/* Notes (optional) */}
      {schema.properties?.notes && (
        <TextField
          size="small"
          fullWidth
          multiline
          rows={2}
          label="Notes (optional)"
          value={outputs.notes || ''}
          onChange={(e) => onOutputsChange({ ...outputs, notes: e.target.value })}
          disabled={isReadOnly}
        />
      )}

      {/* Additional fields beyond decision/reason/notes */}
      {Object.entries(schema.properties || {})
        .filter(([name]) => !['decision', 'reason', 'notes'].includes(name))
        .map(([name, prop]) => (
          <Box key={name}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              {name} {(schema.required || []).includes(name) && '*'}
            </Typography>
            {renderFieldInput(name, prop, outputs[name], (n, v) =>
              onOutputsChange({ ...outputs, [n]: v })
            )}
          </Box>
        ))}
    </Box>
  );
}

function FormLayout({ schema, outputs, onOutputsChange, isReadOnly }) {
  const properties = schema.properties || {};
  const requiredFields = schema.required || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {Object.entries(properties).map(([name, prop]) => (
        <Box key={name}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            {name} {requiredFields.includes(name) && '*'}
          </Typography>
          {isReadOnly ? (
            <Typography variant="body2">
              {typeof outputs[name] === 'object'
                ? JSON.stringify(outputs[name], null, 2)
                : String(outputs[name] ?? '-')}
            </Typography>
          ) : (
            renderFieldInput(name, prop, outputs[name], (n, v) =>
              onOutputsChange({ ...outputs, [n]: v })
            )
          )}
        </Box>
      ))}
    </Box>
  );
}

export default function TaskOutputForm({
  requiredOutput,
  outputs: initialOutputs,
  onOutputsChange,
  onComplete,
  isReadOnly,
  CodeEditor,
}) {
  const [outputs, setOutputs] = useState(initialOutputs || {});

  const schema = requiredOutput?.schema || {};
  const uiHint = requiredOutput?.ui_hint || {};
  const layout = uiHint.layout || 'form';

  const handleChange = useCallback(
    (newOutputs) => {
      setOutputs(newOutputs);
      onOutputsChange?.(newOutputs);
    },
    [onOutputsChange]
  );

  const isValid = useMemo(() => {
    const requiredFields = schema.required || [];
    return requiredFields.every((field) => {
      const value = outputs[field];
      if (value === null || value === undefined || value === '') {
        return false;
      }
      return true;
    });
  }, [outputs, schema]);

  if (isReadOnly && initialOutputs) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ fontSize: '0.8rem' }}>
          Task completed with outputs
        </Alert>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <FormLayout
            schema={schema}
            outputs={initialOutputs}
            onOutputsChange={() => {}}
            isReadOnly
          />
        </Paper>
      </Box>
    );
  }

  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    if (!CodeEditor) {
      return (
        <TextField
          size="small"
          fullWidth
          multiline
          rows={4}
          label="Outputs (JSON)"
          value={JSON.stringify(outputs, null, 2)}
          onChange={(e) => {
            try {
              handleChange(JSON.parse(e.target.value));
            } catch {
              // Invalid JSON
            }
          }}
          sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
        />
      );
    }

    return (
      <CodeEditor
        value={JSON.stringify(outputs, null, 2)}
        onChange={(val) => {
          try {
            handleChange(JSON.parse(val));
          } catch {
            // Invalid JSON
          }
        }}
        height="150px"
        language="json"
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {layout === 'approval' ? (
        <ApprovalLayout
          schema={schema}
          uiHint={uiHint}
          outputs={outputs}
          onOutputsChange={handleChange}
          onComplete={onComplete}
          isReadOnly={isReadOnly}
        />
      ) : (
        <FormLayout
          schema={schema}
          outputs={outputs}
          onOutputsChange={handleChange}
          isReadOnly={isReadOnly}
        />
      )}

      {!isReadOnly && onComplete && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          {!isValid && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Fill required fields to complete
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            onClick={() => onComplete(outputs)}
            disabled={!isValid}
            sx={{ textTransform: 'none' }}
          >
            Complete Task
          </Button>
        </Box>
      )}
    </Box>
  );
}
