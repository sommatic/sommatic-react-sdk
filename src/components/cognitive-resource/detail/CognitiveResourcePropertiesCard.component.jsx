import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  Popover,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CheckCircle as CheckCircleIcon,
  PauseCircle as PauseCircleIcon,
  Drafts as DraftsIcon,
  Add as AddIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import * as MuiIcons from '@mui/icons-material';

import KnowledgeResourceTypeBadge from '../KnowledgeResourceTypeBadge.component.jsx';

const StyledCard = styled(Card)(() => ({
  borderRadius: '12px',
  height: '100%',
  boxShadow: 'none',
  border: '1px solid #E5E7EB',
}));

const StyledAddTagButton = styled(IconButton)(() => ({
  padding: '2px',
  border: '1px dashed #D1D5DB',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderColor: '#9CA3AF',
  },
}));

const StyledPopoverContent = styled('div')(() => ({
  padding: '16px',
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
}));

function getStatusChipProps(status) {
  const s = status?.name?.toLowerCase() || 'draft';
  const chipStyle = {
    height: 24,
    fontWeight: 600,
    fontSize: '12px',
    border: 'none',
  };

  if (s === 'deployed' || s === 'active') {
    return {
      label: 'Active',
      icon: <CheckCircleIcon style={{ fontSize: 14, color: '#299E9C' }} />,
      sx: { ...chipStyle, bgcolor: '#CCFBF1', color: '#299E9C' },
    };
  }

  if (s === 'paused' || s === 'inactive') {
    return {
      label: 'Paused',
      icon: <PauseCircleIcon style={{ fontSize: 14, color: '#9F1239' }} />,
      sx: { ...chipStyle, bgcolor: '#FFE4E6', color: '#9F1239' },
    };
  }

  return {
    label: 'Draft',
    icon: <DraftsIcon style={{ fontSize: 14, color: '#374151' }} />,
    sx: { ...chipStyle, bgcolor: '#F3F4F6', color: '#374151' },
  };
}

function CognitiveResourcePropertiesCard({ resource = {}, onEvent, ui = {} }) {
  if (!resource) {
    return null;
  }

  const [newTag, setNewTag] = useState('');
  const [tagAnchorEl, setTagAnchorEl] = useState(null);
  const openTagPopover = Boolean(tagAnchorEl);

  const chipProps = getStatusChipProps(resource.status);
  const governance = resource.governance || {};
  const tags = resource.tags || [];

  const updatedAt = resource.modified?.timestamp
    ? new Date(+resource.modified.timestamp).toLocaleString()
    : resource.updated_at
      ? new Date(resource.updated_at).toLocaleString()
      : '—';

  const handleTagClick = (event) => setTagAnchorEl(event.currentTarget);
  const handleTagClose = () => {
    setTagAnchorEl(null);
    setNewTag('');
  };

  const handleAddTag = () => {
    if (!newTag.trim()) {
      return;
    }

    if (!tags.includes(newTag.trim()) && onEvent) {
      onEvent({
        action: 'cognitive-resource-detail::tag-added',
        namespace: 'sommatic',
        payload: { tag: newTag.trim() },
      });
    }

    handleTagClose();
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!onEvent) {
      return;
    }

    onEvent({
      action: 'cognitive-resource-detail::tag-removed',
      namespace: 'sommatic',
      payload: { tag: tagToRemove },
    });
  };

  return (
    <StyledCard>
      <CardContent>
        <h5 className="fw-bold mb-3">{ui?.propertiesTitle || 'Properties'}</h5>
        <section className="row g-3 align-items-center">
          <article className="col-md-2 col-sm-6 mt-0">
            <h6 className="text-muted small mb-1">Status</h6>
            <Chip
              label={chipProps.label}
              size="small"
              icon={chipProps.icon}
              sx={chipProps.sx}
            />
          </article>

          <article className="col-md-2 col-sm-6 mt-0">
            <h6 className="text-muted small mb-1">Type</h6>
            <KnowledgeResourceTypeBadge type={resource.resource_type} ui={ui} />
          </article>

          <article className="col-md-2 col-sm-6 mt-0">
            <h6 className="text-muted small mb-1">Last Updated</h6>
            <time className="small fw-medium text-dark d-block">{updatedAt}</time>
          </article>

          <article className="col-md-2 col-sm-6 mt-0">
            <h6 className="text-muted small mb-1">Owner</h6>
            <p className="small fw-medium text-dark m-0">
              {governance.owner_user_id || governance.owner_team_id || 'Admin'}
            </p>
          </article>

          <article className="col-md-2 col-sm-6 mt-0">
            <h6 className="text-muted small mb-1">Project</h6>
            {(() => {
              const projectSnap = resource.context?.project;
              const emojiName = projectSnap?.ui?.emoji?.icon;
              const ResolvedIcon = emojiName && MuiIcons[emojiName] ? MuiIcons[emojiName] : null;
              const label = projectSnap?.name || projectSnap?.slug || resource.project_id || '—';
              return (
                <div className="d-flex align-items-center gap-1">
                  {ResolvedIcon ? (
                    <ResolvedIcon style={{ fontSize: 14, color: projectSnap?.ui?.emoji?.color || '#6B7280' }} />
                  ) : (
                    <FolderIcon style={{ fontSize: 14, color: '#9CA3AF' }} />
                  )}
                  <p className="small fw-medium text-dark m-0">{label}</p>
                </div>
              );
            })()}
          </article>

          <article className="col-md-4 col-sm-6 mt-0">
            <h6 className="text-muted small mb-1">Tags</h6>
            <div className="d-flex align-items-center flex-wrap gap-1">
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => handleRemoveTag(tag)}
                  sx={{
                    height: 24,
                    fontSize: '12px',
                    borderRadius: '12px',
                    bgcolor: '#F9FAFB',
                    color: '#4B5563',
                    border: '1px solid #E5E7EB',
                  }}
                />
              ))}
              <StyledAddTagButton size="small" onClick={handleTagClick} title="Add tag">
                <AddIcon style={{ fontSize: 16, color: '#9CA3AF' }} />
              </StyledAddTagButton>
            </div>
          </article>
        </section>
      </CardContent>

      <Popover
        open={openTagPopover}
        anchorEl={tagAnchorEl}
        onClose={handleTagClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        disableScrollLock
      >
        <StyledPopoverContent>
          <TextField
            size="small"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="New tag..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTag();
            }}
            sx={{
              width: '200px',
              input: { color: '#374151', fontSize: '13px' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#D1D5DB' },
                '&:hover fieldset': { borderColor: '#9CA3AF' },
              },
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleAddTag}
            sx={{
              bgcolor: '#3A2E4F',
              '&:hover': { bgcolor: '#2D243E' },
              textTransform: 'none',
            }}
          >
            Add
          </Button>
        </StyledPopoverContent>
      </Popover>
    </StyledCard>
  );
}

export default CognitiveResourcePropertiesCard;
