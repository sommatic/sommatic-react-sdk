import React from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { THEME_COLORS as T } from './theme.js';

function renderField(name, prop, value, onChange, disabled) {
  if (prop.enum) {
    return (
      <Select
        size="small"
        fullWidth
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        displayEmpty
        disabled={disabled}
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
            size="small"
            checked={!!value}
            onChange={(e) => onChange(name, e.target.checked)}
            disabled={disabled}
          />
        }
        label={prop.title || name}
      />
    );
  }

  if (prop.type === 'number' || prop.type === 'integer') {
    return (
      <TextField
        size="small"
        fullWidth
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(name, raw === '' ? null : Number(raw));
        }}
        disabled={disabled}
        placeholder={prop.title || name}
      />
    );
  }

  const isLongText =
    prop.minLength > 50 || name === 'reason' || name === 'notes' || name === 'comments';

  return (
    <TextField
      size="small"
      fullWidth
      multiline={isLongText}
      rows={isLongText ? 3 : 1}
      value={value ?? ''}
      onChange={(e) => onChange(name, e.target.value)}
      disabled={disabled}
      placeholder={prop.title || name}
      inputProps={{ minLength: prop.minLength }}
    />
  );
}

// Fields the approval gate panels already supply to the output payload. We don't render
// them here to avoid duplicating the approval decision UI.
const FIELDS_HANDLED_BY_APPROVAL_GATE = new Set([
  'decision',
  'approver',
  'comment',
  'correlation',
  'approval_type',
  'selected',
  'edited_content',
]);

export default function OutputSchemaSection({ schema, outputs, onOutputsChange, disabled }) {
  if (!schema?.properties || Object.keys(schema.properties).length === 0) {
    return null;
  }

  const requiredFields = schema.required || [];

  const handleFieldChange = (name, value) => {
    onOutputsChange({ ...outputs, [name]: value });
  };

  const entries = Object.entries(schema.properties).filter(
    ([name]) => !FIELDS_HANDLED_BY_APPROVAL_GATE.has(name),
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        background: T.surfaceGray,
        border: `1px solid ${T.border}`,
        borderRadius: '8px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.72rem',
          color: T.textSecondary,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Required outputs
      </Typography>
      {entries.map(([name, prop]) => {
        const isRequired = requiredFields.includes(name);
        return (
          <Box key={name}>
            <Typography
              sx={{
                fontSize: '0.72rem',
                color: T.textSecondary,
                mb: 0.5,
                display: 'block',
              }}
            >
              {prop.title || name}
              {isRequired && <span style={{ color: T.errorDark, marginLeft: 2 }}>*</span>}
            </Typography>
            {renderField(name, prop, outputs[name], handleFieldChange, disabled)}
          </Box>
        );
      })}
    </Box>
  );
}

// Exported helper to compute whether outputs satisfy the schema's required fields
export function isOutputsValid(schema, outputs) {
  const requiredFields = schema?.required || [];
  if (requiredFields.length === 0) return true;

  return requiredFields.every((field) => {
    if (FIELDS_HANDLED_BY_APPROVAL_GATE.has(field)) {
      return true; // approval gate panel supplies this
    }
    const v = outputs?.[field];
    return v !== null && v !== undefined && v !== '';
  });
}
