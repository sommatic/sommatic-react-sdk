import React, { useCallback } from 'react';
import { TextField, Chip } from '@mui/material';
import styled from 'styled-components';

import KnowledgeResourceTypeBadge from '../../KnowledgeResourceTypeBadge.component.jsx';

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

const ReadOnlyField = styled.section`
  margin-bottom: 12px;
`;

const FieldLabel = styled.span`
  display: block;
  font-size: 0.7rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 4px;
  font-weight: 600;
`;

const TagInput = styled.section`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-height: 40px;
`;

function CognitiveResourceOverviewTab({ resource = {}, onChange, ui = {} }) {
  const handleFieldChange = useCallback(
    (field, value) => {
      if (!onChange) {
        return;
      }

      onChange({ ...resource, [field]: value });
    },
    [resource, onChange]
  );

  const handleTagRemove = useCallback(
    (tagToRemove) => {
      const nextTags = (resource.tags || []).filter((tag) => tag !== tagToRemove);
      handleFieldChange('tags', nextTags);
    },
    [resource.tags, handleFieldChange]
  );

  const handleTagKeyDown = useCallback(
    (event) => {
      if (event.key !== 'Enter') {
        return;
      }

      const value = event.target.value.trim();
      if (!value) {
        return;
      }

      const currentTags = resource.tags || [];
      if (currentTags.includes(value)) {
        return;
      }

      handleFieldChange('tags', [...currentTags, value]);
      event.target.value = '';
    },
    [resource.tags, handleFieldChange]
  );

  return (
    <TabContainer>
      <SectionCard>
        <SectionTitle>{ui?.identityTitle || 'Identity'}</SectionTitle>
        <div className="row g-3">
          <div className="col-md-6">
            <TextField
              label={ui?.nameLabel || 'Name'}
              value={resource.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              size="small"
              fullWidth
            />
          </div>
          <div className="col-md-6">
            <TextField
              label={ui?.slugLabel || 'Slug'}
              value={resource.slug || ''}
              onChange={(e) => handleFieldChange('slug', e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
              }}
            />
          </div>
          <div className="col-12">
            <TextField
              label={ui?.descriptionLabel || 'Description'}
              value={resource.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              size="small"
              fullWidth
              multiline
              rows={3}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle>{ui?.classificationTitle || 'Classification'}</SectionTitle>
        <div className="row g-3">
          <div className="col-md-4">
            <ReadOnlyField>
              <FieldLabel>{ui?.typeLabel || 'Type'}</FieldLabel>
              <KnowledgeResourceTypeBadge type={resource.resource_type} ui={ui} />
            </ReadOnlyField>
          </div>
          <div className="col-md-4">
            <TextField
              label={ui?.versionLabel || 'Version'}
              value={resource.version || ''}
              onChange={(e) => handleFieldChange('version', e.target.value)}
              size="small"
              fullWidth
            />
          </div>
          <div className="col-md-4">
            <TextField
              label={ui?.languageLabel || 'Language'}
              value={resource.language || ''}
              onChange={(e) => handleFieldChange('language', e.target.value)}
              size="small"
              fullWidth
              placeholder="en"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle>{ui?.tagsTitle || 'Tags'}</SectionTitle>
        <TagInput>
          {(resource.tags || []).map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onDelete={() => handleTagRemove(tag)}
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
          <input
            type="text"
            placeholder={ui?.addTagPlaceholder || 'Type a tag and press Enter'}
            onKeyDown={handleTagKeyDown}
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              minWidth: 120,
              fontSize: '0.8rem',
              background: 'transparent',
            }}
          />
        </TagInput>
      </SectionCard>
    </TabContainer>
  );
}

export default CognitiveResourceOverviewTab;
