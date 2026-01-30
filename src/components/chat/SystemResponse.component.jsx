import React, { useState, useRef } from 'react';
import styled from "styled-components";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { mdxComponents } from '@prose-ui/react';
import { ContentCopyRounded, Check } from '@mui/icons-material';
import '@prose-ui/style/prose-ui.css';
import 'katex/dist/katex.min.css';

const SystemResponseWrapper = styled.section`
  width: 100%;
  max-width: 860px;
  margin-right: auto;
  margin-left: 0;
  padding: 0 8px;

  /* Typography is handled by prose-ui, keeping layout constraints */
  display: block;

  /* Customize Prose UI vars */
  &.prose-ui {
    /* STRICT LIGHT MODE OVERRIDES */

    /* Base Colors */
    --p-color-bg: transparent;
    --p-color-bg-surface1: transparent;
    --p-color-bg-surface2: transparent;
    --p-color-bg-surface1hover: rgba(0,0,0,0.05);
    --p-color-bg-surface2hover: rgba(0,0,0,0.05); 
    
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
    --p-font-family-mono: ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;

    /* Borders */
    --p-color-border: rgba(0,0,0,0.1);
    --p-color-border-subtle: rgba(0,0,0,0.05);

    /* Body Specifics */
    --p-body-color-bg: transparent !important;
    background-color: transparent !important;
    color: var(--p-color-text);
    
    /* Component Overrides - Colors Only */
    --p-code-block-color-bg: #f6f8fa;
    --p-code-block-color-text: var(--p-color-text);
    --p-callout-note-color-bg: #f6f8fa;
    
    /* Inline Code specific overrides (bg: #d8d8d8, color: #0d0d0d) */
    --p-inline-code-color-bg: #d8d8d8;

    /* Table Header Overrides (Black) */
    --p-table-th-color-text: #000;

    /* Force font family on code blocks as requested */
    pre, code, .prose-ui-code-block-wrapper {
      font-family: var(--p-font-family-mono) !important;
    }
    
    /* Specific override for inline code text color to #0d0d0d */
    :not(pre) > code {
       color: #0d0d0d !important;
    }

    /* Specific override for Table Headers to be #000 */
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

    /* 
       Syntax Highlighting Mapping (rehype-highlight -> Prose UI) 
       Mapping standard hljs classes to the Prose UI syntax variables defined above.
    */
    .hljs-comment, .hljs-quote { color: var(--p-color-text-muted); font-style: italic; }
    .hljs-doctag, .hljs-keyword, .hljs-formula { color: var(--p-color-text-syntax3); }
    .hljs-section, .hljs-name, .hljs-selector-tag, .hljs-deletion, .hljs-subst { color: var(--p-color-text-syntax1); }
    .hljs-literal { color: var(--p-color-text-syntax2); }
    .hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta-string { color: var(--p-color-text-syntax2); }
    .hljs-built_in, .hljs-class .hljs-title { color: var(--p-color-text-syntax4); }
    .hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-type, .hljs-selector-class, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-number { color: var(--p-color-text-syntax1); }
    .hljs-symbol, .hljs-bullet, .hljs-link, .hljs-meta, .hljs-selector-id, .hljs-title { color: var(--p-color-text-syntax4); }
    .hljs-emphasis { font-style: italic; }
    .hljs-strong { font-weight: bold; }

    code[class*=language-], pre[class*=language-], code.hljs {
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
`;

const preprocessLaTeX = (content) => {
  if (typeof content !== 'string') return content;
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$') // Convert \[ ... \] to $$ ... $$
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');   // Convert \( ... \) to $ ... $
};

const CustomPreBlock = ({ children }) => {
  const preRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Extract language from className of the code element (first child)
  // rehype-highlight adds 'language-xyz' class to the code element
  const codeElement = React.Children.toArray(children)[0];
  const className = codeElement?.props?.className || '';
  const match = /language-(\w+)/.exec(className);
  const language = match ? match[1] : 'text';

  const handleCopy = () => {
    if (preRef.current) {
      const text = preRef.current.innerText || "";
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="prose-ui-code-block-wrapper" style={{
      position: 'relative',
      borderRadius: 'var(--p-border-radius)',
      overflow: 'hidden',
      border: '1px solid var(--p-color-border)',
      marginBottom: '1.5em',
      marginTop: '1.5em'
    }}>
      <div className="code-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        background: 'rgb(246 248 250)',
        fontSize: '0.8rem',
        color: 'var(--p-color-text-muted)',
        fontFamily: 'var(--p-font-family-mono)'
      }}>
        <span style={{ fontWeight: 600 }}>{language}</span>
        <button
          onClick={handleCopy}
          className="d-flex align-items-center gap-1"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            padding: 0,
            fontSize: 'inherit'
          }}
        >
          {copied ? <Check sx={{ fontSize: 16 }} /> : <ContentCopyRounded sx={{ fontSize: 16 }} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div ref={preRef} style={{ margin: 0 }}>
        <pre className="px-4 py-2 m-0" style={{ border: 'none', borderRadius: 0, background: 'var(--p-code-block-color-bg)' }}>
          {children}
        </pre>
      </div>
    </div>
  );
};

function SystemResponse({ children }) {
  const isString = typeof children === 'string';
  const content = isString ? preprocessLaTeX(children) : children;

  return (
    <section className="d-flex w-100 justify-content-start">
      <SystemResponseWrapper className="prose-ui">
        {isString ? (
          <ReactMarkdown
            components={{
              ...mdxComponents,
              pre: CustomPreBlock
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
