import React, { useCallback } from 'react';
import { TextField, Switch } from '@mui/material';
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
  cursor: pointer;
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

function CognitiveResourceGovernanceTab({ resource = {}, onChange, ui = {} }) {
  const governance = resource.governance || {};

  const handleGovernanceChange = useCallback(
    (field, value) => {
      if (!onChange) {
        return;
      }

      onChange({
        ...resource,
        governance: {
          ...governance,
          [field]: value,
        },
      });
    },
    [resource, governance, onChange]
  );

  return (
    <TabContainer>
      <SectionCard>
        <SectionTitle>{ui?.ownershipTitle || 'Ownership'}</SectionTitle>
        <div className="row g-3">
          <div className="col-md-6">
            <TextField
              label={ui?.ownerUserLabel || 'Owner User ID'}
              value={governance.owner_user_id || ''}
              onChange={(e) => handleGovernanceChange('owner_user_id', e.target.value)}
              size="small"
              fullWidth
              placeholder="user-id"
            />
          </div>
          <div className="col-md-6">
            <TextField
              label={ui?.ownerTeamLabel || 'Owner Team ID'}
              value={governance.owner_team_id || ''}
              onChange={(e) => handleGovernanceChange('owner_team_id', e.target.value)}
              size="small"
              fullWidth
              placeholder="team-id"
            />
          </div>
          <div className="col-md-6">
            <TextField
              label={ui?.visibilityLabel || 'Visibility Scope'}
              value={governance.visibility_scope || ''}
              onChange={(e) => handleGovernanceChange('visibility_scope', e.target.value)}
              size="small"
              fullWidth
              placeholder="organization"
            />
          </div>
          <div className="col-md-6">
            <TextField
              label={ui?.reviewStatusLabel || 'Review Status'}
              value={governance.review_status || ''}
              onChange={(e) => handleGovernanceChange('review_status', e.target.value)}
              size="small"
              fullWidth
              placeholder="pending"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle>{ui?.authorityTitle || 'Authority'}</SectionTitle>
        <SwitchRow>
          <SwitchLabel>
            <SwitchTitle>{ui?.authoritativeLabel || 'Authoritative'}</SwitchTitle>
            <SwitchDescription>{ui?.authoritativeDescription || 'Mark this resource as the authoritative source for its topic'}</SwitchDescription>
          </SwitchLabel>
          <Switch
            checked={governance.is_authoritative || false}
            onChange={(e) => handleGovernanceChange('is_authoritative', e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#3A2E4F',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#3A2E4F',
              },
            }}
          />
        </SwitchRow>
      </SectionCard>

      <SectionCard>
        <SectionTitle>{ui?.validityTitle || 'Validity Period'}</SectionTitle>
        <div className="row g-3">
          <div className="col-md-4">
            <TextField
              label={ui?.effectiveFromLabel || 'Effective From'}
              type="date"
              value={governance.effective_from || ''}
              onChange={(e) => handleGovernanceChange('effective_from', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </div>
          <div className="col-md-4">
            <TextField
              label={ui?.effectiveToLabel || 'Effective To'}
              type="date"
              value={governance.effective_to || ''}
              onChange={(e) => handleGovernanceChange('effective_to', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </div>
          <div className="col-md-4">
            <TextField
              label={ui?.expiresAtLabel || 'Expires At'}
              type="date"
              value={governance.expires_at || ''}
              onChange={(e) => handleGovernanceChange('expires_at', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </div>
        </div>
      </SectionCard>
    </TabContainer>
  );
}

export default CognitiveResourceGovernanceTab;
