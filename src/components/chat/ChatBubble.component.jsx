import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { Tooltip, Menu, MenuItem } from '@mui/material';
import { ContentCopyRounded, Check } from '@mui/icons-material';

const Bubble = styled.div`
  max-width: min(720px, 92%);
  padding: 0.75rem 0.75rem;
  border-radius: 18px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.35;
  position: relative; /* For positioning copy button */

  background: ${(p) => (p.$role === 'user' ? '#ffffffba' : '#1f1f1f')};
  color: ${(p) => (p.$role === 'user' ? '#151515d6' : '#1f1f1f')};

  /* Show button on hover */
  &:hover .copy-btn {
    opacity: 1;
    pointer-events: auto;
  }

  & p {
    margin-bottom: 0;
  }
  & p:last-child {
    margin-bottom: 0;
  }

  & ul,
  & ol {
    margin-bottom: 0.5rem;
    padding-left: 1.5rem;
  }

  & ul:last-child,
  & ol:last-child {
    margin-bottom: 0;
  }
`;

const CopyButton = styled.button`
  position: absolute;
  bottom: -30px;
  right: 2px;

  border: none;
  border-radius: 4px;
  color: #000000;
  padding: 6px 6px;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0; /* Hidden by default */
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 5;
  backdrop-filter: blur(4px);

  &:hover {
    opacity: 1;
    pointer-events: auto;
    background: #e8e8e8;
  }

  /* Bridge hierarchy gap for hover */
  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: 0;
    right: 0;
    height: 20px;
  }
`;

const CheckIcon = styled(Check)`
  font-size: 17px !important;
`;

const CopyIcon = styled(ContentCopyRounded)`
  font-size: 17px !important;
`;

const StyledCopyMenu = styled(Menu)`
  z-index: 1500 !important;
  & .MuiBackdrop-root {
    z-index: 1500 !important;
  }
  & .MuiPaper-root {
    border-radius: 12px;
    margin-top: 8px;
    min-width: 180px;
    z-index: 1501 !important;
  }
`;

const CommandChipSpan = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #1a1a1a;
  background-color: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 6px;
  white-space: nowrap;
  margin: 0 1px;

  &::before {
    content: '/';
    margin-right: 0px;
    color: #5b4d7a;
    font-weight: 600;
  }
`;

const CHIP_MARKER_REGEX = /\[\/([^\]]+)\]/g;

function parseContentWithChips(text) {
  if (typeof text !== 'string' || !text) return [];
  const segments = [];
  let lastIndex = 0;
  let match;
  CHIP_MARKER_REGEX.lastIndex = 0;
  while ((match = CHIP_MARKER_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'chip', label: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return segments.length ? segments : [{ type: 'text', content: text }];
}

function renderBubbleContent(children) {
  if (typeof children !== 'string') {
    return children;
  }
  const segments = parseContentWithChips(children);
  if (segments.length === 1 && segments[0].type === 'text') {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    );
  }
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'chip' ? (
          <CommandChipSpan key={`chip-${i}`}>{seg.label}</CommandChipSpan>
        ) : (
          <ReactMarkdown key={`md-${i}`} remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {seg.content}
          </ReactMarkdown>
        ),
      )}
    </>
  );
}

function ChatBubble({ role = 'user', children }) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const bubbleRef = useRef(null);

  const [anchorCopyMenu, setAnchorCopyMenu] = useState(null);
  const isOpenCopyMenu = Boolean(anchorCopyMenu);

  const handleCopyMenuClick = (event) => {
    event.stopPropagation();
    setAnchorCopyMenu(event.currentTarget);
  };

  const handleCopyMenuClose = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorCopyMenu(null);
  };

  const getRawText = () => {
    return typeof children === 'string' ? children : bubbleRef.current?.innerText;
  };

  const handleCopyMarkdown = (e) => {
    e.stopPropagation();
    const text = getRawText();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    handleCopyMenuClose();
  };

  const handleCopyPlainText = (e) => {
    e.stopPropagation();
    let text = getRawText();
    if (text) {
      text = text
        .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold markers (** or __)
        .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic markers (* or _)
        .replace(/~{2}(.*?)~{2}/g, '$1') // Remove strikethrough markers (~~)
        .replace(/`{3}([\s\S]*?)`{3}/g, '$1') // Remove code block markers (```)
        .replace(/`(.+?)`/g, '$1') // Remove inline code markers (`)
        .replace(/^#+\s+/gm, '') // Remove header symbols (#)
        .replace(/^>\s+/gm, '') // Remove blockquote symbols (>)
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove link syntax, keep link text
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove image syntax, keep alt text
        .replace(/\[\/([^\]]+)\]/g, '/$1'); // Chip marker [/x] -> /x

      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    handleCopyMenuClose();
  };

  return (
    <section className={`d-flex w-100 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
      <Bubble $role={role} className={isUser ? 'ms-auto' : 'me-auto'} ref={bubbleRef}>
        {renderBubbleContent(children)}
        <Tooltip title="Copy">
          <CopyButton className="copy-btn" onClick={handleCopyMenuClick}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </CopyButton>
        </Tooltip>
      </Bubble>

      <StyledCopyMenu
        id="copy-menu"
        anchorEl={anchorCopyMenu}
        open={isOpenCopyMenu}
        onClose={handleCopyMenuClose}
        disableScrollLock={true}
        slotProps={{
          root: {
            sx: { zIndex: 1500 },
          },
          list: {
            dense: true,
          },
        }}
      >
        <MenuItem onClick={handleCopyMarkdown}>Copy Markdown</MenuItem>
        <MenuItem onClick={handleCopyPlainText}>Copy Plain Text</MenuItem>
      </StyledCopyMenu>
    </section>
  );
}

export default ChatBubble;
