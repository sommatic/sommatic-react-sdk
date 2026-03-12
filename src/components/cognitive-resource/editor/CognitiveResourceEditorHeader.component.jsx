import React from 'react';
import { Button, Chip, CircularProgress } from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styled from 'styled-components';

import KnowledgeResourceTypeBadge from '../KnowledgeResourceTypeBadge.component.jsx';
import KnowledgeResourceStatusBadge from '../KnowledgeResourceStatusBadge.component.jsx';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  min-height: 56px;
`;

const HeaderLeft = styled.section`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
`;

const HeaderRight = styled.section`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const ResourceName = styled.h5`
  margin: 0;
  font-weight: 600;
  font-size: 1rem;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

function CognitiveResourceEditorHeader({
  resource = {},
  isDirty = false,
  isSaving = false,
  onSave,
  onPublish,
  onBack,
  ui = {},
}) {
  if (!resource) {
    return null;
  }

  const resourceName = resource.name || ui?.defaultName || 'Untitled Resource';

  return (
    <HeaderContainer>
      <HeaderLeft>
        {onBack && (
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
            onClick={onBack}
            size="small"
            sx={{
              color: '#6B7280',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.85rem',
              minWidth: 'auto',
            }}
          >
            {ui?.backLabel || 'Back'}
          </Button>
        )}

        <ResourceName>{resourceName}</ResourceName>

        <KnowledgeResourceTypeBadge type={resource.resource_type} ui={ui} />
        <KnowledgeResourceStatusBadge status={resource.status} ui={ui} />

        {isDirty && (
          <Chip
            label={ui?.unsavedLabel || 'Unsaved changes'}
            size="small"
            sx={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontWeight: 500,
              fontSize: '0.7rem',
              height: 22,
            }}
          />
        )}
      </HeaderLeft>

      <HeaderRight>
        {onSave && (
          <Button
            variant="outlined"
            size="small"
            startIcon={isSaving ? <CircularProgress size={14} /> : <SaveOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={onSave}
            disabled={isSaving || !isDirty}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.85rem',
              borderColor: '#3A2E4F',
              color: '#3A2E4F',
              '&:hover': {
                borderColor: '#2D243E',
                backgroundColor: 'rgba(58, 46, 79, 0.04)',
              },
            }}
          >
            {isSaving ? (ui?.savingLabel || 'Saving...') : (ui?.saveLabel || 'Save')}
          </Button>
        )}

        {onPublish && (
          <Button
            variant="contained"
            size="small"
            startIcon={<PublishOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={onPublish}
            disabled={isSaving}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.85rem',
              backgroundColor: '#3A2E4F',
              '&:hover': {
                backgroundColor: '#2D243E',
              },
            }}
          >
            {ui?.publishLabel || 'Publish'}
          </Button>
        )}
      </HeaderRight>
    </HeaderContainer>
  );
}

export default CognitiveResourceEditorHeader;
