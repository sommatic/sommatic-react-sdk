import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';

// ─── Helper: text input that becomes expression-aware when consumer injects ExpressionField ─

function TextOrExpressionField({
  value,
  onChange,
  label,
  placeholder,
  multiline,
  minRows,
  maxRows,
  disabled,
  fieldKey,
  ExpressionField,
  sx,
}) {
  if (ExpressionField) {
    return (
      <Box sx={sx}>
        <Typography
          sx={{
            fontSize: '0.7rem',
            color: '#6B7280',
            mb: 0.4,
            display: 'block',
          }}
        >
          {label}
        </Typography>
        <ExpressionField
          value={value || ''}
          onChange={(v) => onChange(v)}
          placeholder={placeholder}
          readOnly={disabled}
          fieldKey={fieldKey}
          label={label}
          compact
          multiline={multiline}
          minRows={minRows}
          maxRows={maxRows}
        />
      </Box>
    );
  }
  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      multiline={multiline}
      minRows={minRows}
      maxRows={maxRows}
      disabled={disabled}
      sx={sx}
    />
  );
}

// ─── Sub-panels ──────────────────────────────────────────────────────────────

function ToolApprovalFields({ extras, onChange, disabled, ExpressionField }) {
  const tool = extras?.tool || {};

  const setToolField = (field, value) => {
    onChange({ ...extras, tool: { ...tool, [field]: value } });
  };

  const handleArgsChange = (value) => {
    try {
      const parsed = JSON.parse(value);
      setToolField('args', parsed);
    } catch {
      // keep raw string until valid JSON
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextOrExpressionField
        label="Tool name"
        value={tool.name || ''}
        onChange={(v) => setToolField('name', v)}
        placeholder="send_email"
        disabled={disabled}
        fieldKey="tool.name"
        ExpressionField={ExpressionField}
      />
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel>Risk level</InputLabel>
        <Select
          label="Risk level"
          value={tool.risk_level || 'medium'}
          onChange={(e) => setToolField('risk_level', e.target.value)}
        >
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
        </Select>
      </FormControl>
      <TextField
        fullWidth
        multiline
        minRows={3}
        maxRows={6}
        size="small"
        label="Tool args (JSON)"
        value={typeof tool.args === 'string' ? tool.args : JSON.stringify(tool.args || {}, null, 2)}
        onChange={(e) => handleArgsChange(e.target.value)}
        disabled={disabled}
        helperText={
          ExpressionField
            ? 'Inner string values support expressions and are resolved at runtime.'
            : undefined
        }
        sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
      />
    </Box>
  );
}

function PlanReviewFields({ extras, onChange, disabled, ExpressionField }) {
  const steps = extras?.plan?.steps || [];

  const setSteps = (newSteps) => {
    onChange({ ...extras, plan: { ...(extras?.plan || {}), steps: newSteps } });
  };

  const updateStep = (index, field, value) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const addStep = () => {
    const nextId = `step-${steps.length + 1}`;
    setSteps([...steps, { id: nextId, title: '', detail: '' }]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: '#6B7280' }}>
          Plan steps
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={addStep}
          disabled={disabled}
          sx={{ textTransform: 'none', fontSize: '0.78rem' }}
        >
          Add step
        </Button>
      </Box>
      {steps.map((step, index) => (
        <Box
          key={step.id || index}
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'flex-start',
            p: 1.5,
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            backgroundColor: '#F9FAFB',
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#3A2E4F', mt: 1 }}>
            {index + 1}
          </Typography>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextOrExpressionField
              label="Title"
              value={step.title || ''}
              onChange={(v) => updateStep(index, 'title', v)}
              disabled={disabled}
              fieldKey={`plan.steps.${index}.title`}
              ExpressionField={ExpressionField}
            />
            <TextOrExpressionField
              label="Detail"
              value={step.detail || ''}
              onChange={(v) => updateStep(index, 'detail', v)}
              multiline
              minRows={2}
              maxRows={5}
              disabled={disabled}
              fieldKey={`plan.steps.${index}.detail`}
              ExpressionField={ExpressionField}
            />
          </Box>
          <IconButton size="small" onClick={() => removeStep(index)} disabled={disabled}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      {steps.length === 0 && (
        <Typography sx={{ fontSize: '0.78rem', color: '#9CA3AF', fontStyle: 'italic' }}>
          No steps defined yet.
        </Typography>
      )}
    </Box>
  );
}

function OptionsListFields({ extras, onChange, disabled, label = 'Options', ExpressionField }) {
  const options = extras?.options || [];

  const setOptions = (newOptions) => {
    onChange({ ...extras, options: newOptions });
  };

  const updateOption = (index, field, value) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  };

  const addOption = () => {
    const nextId = `opt-${options.length + 1}`;
    setOptions([...options, { id: nextId, name: '', title: '' }]);
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: '#6B7280' }}>
          {label}
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={addOption}
          disabled={disabled}
          sx={{ textTransform: 'none', fontSize: '0.78rem' }}
        >
          Add option
        </Button>
      </Box>
      {options.map((option, index) => (
        <Box
          key={option.id || index}
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            p: 1,
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            backgroundColor: '#F9FAFB',
          }}
        >
          <TextField
            size="small"
            label="ID"
            value={option.id || ''}
            onChange={(e) => updateOption(index, 'id', e.target.value)}
            disabled={disabled}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label="Name"
            value={option.name || ''}
            onChange={(e) => updateOption(index, 'name', e.target.value)}
            disabled={disabled}
            sx={{ flex: 1 }}
          />
          <TextOrExpressionField
            label="Title"
            value={option.title || ''}
            onChange={(v) => updateOption(index, 'title', v)}
            disabled={disabled}
            fieldKey={`options.${index}.title`}
            ExpressionField={ExpressionField}
            sx={{ flex: 1 }}
          />
          <IconButton size="small" onClick={() => removeOption(index)} disabled={disabled}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      {options.length === 0 && (
        <Typography sx={{ fontSize: '0.78rem', color: '#9CA3AF', fontStyle: 'italic' }}>
          No options defined yet.
        </Typography>
      )}
    </Box>
  );
}

function MultiSelectDecisionFields({ extras, onChange, disabled, ExpressionField }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <OptionsListFields
        extras={extras}
        onChange={onChange}
        disabled={disabled}
        ExpressionField={ExpressionField}
      />
      <TextField
        size="small"
        type="number"
        label="Minimum selections"
        value={extras?.min_selection ?? 1}
        onChange={(e) => onChange({ ...extras, min_selection: parseInt(e.target.value, 10) || 1 })}
        disabled={disabled}
        inputProps={{ min: 1 }}
        sx={{ maxWidth: 200 }}
      />
    </Box>
  );
}

function ReviewEditRejectFields({ extras, onChange, disabled, ExpressionField }) {
  const content = extras?.content || {};

  const setContentField = (field, value) => {
    onChange({ ...extras, content: { ...content, [field]: value } });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextOrExpressionField
        label="Content text"
        value={content.text || ''}
        onChange={(v) => setContentField('text', v)}
        multiline
        minRows={4}
        maxRows={8}
        disabled={disabled}
        fieldKey="content.text"
        ExpressionField={ExpressionField}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={content.editable !== false}
            onChange={(e) => setContentField('editable', e.target.checked)}
            disabled={disabled}
          />
        }
        label="Allow editing"
        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.82rem' } }}
      />
    </Box>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function HitlDynamicFields({
  approvalTypeName,
  extras,
  onChange,
  disabled,
  ExpressionField,
}) {
  if (!approvalTypeName || approvalTypeName === 'binary_approval') {
    return null;
  }

  const commonProps = { extras, onChange, disabled, ExpressionField };

  if (approvalTypeName === 'tool_approval') {
    return <ToolApprovalFields {...commonProps} />;
  }

  if (approvalTypeName === 'plan_review') {
    return <PlanReviewFields {...commonProps} />;
  }

  if (approvalTypeName === 'single_select_decision') {
    return <OptionsListFields {...commonProps} />;
  }

  if (approvalTypeName === 'multi_select_decision') {
    return <MultiSelectDecisionFields {...commonProps} />;
  }

  if (approvalTypeName === 'review_edit_reject') {
    return <ReviewEditRejectFields {...commonProps} />;
  }

  return null;
}
