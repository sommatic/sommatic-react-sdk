import React, { useCallback } from 'react';
import { TextField, Chip, Autocomplete } from '@mui/material';
import styled from 'styled-components';
import ProjectPicker from '../../../shared/project-picker/ProjectPicker.component.jsx';

import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';

const TYPE_ICON_MAP = {
  text: DescriptionOutlinedIcon,
  manual: MenuBookOutlinedIcon,
  policy: PolicyOutlinedIcon,
  list: FormatListBulletedOutlinedIcon,
  taxonomy: AccountTreeOutlinedIcon,
  document: InsertDriveFileOutlinedIcon,
  dataset: StorageOutlinedIcon,
  reference: LinkOutlinedIcon,
  prompt: LabelOutlinedIcon,
};

const RESOURCE_TYPES = [
  { id: 1, name: 'text', title: 'Text' },
  { id: 4, name: 'taxonomy', title: 'Taxonomy' },
  { id: 2, name: 'document', title: 'Document' },
  { id: 3, name: 'list', title: 'List' },
  { id: 5, name: 'prompt', title: 'Prompt' },
  { id: 6, name: 'policy', title: 'Policy' },
  { id: 7, name: 'manual', title: 'Manual' },
  { id: 8, name: 'dataset', title: 'Dataset' },
  { id: 9, name: 'reference', title: 'Reference' },
];

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

  const handleProjectChange = useCallback(
    (projectId, project) => {
      if (!onChange) return;
      const nextContext = { ...(resource.context || {}) };
      if (!projectId || !project) {
        if (nextContext.project) delete nextContext.project;
      } else {
        nextContext.project = {
          id: project.id,
          name: project.name || null,
          slug: project.slug || null,
          ...(project.ui?.emoji ? { ui: { emoji: project.ui.emoji } } : {}),
        };
      }
      onChange({ ...resource, project_id: projectId || '', context: nextContext });
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
            <ProjectPicker
              organizationId={resource.organization_id}
              value={resource.project_id}
              valueSnapshot={resource.context?.project}
              onChange={handleProjectChange}
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
            <Autocomplete
              options={RESOURCE_TYPES}
              getOptionLabel={(option) => option.title || ''}
              value={RESOURCE_TYPES.find((t) => t.name === (resource.resource_type?.name || resource.resource_type)) || null}
              onChange={(_, newValue) => {
                if (newValue) {
                  handleFieldChange('resource_type', newValue);
                }
              }}
              isOptionEqualToValue={(option, value) => option.name === value?.name}
              disableClearable
              size="small"
              renderOption={(props, option) => {
                const Icon = TYPE_ICON_MAP[option.name] || LabelOutlinedIcon;
                return (
                  <li {...props} key={option.name} style={{ ...props.style, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon sx={{ fontSize: 16, color: '#6B7280' }} />
                    {option.title}
                  </li>
                );
              }}
              renderInput={(params) => {
                const selectedType = RESOURCE_TYPES.find((t) => t.name === (resource.resource_type?.name || resource.resource_type));
                const Icon = selectedType ? (TYPE_ICON_MAP[selectedType.name] || LabelOutlinedIcon) : null;
                return (
                  <TextField
                    {...params}
                    label={ui?.typeLabel || 'Resource Type'}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: Icon ? <Icon sx={{ fontSize: 16, color: '#6B7280', mr: 0.5 }} /> : null,
                      },
                    }}
                  />
                );
              }}
            />
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
