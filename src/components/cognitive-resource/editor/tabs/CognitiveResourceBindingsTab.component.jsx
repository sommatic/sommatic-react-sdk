import React, { useState, useCallback } from 'react';
import { TextField, Button, IconButton, Chip, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import styled from 'styled-components';

const TabContainer = styled.section`
  padding: 24px 0;
`;

const SectionCard = styled.article`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h6`
  font-weight: 600;
  font-size: 0.85rem;
  color: #374151;
  margin: 0 0 16px 0;
`;

const BindingRow = styled.article`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const EmptyState = styled.section`
  text-align: center;
  padding: 32px 20px;
  color: #9ca3af;
  font-size: 0.85rem;
`;

const TARGET_TYPES = [
  'project',
  'workflow',
  'workflow-node',
  'agent-profile',
  'app',
  'conversation',
  'report',
  'anomaly',
];

const ROLES = [
  'knowledge',
  'policy',
  'instructions',
  'dataset',
  'template',
  'reference',
];

const MODES = [
  'retrieval',
  'context',
  'both',
  'instruction',
  'routing',
  'validation',
];

const EMPTY_BINDING = {
  target_type: '',
  target_id: '',
  role: '',
  mode: '',
};

function CognitiveResourceBindingsTab({
  resource = {},
  bindings = [],
  onAddBinding,
  onRemoveBinding,
  ui = {},
}) {
  const [newBinding, setNewBinding] = useState({ ...EMPTY_BINDING });
  const [isAdding, setIsAdding] = useState(false);

  const handleNewBindingChange = useCallback((field, value) => {
    setNewBinding((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAdd = useCallback(() => {
    if (!newBinding.target_type || !newBinding.target_id) {
      return;
    }

    if (onAddBinding) {
      onAddBinding({
        ...newBinding,
        resource_id: resource.id,
        status: 'active',
      });
    }

    setNewBinding({ ...EMPTY_BINDING });
    setIsAdding(false);
  }, [newBinding, resource.id, onAddBinding]);

  const handleCancel = useCallback(() => {
    setNewBinding({ ...EMPTY_BINDING });
    setIsAdding(false);
  }, []);

  return (
    <TabContainer>
      <SectionCard>
        <header className="d-flex justify-content-between align-items-center mb-3">
          <SectionTitle className="mb-0">{ui?.bindingsTitle || 'Resource Bindings'}</SectionTitle>
          {!isAdding && (
            <Button
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={() => setIsAdding(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.8rem',
                color: '#3A2E4F',
              }}
            >
              {ui?.addBindingLabel || 'Add Binding'}
            </Button>
          )}
        </header>

        {isAdding && (
          <BindingRow>
            <section className="flex-grow-1">
              <div className="row g-2">
                <div className="col-md-3">
                  <TextField
                    select
                    label={ui?.targetTypeLabel || 'Target Type'}
                    value={newBinding.target_type}
                    onChange={(e) => handleNewBindingChange('target_type', e.target.value)}
                    size="small"
                    fullWidth
                  >
                    {TARGET_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
                <div className="col-md-3">
                  <TextField
                    label={ui?.targetIdLabel || 'Target ID'}
                    value={newBinding.target_id}
                    onChange={(e) => handleNewBindingChange('target_id', e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="entity-id"
                  />
                </div>
                <div className="col-md-3">
                  <TextField
                    select
                    label={ui?.roleLabel || 'Role'}
                    value={newBinding.role}
                    onChange={(e) => handleNewBindingChange('role', e.target.value)}
                    size="small"
                    fullWidth
                  >
                    {ROLES.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
                <div className="col-md-3">
                  <TextField
                    select
                    label={ui?.modeLabel || 'Mode'}
                    value={newBinding.mode}
                    onChange={(e) => handleNewBindingChange('mode', e.target.value)}
                    size="small"
                    fullWidth
                  >
                    {MODES.map((mode) => (
                      <MenuItem key={mode} value={mode}>
                        {mode}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
              </div>
            </section>
            <section className="d-flex gap-1 align-items-center pt-1">
              <Button
                size="small"
                variant="contained"
                onClick={handleAdd}
                disabled={!newBinding.target_type || !newBinding.target_id}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  backgroundColor: '#3A2E4F',
                  '&:hover': { backgroundColor: '#2D243E' },
                }}
              >
                Add
              </Button>
              <Button
                size="small"
                onClick={handleCancel}
                sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#6B7280' }}
              >
                Cancel
              </Button>
            </section>
          </BindingRow>
        )}

        {bindings.length === 0 && !isAdding ? (
          <EmptyState>
            {ui?.noBindingsMessage || 'No bindings configured. Add bindings to link this resource to workflows, agents, or other targets.'}
          </EmptyState>
        ) : (
          bindings.map((binding, index) => (
            <BindingRow key={binding.id || index}>
              <section className="flex-grow-1">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <Chip
                    label={binding.target_type || 'unknown'}
                    size="small"
                    sx={{ fontSize: '0.7rem', backgroundColor: '#F3F4F6', fontWeight: 500 }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#1f2937', fontFamily: 'monospace' }}>
                    {binding.target_id || '—'}
                  </span>
                  {binding.role && (
                    <Chip
                      label={binding.role}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  )}
                  {binding.mode && (
                    <Chip
                      label={binding.mode}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  )}
                  {binding.status && (
                    <Chip
                      label={binding.status}
                      size="small"
                      sx={{
                        fontSize: '0.65rem',
                        height: 20,
                        backgroundColor: binding.status === 'active' ? '#F0FDF4' : '#F3F4F6',
                        color: binding.status === 'active' ? '#166534' : '#6B7280',
                      }}
                    />
                  )}
                </div>
              </section>
              <IconButton
                size="small"
                onClick={() => onRemoveBinding && onRemoveBinding(binding, index)}
                title="Remove binding"
              >
                <DeleteOutlineIcon sx={{ fontSize: 16, color: '#FB7185' }} />
              </IconButton>
            </BindingRow>
          ))
        )}
      </SectionCard>
    </TabContainer>
  );
}

export default CognitiveResourceBindingsTab;
