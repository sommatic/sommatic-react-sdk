import React from 'react';
import styled from 'styled-components';

const PanelContainer = styled.section`
  background: #f9fafb;
  border-left: 1px solid #e5e7eb;
  padding: 16px;
`;

const PanelTitle = styled.h6`
  font-weight: 600;
  font-size: 0.8rem;
  color: #374151;
  margin: 0 0 12px 0;
`;

const PreviewCard = styled.article`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
  font-size: 0.8rem;
  color: #4b5563;
  line-height: 1.5;
`;

const EmptyState = styled.p`
  font-size: 0.8rem;
  color: #9ca3af;
  font-style: italic;
  margin: 0;
`;

const ContentSnippet = styled.section`
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.75rem;
  font-family: monospace;
  color: #374151;
  background: #f3f4f6;
  border-radius: 4px;
  padding: 10px;
  margin-top: 8px;
`;

function renderTextPreview(content) {
  const text = content?.text || '';
  if (!text) {
    return <EmptyState>No content yet</EmptyState>;
  }

  const preview = text.length > 500 ? text.substring(0, 500) + '...' : text;
  return <ContentSnippet>{preview}</ContentSnippet>;
}

function renderListPreview(content) {
  const items = content?.structured_data?.items || [];
  if (items.length === 0) {
    return <EmptyState>No items defined</EmptyState>;
  }

  return (
    <section>
      <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>{items.length} item(s)</span>
      <ul style={{ margin: '8px 0 0', paddingLeft: 16, fontSize: '0.75rem', color: '#374151' }}>
        {items.slice(0, 5).map((item, index) => (
          <li key={index}>{item.value || item.key || `Item ${index + 1}`}</li>
        ))}
        {items.length > 5 && <li style={{ color: '#9ca3af' }}>...and {items.length - 5} more</li>}
      </ul>
    </section>
  );
}

function renderTaxonomyPreview(content) {
  const categories = content?.structured_data?.categories || [];
  if (categories.length === 0) {
    return <EmptyState>No categories defined</EmptyState>;
  }

  const subcategoryCount = categories.reduce(
    (sum, cat) => sum + (Array.isArray(cat.subcategories) ? cat.subcategories.length : 0),
    0
  );

  return (
    <section>
      <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
        {categories.length} category(ies), {subcategoryCount} subcategory(ies)
      </span>
      <ul style={{ margin: '8px 0 0', paddingLeft: 16, fontSize: '0.75rem', color: '#374151' }}>
        {categories.slice(0, 4).map((cat, index) => (
          <li key={index}>
            {cat.name || `Category ${index + 1}`}
            {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 && (
              <span style={{ color: '#9ca3af' }}> ({cat.subcategories.length})</span>
            )}
          </li>
        ))}
        {categories.length > 4 && <li style={{ color: '#9ca3af' }}>...and {categories.length - 4} more</li>}
      </ul>
    </section>
  );
}

function renderDocumentPreview(content) {
  const fileRef = content?.file_ref || {};
  if (!fileRef.file_name) {
    return <EmptyState>No file attached</EmptyState>;
  }

  const sizeKB = fileRef.file_size ? (fileRef.file_size / 1024).toFixed(1) : '—';

  return (
    <section style={{ fontSize: '0.75rem', color: '#374151' }}>
      <strong>{fileRef.file_name}</strong>
      <br />
      <span style={{ color: '#6B7280' }}>{fileRef.file_type || 'Unknown type'} &middot; {sizeKB} KB</span>
    </section>
  );
}

function renderReferencePreview(content) {
  const url = content?.url || '';
  const dataKeys = Object.keys(content?.structured_data || {});

  if (!url && dataKeys.length === 0) {
    return <EmptyState>No reference data</EmptyState>;
  }

  return (
    <section style={{ fontSize: '0.75rem', color: '#374151' }}>
      {url && (
        <section className="mb-1">
          <span style={{ color: '#6B7280' }}>URL:</span>{' '}
          <span style={{ wordBreak: 'break-all' }}>{url}</span>
        </section>
      )}
      {dataKeys.length > 0 && (
        <span style={{ color: '#6B7280' }}>{dataKeys.length} field(s) defined</span>
      )}
    </section>
  );
}

function renderDatasetPreview(content) {
  const data = content?.structured_data || {};
  const keys = Object.keys(data);

  if (keys.length === 0) {
    return <EmptyState>No dataset structure</EmptyState>;
  }

  return (
    <section style={{ fontSize: '0.75rem', color: '#374151' }}>
      <span style={{ color: '#6B7280' }}>{keys.length} top-level key(s)</span>
      <ContentSnippet>{JSON.stringify(data, null, 2).substring(0, 300)}</ContentSnippet>
    </section>
  );
}

const PREVIEW_RENDERERS = {
  text: renderTextPreview,
  manual: renderTextPreview,
  policy: renderTextPreview,
  list: renderListPreview,
  taxonomy: renderTaxonomyPreview,
  document: renderDocumentPreview,
  reference: renderReferencePreview,
  dataset: renderDatasetPreview,
};

function CognitiveResourcePreviewPanel({ resource = {}, ui = {} }) {
  const resourceType = resource.resource_type || '';
  const renderer = PREVIEW_RENDERERS[resourceType];

  return (
    <PanelContainer>
      <PanelTitle>{ui?.previewTitle || 'Preview'}</PanelTitle>
      <PreviewCard>
        {renderer ? renderer(resource.content || {}) : <EmptyState>Select a resource type to see preview</EmptyState>}
      </PreviewCard>
    </PanelContainer>
  );
}

export default CognitiveResourcePreviewPanel;
