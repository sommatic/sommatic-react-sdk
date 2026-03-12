import React, { useState, useCallback } from 'react';
import { TextField, MenuItem, Chip, InputAdornment } from '@mui/material';
import {
  Link as LinkIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import styled from 'styled-components';
import { Container } from '@link-loom/react-sdk';

const HeaderArticle = styled.article`
  border-left: 5px solid #3a2e4f;
`;

const TagInput = styled.section`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 8px;
  border: 1px solid rgba(0, 0, 0, 0.23);
  border-radius: 4px;
  min-height: 40px;
  background: #ffffff;
`;

const RESOURCE_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'manual', label: 'Manual' },
  { value: 'policy', label: 'Policy' },
  { value: 'list', label: 'List' },
  { value: 'taxonomy', label: 'Taxonomy' },
  { value: 'document', label: 'Document' },
  { value: 'reference', label: 'Reference' },
  { value: 'dataset', label: 'Dataset' },
];

const CREATION_PATHS = [
  { value: 'blank', label: 'Blank' },
  { value: 'from-text', label: 'From text' },
  { value: 'from-file', label: 'From file' },
  { value: 'from-structured', label: 'From structured data' },
];

const FORMAT_DEFAULTS = {
  text: 'markdown',
  manual: 'markdown',
  policy: 'markdown',
  list: 'json',
  taxonomy: 'json',
  document: 'file-reference',
  reference: 'json',
  dataset: 'json',
};

const INITIAL_FORM = {
  name: '',
  slug: '',
  organization_id: '',
  description: '',
  resource_type: '',
  creation_path: 'blank',
  tags: [],
};

function CognitiveResourceQuickCreate({
  ui = {},
  apiKey = '',
  environment = 'production',
  onEvent,
  entitySelected = null,
  isPopupContext = false,
  setIsOpen,
}) {
  const [formData, setFormData] = useState(() => {
    if (entitySelected) {
      return {
        name: entitySelected.name || '',
        slug: entitySelected.slug || '',
        organization_id: entitySelected.organization_id || ui?.defaultOrganizationId || '',
        description: entitySelected.description || '',
        resource_type: entitySelected.resource_type || '',
        creation_path: 'blank',
        tags: entitySelected.tags || [],
      };
    }
    return { ...INITIAL_FORM, organization_id: ui?.defaultOrganizationId || '' };
  });

  const [isSaving, setIsSaving] = useState(false);

  const emitEvent = useCallback(
    (action, payload = {}, error = null) => {
      if (!onEvent) {
        return;
      }
      onEvent({ action, namespace: 'sommatic', payload, error });
    },
    [onEvent]
  );

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSlugGenerate = useCallback(() => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    handleChange('slug', slug);
  }, [formData.name, handleChange]);

  const handleNameChange = useCallback(
    (value) => {
      handleChange('name', value);
    },
    [handleChange]
  );

  const handleTagKeyDown = useCallback(
    (event) => {
      if (event.key !== 'Enter') {
        return;
      }
      event.preventDefault();

      const value = event.target.value.trim();
      if (!value || formData.tags.includes(value)) {
        return;
      }

      handleChange('tags', [...formData.tags, value]);
      event.target.value = '';
    },
    [formData.tags, handleChange]
  );

  const handleTagRemove = useCallback(
    (tag) => {
      handleChange(
        'tags',
        formData.tags.filter((t) => t !== tag)
      );
    },
    [formData.tags, handleChange]
  );

  const buildPayload = useCallback(() => {
    const format = FORMAT_DEFAULTS[formData.resource_type] || 'markdown';
    const content = { format };

    if (['text', 'manual', 'policy'].includes(formData.resource_type)) {
      content.text = '';
    } else if (['list'].includes(formData.resource_type)) {
      content.structured_data = { items: [] };
    } else if (['taxonomy'].includes(formData.resource_type)) {
      content.structured_data = { categories: [] };
    } else if (['document'].includes(formData.resource_type)) {
      content.file_ref = {};
    } else if (['reference'].includes(formData.resource_type)) {
      content.url = '';
      content.structured_data = {};
    } else if (['dataset'].includes(formData.resource_type)) {
      content.structured_data = {};
    }

    return {
      name: formData.name,
      slug: formData.slug,
      organization_id: formData.organization_id,
      description: formData.description,
      resource_type: formData.resource_type,
      tags: formData.tags,
      status: 'draft',
      content,
      governance: {},
      capabilities: {
        allowed_usage_modes: [],
        is_searchable: true,
        is_bindable: true,
        is_executable_reference: false,
        is_version_locked: false,
      },
    };
  }, [formData]);

  const handleSubmit = useCallback(
    (event, openEditor = false) => {
      event.preventDefault();

      if (!formData.name || !formData.resource_type) {
        return;
      }

      setIsSaving(true);
      const payload = buildPayload();
      emitEvent('cognitive-resource::created', { resource: payload, openEditor });
    },
    [formData, buildPayload, emitEvent]
  );

  const handleCancel = useCallback(() => {
    if (setIsOpen) {
      setIsOpen(false);
    }
    emitEvent('cognitive-resource::create-cancelled');
  }, [setIsOpen, emitEvent]);

  return (
    <section>
      <Container $isPopup={isPopupContext}>
        <div className="card mb-0">
          <form className="gap-3" onSubmit={(e) => handleSubmit(e, false)}>
        {/* Header: white background, border-left accent, Name field */}
        <header className="d-flex">
          <HeaderArticle className="col-12 ps-3 pe-4 pt-2">
            <h4 className="text-uppercase fw-bold mb-0">
              {entitySelected
                ? ui?.editTitle || 'Edit Knowledge Resource'
                : ui?.createTitle || 'Create Knowledge Resource'}
            </h4>
            <p className="text-muted mb-3">
              {ui?.createSubtitle || 'Define a new knowledge resource for your cognitive infrastructure'}
            </p>

            <section className="mb-3">
              <TextField
                fullWidth
                autoFocus
                size="small"
                label="Name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => !formData.slug && formData.name && handleSlugGenerate()}
                required
              />
            </section>
          </HeaderArticle>
        </header>

        {/* Gray section: Organization ID, Slug, Resource Type, Creation Path */}
        <section className="d-flex justify-content-between bg-light pt-3 px-4 flex-wrap gap-3">
          <section className="col-12 g-3">
            <div className="row">
              <article className="col-12 col-md-3 mb-2">
                <TextField
                  fullWidth
                  size="small"
                  label="Organization ID"
                  value={formData.organization_id}
                  onChange={(e) => handleChange('organization_id', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon className="text-muted" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </article>
              <article className="col-12 col-md-3 mb-2">
                <TextField
                  fullWidth
                  size="small"
                  label="Slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon className="text-muted" fontSize="small" />
                      </InputAdornment>
                    ),
                    sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                  }}
                />
              </article>
              <article className="col-12 col-md-3 mb-2">
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Resource Type"
                  value={formData.resource_type}
                  onChange={(e) => handleChange('resource_type', e.target.value)}
                  required
                >
                  {RESOURCE_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </article>
              <article className="col-12 col-md-3 mb-2">
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Creation Path"
                  value={formData.creation_path}
                  onChange={(e) => handleChange('creation_path', e.target.value)}
                >
                  {CREATION_PATHS.map((path) => (
                    <MenuItem key={path.value} value={path.value}>
                      {path.label}
                    </MenuItem>
                  ))}
                </TextField>
              </article>
            </div>
          </section>
        </section>

        {/* Content section: Description and Tags */}
        <section className="d-flex justify-content-between pt-3 px-4 flex-wrap gap-3">
          <section className="col-12 g-3">
            <div className="row">
              <article className="col-12 mb-2">
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label="Description"
                  placeholder="Describe the purpose and scope of this resource"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </article>
              <article className="col-12 mb-2">
                <label
                  style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Tags
                </label>
                <TagInput>
                  {formData.tags.map((tag) => (
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
                    placeholder="Type a tag and press Enter"
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
              </article>
            </div>
          </section>
        </section>

        {/* Footer actions */}
        <footer className="d-flex mt-3 px-3">
          <section className="flex-grow-1 mx-2 mb-3 h-25 d-flex justify-content-between align-items-end gap-2">
            <button
              title="Cancel"
              type="button"
              className="btn btn-soft-secondary btn-action ml-2"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-bordered-secondary"
                disabled={!formData.name || !formData.resource_type || isSaving}
              >
                {isSaving ? (
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  />
                ) : (
                  <SaveIcon className="me-2" fontSize="small" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </button>

              <button
                type="button"
                className="btn btn-bordered-success"
                disabled={!formData.name || !formData.resource_type || isSaving}
                onClick={(e) => handleSubmit(e, true)}
              >
                <OpenInNewIcon className="me-2" fontSize="small" />
                Save & Open Editor
              </button>
            </div>
          </section>
        </footer>
          </form>
        </div>
      </Container>
    </section>
  );
}

export default CognitiveResourceQuickCreate;
