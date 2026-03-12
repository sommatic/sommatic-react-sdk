import React from 'react';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import styled from 'styled-components';

const PanelContainer = styled.section`
  background: #f9fafb;
  border-left: 1px solid #e5e7eb;
  padding: 16px;
  margin-top: 12px;
`;

const PanelTitle = styled.h6`
  font-weight: 600;
  font-size: 0.8rem;
  color: #374151;
  margin: 0 0 12px 0;
`;

const ValidationItem = styled.article`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 0.75rem;
  line-height: 1.4;
  background: ${(props) => {
    if (props.$severity === 'error') return '#FEF2F2';
    if (props.$severity === 'warning') return '#FFFBEB';
    return '#F0FDF4';
  }};
  color: ${(props) => {
    if (props.$severity === 'error') return '#991B1B';
    if (props.$severity === 'warning') return '#92400E';
    return '#166534';
  }};
`;

const AllClearCard = styled.article`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: #F0FDF4;
  color: #166534;
  font-size: 0.8rem;
  font-weight: 500;
`;

const SEVERITY_ICONS = {
  error: ErrorOutlineIcon,
  warning: WarningAmberOutlinedIcon,
  info: CheckCircleOutlineIcon,
};

function computeValidations(resource, bindings) {
  const warnings = [];

  if (!resource.name) {
    warnings.push({ severity: 'error', message: 'Resource name is required' });
  }

  if (!resource.resource_type) {
    warnings.push({ severity: 'error', message: 'Resource type must be selected' });
  }

  if (!resource.description) {
    warnings.push({ severity: 'warning', message: 'Description is recommended for discoverability' });
  }

  const content = resource.content || {};
  const resourceType = resource.resource_type || '';

  if (['text', 'manual', 'policy'].includes(resourceType) && !content.text) {
    warnings.push({ severity: 'warning', message: 'Content body is empty' });
  }

  if (['list'].includes(resourceType)) {
    const items = content.structured_data?.items || [];
    if (items.length === 0) {
      warnings.push({ severity: 'warning', message: 'No list items defined' });
    }
  }

  if (['taxonomy'].includes(resourceType)) {
    const categories = content.structured_data?.categories || [];
    if (categories.length === 0) {
      warnings.push({ severity: 'warning', message: 'No taxonomy categories defined' });
    }
  }

  if (['document'].includes(resourceType) && !content.file_ref?.file_name) {
    warnings.push({ severity: 'warning', message: 'No file attached' });
  }

  if (!resource.governance?.owner_user_id && !resource.governance?.owner_team_id) {
    warnings.push({ severity: 'warning', message: 'No owner assigned' });
  }

  if (Array.isArray(bindings) && bindings.length === 0) {
    warnings.push({ severity: 'info', message: 'No bindings configured — resource is standalone' });
  }

  return warnings;
}

function CognitiveResourceValidationPanel({ resource = {}, bindings = [], ui = {} }) {
  const validations = computeValidations(resource, bindings);

  return (
    <PanelContainer>
      <PanelTitle>{ui?.validationTitle || 'Validation'}</PanelTitle>

      {validations.length === 0 ? (
        <AllClearCard>
          <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
          {ui?.allClearLabel || 'All checks passed'}
        </AllClearCard>
      ) : (
        validations.map((item, index) => {
          const Icon = SEVERITY_ICONS[item.severity] || WarningAmberOutlinedIcon;
          return (
            <ValidationItem key={index} $severity={item.severity}>
              <Icon sx={{ fontSize: 16, flexShrink: 0, marginTop: '1px' }} />
              <span>{item.message}</span>
            </ValidationItem>
          );
        })
      )}
    </PanelContainer>
  );
}

export default CognitiveResourceValidationPanel;
