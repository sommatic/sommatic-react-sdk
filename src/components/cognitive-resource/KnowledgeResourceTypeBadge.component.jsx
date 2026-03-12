import React from 'react';
import { Chip } from '@mui/material';
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
};

const TYPE_COLOR_MAP = {
  text: { bg: '#F3F4F6', color: '#4B5563' },
  manual: { bg: '#F3F4F6', color: '#4B5563' },
  policy: { bg: '#F3F4F6', color: '#4B5563' },
  list: { bg: '#F0FDFA', color: '#0F766E' },
  taxonomy: { bg: '#F0FDFA', color: '#0F766E' },
  document: { bg: '#FDF4FF', color: '#7E22CE' },
  dataset: { bg: '#FDF4FF', color: '#7E22CE' },
  reference: { bg: '#F5F3FF', color: '#6D28D9' },
};

const DEFAULT_STYLE = { bg: '#F3F4F6', color: '#4B5563' };

function KnowledgeResourceTypeBadge({ type, ui = {}, size = 'small' }) {
  if (!type) {
    return null;
  }

  const typeName = typeof type === 'string' ? type : type?.name || '';
  const typeLabel = ui?.typeLabel || typeName.charAt(0).toUpperCase() + typeName.slice(1);
  const style = TYPE_COLOR_MAP[typeName] || DEFAULT_STYLE;
  const IconComponent = TYPE_ICON_MAP[typeName] || LabelOutlinedIcon;

  return (
    <Chip
      icon={<IconComponent sx={{ fontSize: 14, color: `${style.color} !important` }} />}
      label={typeLabel}
      size={size}
      sx={{
        backgroundColor: style.bg,
        color: style.color,
        fontWeight: 500,
        fontSize: '0.75rem',
        height: size === 'small' ? 24 : 28,
        '& .MuiChip-icon': {
          marginLeft: '6px',
        },
      }}
    />
  );
}

export default KnowledgeResourceTypeBadge;
