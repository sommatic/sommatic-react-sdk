import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
  Typography,
  Chip,
  Paper,
  Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import ViewListIcon from '@mui/icons-material/ViewList';

const FIELD_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'enum', label: 'Enum (options)' },
];

const UI_HINT_LAYOUTS = [
  { value: 'approval', label: 'Approval' },
  { value: 'form', label: 'Form' },
  { value: 'custom', label: 'Custom' },
];

function buildSchemaFromFields(fields) {
  if (!fields || fields.length === 0) {
    return {};
  }

  const properties = {};
  const required = [];

  for (const field of fields) {
    if (!field.name) {
      continue;
    }

    const prop = { type: field.type === 'enum' ? 'string' : field.type };

    if (field.type === 'enum' && field.enumOptions) {
      prop.enum = field.enumOptions
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    }

    if (field.minLength) {
      prop.minLength = Number(field.minLength);
    }

    properties[field.name] = prop;

    if (field.required) {
      required.push(field.name);
    }
  }

  const schema = { type: 'object', properties };

  if (required.length > 0) {
    schema.required = required;
  }

  return schema;
}

function parseSchemaToFields(schema) {
  if (!schema || !schema.properties) {
    return [];
  }

  const requiredFields = schema.required || [];

  return Object.entries(schema.properties).map(([name, prop]) => ({
    name,
    type: prop.enum ? 'enum' : prop.type || 'string',
    required: requiredFields.includes(name),
    enumOptions: prop.enum ? prop.enum.join(', ') : '',
    minLength: prop.minLength || '',
  }));
}

export default function SchemaFieldBuilder({
  schema,
  uiHint,
  onSchemaChange,
  onUiHintChange,
  CodeEditor,
}) {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [fields, setFields] = useState(() => parseSchemaToFields(schema));

  const handleFieldChange = useCallback(
    (index, key, value) => {
      const updated = [...fields];
      updated[index] = { ...updated[index], [key]: value };
      setFields(updated);
      onSchemaChange(buildSchemaFromFields(updated));
    },
    [fields, onSchemaChange]
  );

  const addField = useCallback(() => {
    const updated = [
      ...fields,
      { name: '', type: 'string', required: false, enumOptions: '', minLength: '' },
    ];
    setFields(updated);
  }, [fields]);

  const removeField = useCallback(
    (index) => {
      const updated = fields.filter((_, i) => i !== index);
      setFields(updated);
      onSchemaChange(buildSchemaFromFields(updated));
    },
    [fields, onSchemaChange]
  );

  const handleAdvancedChange = useCallback(
    (jsonString) => {
      try {
        const parsed = JSON.parse(jsonString);
        onSchemaChange(parsed);
        setFields(parseSchemaToFields(parsed));
      } catch {
        // Invalid JSON, ignore
      }
    },
    [onSchemaChange]
  );

  const generatedSchema = useMemo(() => buildSchemaFromFields(fields), [fields]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Mode toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Output Schema
        </Typography>
        <Chip
          size="small"
          icon={isAdvancedMode ? <CodeIcon /> : <ViewListIcon />}
          label={isAdvancedMode ? 'JSON' : 'Visual'}
          onClick={() => setIsAdvancedMode(!isAdvancedMode)}
          variant="outlined"
          sx={{ fontSize: '0.7rem', height: 24 }}
        />
      </Box>

      {isAdvancedMode ? (
        /* Advanced JSON mode */
        CodeEditor ? (
          <CodeEditor
            value={JSON.stringify(schema || {}, null, 2)}
            onChange={handleAdvancedChange}
            height="180px"
            language="json"
          />
        ) : (
          <TextField
            multiline
            rows={6}
            size="small"
            value={JSON.stringify(schema || {}, null, 2)}
            onChange={(e) => handleAdvancedChange(e.target.value)}
            sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
          />
        )
      ) : (
        /* Visual builder */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {fields.map((field, idx) => (
            <Paper
              key={idx}
              variant="outlined"
              sx={{ p: 1, display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}
            >
              <TextField
                size="small"
                placeholder="Field name"
                value={field.name}
                onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                sx={{ flex: 1, minWidth: 100 }}
                InputProps={{ sx: { fontSize: '0.8rem' } }}
              />
              <Select
                size="small"
                value={field.type}
                onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                sx={{ minWidth: 100, fontSize: '0.8rem' }}
              >
                {FIELD_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value} sx={{ fontSize: '0.8rem' }}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={field.required}
                    onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                  />
                }
                label={<Typography variant="caption">Req</Typography>}
                sx={{ mx: 0 }}
              />
              <IconButton size="small" onClick={() => removeField(idx)} color="error">
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
              {field.type === 'enum' && (
                <TextField
                  size="small"
                  placeholder="Options (comma-separated)"
                  value={field.enumOptions}
                  onChange={(e) => handleFieldChange(idx, 'enumOptions', e.target.value)}
                  sx={{ width: '100%', mt: 0.5 }}
                  InputProps={{ sx: { fontSize: '0.75rem' } }}
                />
              )}
            </Paper>
          ))}
          <Box
            onClick={addField}
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
            <Typography variant="caption">Add field</Typography>
          </Box>

          {/* Generated schema preview */}
          {fields.length > 0 && (
            <Collapse in={Object.keys(generatedSchema).length > 0}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  backgroundColor: '#f5f7f9',
                  maxHeight: 100,
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'monospace', fontSize: '0.65rem', whiteSpace: 'pre' }}
                >
                  {JSON.stringify(generatedSchema, null, 2)}
                </Typography>
              </Paper>
            </Collapse>
          )}
        </Box>
      )}

      {/* UI Hint */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          size="small"
          value={uiHint?.layout || 'form'}
          onChange={(e) =>
            onUiHintChange({ ...(uiHint || {}), layout: e.target.value })
          }
          sx={{ minWidth: 120, fontSize: '0.8rem' }}
          displayEmpty
        >
          {UI_HINT_LAYOUTS.map((l) => (
            <MenuItem key={l.value} value={l.value} sx={{ fontSize: '0.8rem' }}>
              {l.label}
            </MenuItem>
          ))}
        </Select>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={uiHint?.require_reason || false}
              onChange={(e) =>
                onUiHintChange({ ...(uiHint || {}), require_reason: e.target.checked })
              }
            />
          }
          label={<Typography variant="caption">Require reason</Typography>}
          sx={{ mx: 0 }}
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={uiHint?.show_evidence_panel || false}
              onChange={(e) =>
                onUiHintChange({ ...(uiHint || {}), show_evidence_panel: e.target.checked })
              }
            />
          }
          label={<Typography variant="caption">Show evidence</Typography>}
          sx={{ mx: 0 }}
        />
      </Box>
    </Box>
  );
}
