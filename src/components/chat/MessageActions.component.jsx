import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import styled from 'styled-components';

const Row = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  padding: 0 2px;
`;

const TimeText = styled.span`
  font-size: 0.68rem;
  color: rgba(0, 0, 0, 0.42);
  white-space: nowrap;
`;

const copyButtonSx = {
  p: '3px',
  color: 'rgba(0, 0, 0, 0.34)',
  transition: 'color 0.15s, background-color 0.15s',
  '&:hover': {
    color: 'rgba(0, 0, 0, 0.62)',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
};

function formatRelativeTime(raw) {
  if (raw == null || raw === '') {
    return null;
  }

  let ms;
  if (typeof raw === 'number') {
    ms = raw;
  } else if (/^\d+$/.test(String(raw))) {
    ms = Number(raw);
  } else {
    ms = new Date(raw).getTime();
  }

  if (!ms || Number.isNaN(ms)) {
    return null;
  }

  const diffSeconds = Math.floor((Date.now() - ms) / 1000);

  if (diffSeconds < 45) {
    return 'just now';
  }

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return new Date(ms).toLocaleDateString();
}

function MessageActions({ getText, createdAt, align = 'left' }) {
  const [copied, setCopied] = useState(false);

  const time = formatRelativeTime(createdAt);

  const handleCopy = async () => {
    const text = typeof getText === 'function' ? getText() : getText;

    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const copyButton = (
    <Tooltip title={copied ? 'Copied' : 'Copy message'} arrow>
      <IconButton size="small" aria-label="copy message" onClick={handleCopy} sx={copyButtonSx}>
        {copied ? (
          <CheckRoundedIcon sx={{ fontSize: 14, color: 'success.main' }} />
        ) : (
          <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
        )}
      </IconButton>
    </Tooltip>
  );

  return (
    <Row>
      {align === 'right' && time && <TimeText>{time}</TimeText>}
      {copyButton}
      {align === 'left' && time && <TimeText>{time}</TimeText>}
    </Row>
  );
}

export default MessageActions;
