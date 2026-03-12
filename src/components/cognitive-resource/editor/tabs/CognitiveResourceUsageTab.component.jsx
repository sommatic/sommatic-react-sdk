import React, { useCallback } from 'react';
import { Chip, Switch } from '@mui/material';
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

const SwitchRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }
`;

const SwitchLabel = styled.section``;

const SwitchTitle = styled.span`
  display: block;
  font-size: 0.85rem;
  color: #1f2937;
  font-weight: 500;
`;

const SwitchDescription = styled.span`
  display: block;
  font-size: 0.7rem;
  color: #9ca3af;
  margin-top: 2px;
`;

const ChipGroup = styled.section`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const USAGE_MODES = [
  { key: 'retrieval', label: 'Retrieval' },
  { key: 'context', label: 'Context' },
  { key: 'instruction', label: 'Instruction' },
  { key: 'routing', label: 'Routing' },
  { key: 'validation', label: 'Validation' },
  { key: 'both', label: 'Both (Retrieval + Context)' },
];

function CognitiveResourceUsageTab({ resource = {}, onChange, ui = {} }) {
  const capabilities = resource.capabilities || {};
  const allowedModes = capabilities.allowed_usage_modes || [];

  const handleCapabilityChange = useCallback(
    (field, value) => {
      if (!onChange) {
        return;
      }

      onChange({
        ...resource,
        capabilities: {
          ...capabilities,
          [field]: value,
        },
      });
    },
    [resource, capabilities, onChange]
  );

  const handleModeToggle = useCallback(
    (mode) => {
      const currentModes = [...allowedModes];
      const index = currentModes.indexOf(mode);

      if (index >= 0) {
        currentModes.splice(index, 1);
      } else {
        currentModes.push(mode);
      }

      handleCapabilityChange('allowed_usage_modes', currentModes);
    },
    [allowedModes, handleCapabilityChange]
  );

  return (
    <TabContainer>
      <SectionCard>
        <SectionTitle>{ui?.usageModesTitle || 'Allowed Usage Modes'}</SectionTitle>
        <ChipGroup>
          {USAGE_MODES.map((mode) => {
            const isActive = allowedModes.includes(mode.key);
            return (
              <Chip
                key={mode.key}
                label={ui?.[`${mode.key}ModeLabel`] || mode.label}
                variant={isActive ? 'filled' : 'outlined'}
                onClick={() => handleModeToggle(mode.key)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  backgroundColor: isActive ? '#3A2E4F' : 'transparent',
                  color: isActive ? '#ffffff' : '#4B5563',
                  borderColor: '#d1d5db',
                  '&:hover': {
                    backgroundColor: isActive ? '#2D243E' : '#f3f4f6',
                  },
                }}
              />
            );
          })}
        </ChipGroup>
      </SectionCard>

      <SectionCard>
        <SectionTitle>{ui?.flagsTitle || 'Capability Flags'}</SectionTitle>

        <SwitchRow>
          <SwitchLabel>
            <SwitchTitle>{ui?.searchableLabel || 'Searchable'}</SwitchTitle>
            <SwitchDescription>{ui?.searchableDescription || 'Include this resource in search and discovery results'}</SwitchDescription>
          </SwitchLabel>
          <Switch
            checked={capabilities.is_searchable || false}
            onChange={(e) => handleCapabilityChange('is_searchable', e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#3A2E4F' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3A2E4F' },
            }}
          />
        </SwitchRow>

        <SwitchRow>
          <SwitchLabel>
            <SwitchTitle>{ui?.bindableLabel || 'Bindable'}</SwitchTitle>
            <SwitchDescription>{ui?.bindableDescription || 'Allow this resource to be bound to workflows, agents, and other targets'}</SwitchDescription>
          </SwitchLabel>
          <Switch
            checked={capabilities.is_bindable || false}
            onChange={(e) => handleCapabilityChange('is_bindable', e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#3A2E4F' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3A2E4F' },
            }}
          />
        </SwitchRow>

        <SwitchRow>
          <SwitchLabel>
            <SwitchTitle>{ui?.executableRefLabel || 'Executable Reference'}</SwitchTitle>
            <SwitchDescription>{ui?.executableRefDescription || 'This resource can be used as an executable reference in workflows'}</SwitchDescription>
          </SwitchLabel>
          <Switch
            checked={capabilities.is_executable_reference || false}
            onChange={(e) => handleCapabilityChange('is_executable_reference', e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#3A2E4F' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3A2E4F' },
            }}
          />
        </SwitchRow>

        <SwitchRow>
          <SwitchLabel>
            <SwitchTitle>{ui?.versionLockedLabel || 'Version Locked'}</SwitchTitle>
            <SwitchDescription>{ui?.versionLockedDescription || 'Prevent updates to this resource version once published'}</SwitchDescription>
          </SwitchLabel>
          <Switch
            checked={capabilities.is_version_locked || false}
            onChange={(e) => handleCapabilityChange('is_version_locked', e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#3A2E4F' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3A2E4F' },
            }}
          />
        </SwitchRow>
      </SectionCard>
    </TabContainer>
  );
}

export default CognitiveResourceUsageTab;
