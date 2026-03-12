import React from 'react';
import { Chip } from '@mui/material';

const STATUS_COLOR_MAP = {
  draft: { bg: '#FFFBEB', color: '#92400E' },
  active: { bg: '#ECFDF5', color: '#065F46' },
  archived: { bg: '#F3F4F6', color: '#374151' },
  deleted: { bg: '#FEF2F2', color: '#991B1B' },
};

const DEFAULT_STYLE = { bg: '#F3F4F6', color: '#6B7280' };

function KnowledgeResourceStatusBadge({ status, ui = {}, size = 'small' }) {
  if (!status) {
    return null;
  }

  const statusName = typeof status === 'string' ? status : status?.name || '';
  const statusLabel = ui?.statusLabel || status?.title || statusName.charAt(0).toUpperCase() + statusName.slice(1);
  const style = STATUS_COLOR_MAP[statusName] || DEFAULT_STYLE;

  return (
    <Chip
      label={statusLabel}
      size={size}
      sx={{
        backgroundColor: style.bg,
        color: style.color,
        fontWeight: 500,
        fontSize: '0.75rem',
        height: size === 'small' ? 22 : 26,
      }}
    />
  );
}

export default KnowledgeResourceStatusBadge;
