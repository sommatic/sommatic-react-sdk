import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import 'katex/dist/katex.min.css';

import MessageActions from './MessageActions.component';
import ImageLightbox from './ImageLightbox.component';

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

const AttachmentsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: ${({ $hasText }) => ($hasText ? '8px' : '0')};
`;

const BubbleImage = styled.img`
  height: 130px;
  max-width: 100%;
  border-radius: 10px;
  object-fit: cover;
  cursor: zoom-in;
  display: block;
`;

const DocChip = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 220px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: inherit;
  text-decoration: none;

  svg {
    color: #6b7280;
    flex-shrink: 0;
  }

  span {
    font-size: 0.78rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.08);
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

function ChatBubble({ role = 'user', createdAt, attachments = [], children }) {
  const isUser = role === 'user';
  const bubbleRef = useRef(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const getRawText = () => {
    return typeof children === 'string' ? children : bubbleRef.current?.innerText;
  };

  const hasText = Boolean(typeof children === 'string' ? children.trim() : children);
  const validAttachments = (attachments || []).filter((attachment) => attachment && attachment.content);

  return (
    <section className={`d-flex flex-column w-100 ${isUser ? 'align-items-end' : 'align-items-start'}`}>
      <Bubble $role={role} ref={bubbleRef}>
        {validAttachments.length > 0 && (
          <AttachmentsRow $hasText={hasText}>
            {validAttachments.map((attachment, index) => {
              const isImage = attachment.isImage ?? (attachment.type || '').startsWith('image/');

              if (isImage) {
                return (
                  <BubbleImage
                    key={index}
                    src={attachment.content}
                    alt={attachment.name || 'attachment'}
                    onClick={() => setLightboxUrl(attachment.content)}
                  />
                );
              }

              return (
                <DocChip
                  key={index}
                  href={attachment.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={attachment.name}
                >
                  <InsertDriveFileIcon fontSize="small" />
                  <span>{attachment.name || 'file'}</span>
                </DocChip>
              );
            })}
          </AttachmentsRow>
        )}
        {renderBubbleContent(children)}
      </Bubble>
      <MessageActions getText={getRawText} createdAt={createdAt} align={isUser ? 'right' : 'left'} />
      <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </section>
  );
}

export default ChatBubble;
