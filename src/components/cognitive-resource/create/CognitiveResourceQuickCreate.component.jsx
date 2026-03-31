import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { TextField, Chip, InputAdornment, Autocomplete, Button } from '@mui/material';
import {
  Link as LinkIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  OpenInNew as OpenInNewIcon,
  DescriptionOutlined as DescriptionOutlinedIcon,
  FormatListBulletedOutlined as FormatListBulletedOutlinedIcon,
  AccountTreeOutlined as AccountTreeOutlinedIcon,
  InsertDriveFileOutlined as InsertDriveFileOutlinedIcon,
  PolicyOutlined as PolicyOutlinedIcon,
  MenuBookOutlined as MenuBookOutlinedIcon,
  StorageOutlined as StorageOutlinedIcon,
  LinkOutlined as LinkOutlinedIcon,
  LabelOutlined as LabelOutlinedIcon,
} from '@mui/icons-material';

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

const RESOURCE_TYPE_ORDER = [
  'text', 'taxonomy', 'document', 'list', 'prompt', 'policy', 'manual', 'dataset', 'reference',
];
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
  resource_type: null,
  creation_path: null,
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
  organization = null,
  resourceTypes = [],
  creationPaths = [],
}) {
  const resourceTypeOptions = useMemo(() => {
    const types = Object.values(resourceTypes);
    return types.sort((a, b) => {
      const indexA = RESOURCE_TYPE_ORDER.indexOf(a.name);
      const indexB = RESOURCE_TYPE_ORDER.indexOf(b.name);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [resourceTypes]);

  const creationPathOptions = useMemo(
    () => Object.values(creationPaths),
    [creationPaths]
  );

  const [formData, setFormData] = useState(() => {
    if (entitySelected) {
      const matchedResourceType =
        resourceTypeOptions.find((rt) => rt.name === entitySelected.resource_type?.name) ||
        entitySelected.resource_type ||
        null;

      return {
        name: entitySelected.name || '',
        slug: entitySelected.slug || '',
        organization_id: entitySelected.organization_id || organization?.organization_id || '',
        description: entitySelected.description || '',
        resource_type: matchedResourceType,
        creation_path: null,
        tags: entitySelected.tags || [],
      };
    }
    return {
      ...INITIAL_FORM,
      organization_id: organization?.organization_id || '',
    };
  });

  const [isSaving, setIsSaving] = useState(false);

  // Sync organization_id when organization prop arrives late
  useEffect(() => {
    if (organization?.organization_id && !formData.organization_id && !entitySelected) {
      handleChange('organization_id', organization.organization_id);
    }
  }, [organization?.organization_id]);

  // Set default resource_type when resourceTypes arrive
  useEffect(() => {
    if (resourceTypeOptions.length > 0 && !formData.resource_type && !entitySelected) {
      handleChange('resource_type', resourceTypeOptions[0]);
    }
  }, [resourceTypeOptions]);

  // Set default creation_path when creationPaths arrive
  useEffect(() => {
    if (creationPathOptions.length > 0 && !formData.creation_path && !entitySelected) {
      handleChange('creation_path', creationPathOptions[0]);
    }
  }, [creationPathOptions]);

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

  const handleNameChange = useCallback(
    (value) => {
      handleChange('name', value);
      if (!entitySelected) {
        const slug = value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        handleChange('slug', slug);
      }
    },
    [handleChange, entitySelected]
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
    const resourceTypeName = formData.resource_type?.name || '';
    const format = FORMAT_DEFAULTS[resourceTypeName] || 'markdown';
    const content = { format };

    if (['text', 'manual', 'policy'].includes(resourceTypeName)) {
      content.text = '';
    } else if (['list'].includes(resourceTypeName)) {
      content.structured_data = { items: [] };
    } else if (['taxonomy'].includes(resourceTypeName)) {
      content.structured_data = { categories: [] };
    } else if (['document'].includes(resourceTypeName)) {
      content.file_ref = {};
    } else if (['reference'].includes(resourceTypeName)) {
      content.url = '';
      content.structured_data = {};
    } else if (['dataset'].includes(resourceTypeName)) {
      content.structured_data = {};
    }

    return {
      name: formData.name,
      slug: formData.slug,
      organization_id: formData.organization_id,
      description: formData.description,
      resource_type: formData.resource_type,
      creation_path: formData.creation_path,
      tags: formData.tags,
      status: { id: 10, name: 'draft', title: 'Draft' },
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
                required
              />
            </section>
          </HeaderArticle>
        </header>

        {/* Gray section: Row 1 (Organization ID + Slug), Row 2 (Resource Type + Creation Path) */}
        <section className="d-flex justify-content-between bg-light pt-3 px-4 flex-wrap gap-3">
          <section className="col-12 g-3">
            {/* Row 1: Organization ID + Slug */}
            <div className="row">
              <article className="col-12 col-md-6 mb-2">
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
              <article className="col-12 col-md-6 mb-2">
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
                  }}
                />
              </article>
            </div>

            {/* Row 2: Resource Type + Creation Path */}
            <div className="row">
              <article className="col-12 col-md-6 mb-2">
                <Autocomplete
                  size="small"
                  options={resourceTypeOptions}
                  getOptionLabel={(option) => option?.title || ''}
                  isOptionEqualToValue={(option, value) => option?.name === value?.name}
                  value={formData.resource_type}
                  onChange={(_, newValue) => handleChange('resource_type', newValue)}
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
                    const Icon = formData.resource_type ? (TYPE_ICON_MAP[formData.resource_type.name] || LabelOutlinedIcon) : null;
                    return (
                      <TextField
                        {...params}
                        label="Resource Type"
                        required
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
              </article>
              <article className="col-12 col-md-6 mb-2">
                <Autocomplete
                  size="small"
                  options={creationPathOptions}
                  getOptionLabel={(option) => option?.title || ''}
                  isOptionEqualToValue={(option, value) => option?.name === value?.name}
                  value={formData.creation_path}
                  onChange={(_, newValue) => handleChange('creation_path', newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Creation Path" />
                  )}
                />
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
            <Button
              onClick={handleCancel}
              disabled={isSaving}
              sx={{
                color: '#6B7280',
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: '8px',
              }}
            >
              Cancel
            </Button>

            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="contained"
                disabled={!formData.name || !formData.resource_type || isSaving}
                startIcon={
                  isSaving ? (
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                  ) : (
                    <SaveIcon fontSize="small" />
                  )
                }
                sx={{
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: '8px',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#D1D5DB', boxShadow: 'none' },
                }}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>

              <Button
                variant="contained"
                disabled={!formData.name || !formData.resource_type || isSaving}
                onClick={(e) => handleSubmit(e, true)}
                startIcon={<OpenInNewIcon fontSize="small" />}
                sx={{
                  backgroundColor: '#299E9C',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: '8px',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#1F7A78', boxShadow: 'none' },
                }}
              >
                Save & Open Editor
              </Button>
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
