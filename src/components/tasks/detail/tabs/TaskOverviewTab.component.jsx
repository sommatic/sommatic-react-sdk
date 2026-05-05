import React from 'react';
import { Box, Chip } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import SummarizeIcon from '@mui/icons-material/Summarize';
import LinkIcon from '@mui/icons-material/Link';
import FolderIcon from '@mui/icons-material/Folder';
import * as MuiIcons from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Theme tokens ───────────────────────────────────────────────────────────

const T = {
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  surfaceGray: '#F9FAFB',
  border: '#E5E7EB',
};

// ─── Styled boxes ───────────────────────────────────────────────────────────

const descriptionBoxSx = {
  background: T.surfaceGray,
  border: `1px solid ${T.border}`,
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '0.85rem',
  color: T.textPrimary,
  lineHeight: 1.6,
  minHeight: 40,
  // Markdown resets — keep rendered output visually compact and consistent
  // with the card, no outsized h1/h2 headings, no bleeding margins.
  '& > :first-of-type': { marginTop: 0 },
  '& > :last-child': { marginBottom: 0 },
  '& p': { margin: '0 0 8px 0' },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    fontSize: '0.95rem',
    fontWeight: 600,
    margin: '12px 0 6px 0',
    color: T.textPrimary,
  },
  '& ul, & ol': { margin: '0 0 8px 0', paddingLeft: 20 },
  '& li': { margin: '2px 0' },
  '& code': {
    background: '#EEF2FF',
    padding: '1px 5px',
    borderRadius: 3,
    fontSize: '0.8rem',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  },
  '& pre': {
    background: '#F3F4F6',
    padding: '10px 12px',
    borderRadius: 6,
    overflowX: 'auto',
    fontSize: '0.8rem',
    margin: '8px 0',
  },
  '& pre code': { background: 'transparent', padding: 0 },
  '& blockquote': {
    margin: '8px 0',
    padding: '4px 12px',
    borderLeft: `3px solid ${T.border}`,
    color: T.textSecondary,
  },
  '& a': { color: '#4F46E5', textDecoration: 'none' },
  '& hr': { border: 'none', borderTop: `1px solid ${T.border}`, margin: '12px 0' },
  '& table': { borderCollapse: 'collapse', margin: '8px 0', fontSize: '0.8rem' },
  '& th, & td': {
    border: `1px solid ${T.border}`,
    padding: '4px 8px',
    textAlign: 'left',
  },
  '& th': { background: '#FFFFFF', fontWeight: 600 },
  '& img': { maxWidth: '100%' },
};

const MARKDOWN_PLUGINS = [remarkGfm];

function MarkdownContent({ children }) {
  if (!children) return null;
  return (
    <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS}>
      {String(children)}
    </ReactMarkdown>
  );
}

const sectionLabelSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  fontSize: '0.82rem',
  color: T.textSecondary,
  mb: 1,
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function TaskOverviewTab({ task }) {
  if (!task) return null;

  const projectSnap = task.context?.project;
  const projectEmojiName = projectSnap?.ui?.emoji?.icon;
  const ProjectResolvedIcon =
    projectEmojiName && MuiIcons[projectEmojiName] ? MuiIcons[projectEmojiName] : null;
  const projectLabel = projectSnap?.name || projectSnap?.slug || task.project_id || null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Project */}
      {projectLabel && (
        <Box>
          <Box sx={sectionLabelSx}>
            <FolderIcon sx={{ fontSize: 14 }} />
            Project
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {ProjectResolvedIcon ? (
              <ProjectResolvedIcon
                sx={{ fontSize: 16, color: projectSnap?.ui?.emoji?.color || '#6B7280' }}
              />
            ) : (
              <FolderIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
            )}
            <Box sx={{ fontSize: '0.85rem', color: T.textPrimary, fontWeight: 500 }}>
              {projectLabel}
            </Box>
          </Box>
        </Box>
      )}

      {/* Description / Instructions */}
      <Box>
        <Box sx={sectionLabelSx}>
          <DescriptionIcon sx={{ fontSize: 14 }} />
          Description
        </Box>
        <Box sx={descriptionBoxSx}>
          {task.details ? (
            <MarkdownContent>{task.details}</MarkdownContent>
          ) : (
            'No description provided.'
          )}
        </Box>
      </Box>

      {/* Summary */}
      {task.payload?.summary && (
        <Box>
          <Box sx={sectionLabelSx}>
            <SummarizeIcon sx={{ fontSize: 14 }} />
            Summary
          </Box>
          <Box sx={descriptionBoxSx}>
            <MarkdownContent>{task.payload.summary}</MarkdownContent>
          </Box>
        </Box>
      )}

      {/* Linked Entities */}
      {task.payload?.linked_entities?.length > 0 && (
        <Box>
          <Box sx={sectionLabelSx}>
            <LinkIcon sx={{ fontSize: 14 }} />
            Linked Entities
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {task.payload.linked_entities.map((entity, idx) => (
              <Chip
                key={idx}
                size="small"
                icon={<LinkIcon sx={{ fontSize: 14 }} />}
                label={`${entity.system_domain || ''}: ${entity.system_entity_id || '-'}`}
                variant="outlined"
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  borderColor: T.border,
                  color: T.textPrimary,
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
