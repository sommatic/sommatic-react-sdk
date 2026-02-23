import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { Tooltip } from '@mui/material';
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
    margin-bottom: 0.5rem;
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

function ChatBubble({ role = 'user', children }) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const bubbleRef = useRef(null);

  const handleCopy = (e) => {
    e.stopPropagation(); // Prevent clicking through bubble if that does anything
    if (children) {
      // Prefer copying raw children string if possible, or innerText
      const text = typeof children === 'string' ? children : bubbleRef.current?.innerText;

      if (text) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <section className={`d-flex w-100 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
      <Bubble $role={role} className={isUser ? 'ms-auto' : 'me-auto'} ref={bubbleRef}>
        {typeof children === 'string' ? (
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {children}
          </ReactMarkdown>
        ) : (
          children
        )}
        <Tooltip title="Copy">
          <CopyButton className="copy-btn" onClick={handleCopy}>
            {copied ? <Check sx={{ fontSize: 17 }} /> : <ContentCopyRounded sx={{ fontSize: 17 }} />}
          </CopyButton>
        </Tooltip>
      </Bubble>
    </section>
  );
}

export default ChatBubble;
