import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { APPROVAL_TYPES, HITL_EXTRAS_TEMPLATES } from '../../../../constants/hitl-approval-types.js';
import HitlDynamicFields from '../../../tasks/create/HitlDynamicFields.component.jsx';

const labelSx = { color: '#9E9E9E', fontSize: '0.78rem', mb: 0.5, display: 'block' };
const inputSx = {
  '& .MuiInputBase-root': { backgroundColor: '#212121', color: '#E0E0E0' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
  '& .MuiInputLabel-root': { color: '#9E9E9E' },
  '& .MuiSelect-icon': { color: '#9E9E9E' },
};

const ColorDot = ({ color }) => (
  <span
    style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      backgroundColor: color || '#546e7a',
      marginRight: 8,
      flexShrink: 0,
    }}
  />
);

export default function FlowsHitlApprovalGateForm({ config = {}, onChange }) {
  const approvalTypeName = config.approval_type?.name || '';

  const setField = (field, value) => onChange({ ...config, [field]: value });

  const handleApprovalTypeChange = (name) => {
    if (!name) {
      onChange({ ...config, approval_type: null, hitl_config: {} });
      return;
    }
    const next = APPROVAL_TYPES.find((a) => a.name === name);
    const template = HITL_EXTRAS_TEMPLATES[name] || {};
    // Preserve hitl_config if user is re-selecting same subtype; otherwise seed with template.
    const nextConfig = config.approval_type?.name === name ? config.hitl_config || {} : template;
    onChange({ ...config, approval_type: next || null, hitl_config: nextConfig });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      <Box>
        <Typography sx={labelSx}>Approval Type *</Typography>
        <FormControl fullWidth size="small" sx={inputSx}>
          <Select
            value={approvalTypeName}
            onChange={(e) => handleApprovalTypeChange(e.target.value)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              <em>Select approval type</em>
            </MenuItem>
            {APPROVAL_TYPES.map((a) => (
              <MenuItem key={a.name} value={a.name}>
                <span className="d-flex align-items-center">
                  <ColorDot color={a.color} />
                  {a.title}
                </span>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box>
        <Typography sx={labelSx}>Title *</Typography>
        <TextField
          fullWidth
          size="small"
          value={config.title || ''}
          onChange={(e) => setField('title', e.target.value)}
          sx={inputSx}
          placeholder="Approve deletion of customer X?"
        />
      </Box>

      <Box>
        <Typography sx={labelSx}>Description</Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          size="small"
          value={config.description || ''}
          onChange={(e) => setField('description', e.target.value)}
          sx={inputSx}
          placeholder="Context shown to the approver inside the task detail."
        />
      </Box>

      <Box
        sx={{
          backgroundColor: '#212121',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          p: 2,
        }}
      >
        <Typography sx={{ ...labelSx, fontWeight: 600 }}>Subtype configuration</Typography>
        {approvalTypeName ? (
          <HitlDynamicFields
            approvalTypeName={approvalTypeName}
            extras={config.hitl_config || {}}
            onChange={(updated) => setField('hitl_config', updated)}
            disabled={false}
          />
        ) : (
          <Typography sx={{ color: '#9E9E9E', fontSize: '0.78rem', fontStyle: 'italic' }}>
            Select an approval type to configure subtype-specific fields.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
