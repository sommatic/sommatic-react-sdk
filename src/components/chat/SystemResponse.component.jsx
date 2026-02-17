import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

import { mdxComponents } from '@prose-ui/react';
import { ContentCopyRounded, Check } from '@mui/icons-material';
import '@prose-ui/style/prose-ui.css';
import 'katex/dist/katex.min.css';

const SystemResponseWrapper = styled.article`
  max-width: 860px;
  padding: ${(props) => (props.$variant === 'bubble' || props.$variant === 'gradient' ? '0.6rem 0.9rem' : '0 12px')};
  border-radius: ${(props) => (props.$variant === 'bubble' || props.$variant === 'gradient' ? '18px' : '0')};
  border: ${(props) => (props.$variant === 'bubble' || props.$variant === 'gradient' ? '2px solid #bfafee' : 'none')};

  background: ${(props) => {
    if (props.$variant === 'gradient') {
      return 'linear-gradient(135deg, #ffffff 0%, #eae8faff 100%) !important';
    }
    if (props.$variant === 'bubble') {
      return '#f5f5f9 !important';
    }
    return 'transparent';
  }};
  box-shadow: ${(props) =>
    props.$variant === 'bubble' || props.$variant === 'gradient' ? '0 4px 12px rgba(123, 104, 238, 0.08)' : 'none'};

  color: #000 !important;

  white-space: pre-wrap;
  word-break: break-word;

  &.prose-ui {
    /* Base Colors */
    --p-color-bg: transparent;
    --p-color-bg-surface1: transparent;
    --p-color-bg-surface2: transparent;
    --p-color-bg-surface1hover: rgba(0, 0, 0, 0.05);
    --p-color-bg-surface2hover: rgba(0, 0, 0, 0.05);

    /* Text Colors */
    --p-color-text-strong: #000;
    --p-color-text: #000;
    --p-color-text-muted: #555;
    --p-color-text-xmuted: #777;
    --p-color-text-disabled: #999;
    --p-color-text-accent: #5e1c9d; /* Main accent color */

    --p-color-text-note: #000;
    --p-color-text-info: #004085;
    --p-color-text-warning: #856404;
    --p-color-text-success: #155724;
    --p-color-text-danger: #721c24;

    /* Syntax Highlighting (Light Theme Variables) */
    --p-color-text-syntax1: #d73a49;
    --p-color-text-syntax2: #6f42c1;
    --p-color-text-syntax3: #22863a;
    --p-color-text-syntax4: #005cc5;

    /* Font overrides */
    --p-font-family-mono: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;

    /* Borders */
    --p-color-border: rgba(0, 0, 0, 0.1);
    --p-color-border-subtle: rgba(0, 0, 0, 0.05);

    /* Body Specifics */
    --p-body-color-bg: transparent !important;
    color: var(--p-color-text);

    /* Component Overrides - Colors Only */
    --p-code-block-color-bg: #f6f8fa;
    --p-code-block-color-text: var(--p-color-text);
    --p-callout-note-color-bg: #f6f8fa;

    /* Inline Code specific overrides (bg: #d8d8d8, color: #0d0d0d) */
    --p-inline-code-color-bg: #d8d8d8;

    /* Table Header Overrides (Black) */
    --p-table-th-color-text: #000;

    pre,
    code,
    .prose-ui-code-block-wrapper {
      font-family: var(--p-font-family-mono) !important;
    }

    :not(pre) > code {
      color: #0d0d0d !important;
    }

    th {
      color: #000 !important;
    }

    /* Headings Colors (H1-H6) - Map to strong text */
    --p-h1-color: var(--p-color-text-strong);
    --p-h2-color: var(--p-color-text-strong);
    --p-h3-color: var(--p-color-text-strong);
    --p-h4-color: var(--p-color-text-strong);
    --p-h5-color: var(--p-color-text-strong);
    --p-h6-color: var(--p-color-text-strong);

    .hljs-comment,
    .hljs-quote {
      color: var(--p-color-text-muted);
      font-style: italic;
    }
    .hljs-doctag,
    .hljs-keyword,
    .hljs-formula {
      color: var(--p-color-text-syntax3);
    }
    .hljs-section,
    .hljs-name,
    .hljs-selector-tag,
    .hljs-deletion,
    .hljs-subst {
      color: var(--p-color-text-syntax1);
    }
    .hljs-literal {
      color: var(--p-color-text-syntax2);
    }
    .hljs-string,
    .hljs-regexp,
    .hljs-addition,
    .hljs-attribute,
    .hljs-meta-string {
      color: var(--p-color-text-syntax2);
    }
    .hljs-built_in,
    .hljs-class .hljs-title {
      color: var(--p-color-text-syntax4);
    }
    .hljs-attr,
    .hljs-variable,
    .hljs-template-variable,
    .hljs-type,
    .hljs-selector-class,
    .hljs-selector-attr,
    .hljs-selector-pseudo,
    .hljs-number {
      color: var(--p-color-text-syntax1);
    }
    .hljs-symbol,
    .hljs-bullet,
    .hljs-link,
    .hljs-meta,
    .hljs-selector-id,
    .hljs-title {
      color: var(--p-color-text-syntax4);
    }
    .hljs-emphasis {
      font-style: italic;
    }
    .hljs-strong {
      font-weight: bold;
    }

    code[class*='language-'],
    pre[class*='language-'],
    code.hljs {
      text-align: left;
      white-space: pre;
      word-spacing: normal;
      word-break: normal;
      word-wrap: normal;
      tab-size: 4;
      -webkit-hyphens: none;
      hyphens: none;
      background: 0 0;
      line-height: 1.5;
    }

    /* Fix Selectable Text */
    user-select: text !important;
    -webkit-user-select: text !important;
    * {
      user-select: text !important;
      -webkit-user-select: text !important;
    }
  }

  &&.prose-ui ol:where(:not(.not-prose, .not-prose *)) > li::before,
  &&.prose-ui ul:where(:not(.not-prose, .not-prose *)) > li::before,
  &&.prose-ui li::before {
    content: none !important;
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    border: none !important;
  }
`;

const CodeBlockWrapper = styled.div`
  border-radius: var(--p-border-radius);

  border: 1px solid var(--p-color-border);
  margin-bottom: 1.5em;
  margin-top: 1.5em;
`;

const CodeHeader = styled.div`
  padding: 0.5rem 1rem;
  background: rgb(246 248 250);
  font-size: 0.8rem;
  color: var(--p-color-text-muted);
  font-family: var(--p-font-family-mono);

  span {
    font-weight: 600;
  }
`;

const CopyButtonWrapper = styled.button`
  gap: 0.25rem;
`;

const PreContent = styled.pre`
  padding: 0.5rem 1rem;

  background: var(--p-code-block-color-bg);
`;

const preprocessLaTeX = (content) => {
  if (typeof content !== 'string') {
    return content;
  }
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
};

const CustomPreBlock = ({ children }) => {
  const preRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const codeElement = React.Children.toArray(children)[0];
  const className = codeElement?.props?.className || '';
  const match = /language-(\w+)/.exec(className);
  const language = match ? match[1] : 'text';

  const handleCopy = () => {
    if (preRef.current) {
      const text = preRef.current.innerText || '';
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <CodeBlockWrapper className="prose-ui-code-block-wrapper position-relative overflow-hidden">
      <CodeHeader className="code-header d-flex justify-content-between align-items-center">
        <span>{language}</span>
        <CopyButtonWrapper className="d-flex align-items-center bg-transparent border-0 p-0 text-reset" onClick={handleCopy}>
          {copied ? <Check sx={{ fontSize: 16 }} /> : <ContentCopyRounded sx={{ fontSize: 16 }} />}
          {copied ? 'Copied' : 'Copy'}
        </CopyButtonWrapper>
      </CodeHeader>
      <div ref={preRef}>
        <PreContent className="m-0 border-0 rounded-0">{children}</PreContent>
      </div>
    </CodeBlockWrapper>
  );
};

function SystemResponse({ children, variant = 'bubble' }) {
  const isString = typeof children === 'string';
  const content = isString ? preprocessLaTeX(children) : children;

  return (
    <section className="d-flex flex-column w-100 justify-content-start">
      <SystemResponseWrapper className="prose-ui w-100 me-auto ms-0 d-block" $variant={variant}>
        {isString ? (
          <ReactMarkdown
            components={{
              ...mdxComponents,
              pre: CustomPreBlock,
            }}
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex, rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        ) : (
          children
        )}
      </SystemResponseWrapper>
    </section>
  );
}

export default SystemResponse;
