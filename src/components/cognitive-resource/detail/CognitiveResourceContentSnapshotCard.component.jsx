import React from 'react';
import { Card, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(() => ({
  borderRadius: '12px',
  height: '100%',
  boxShadow: 'none',
  border: '1px solid #E5E7EB',
}));

const ContentPreview = styled('section')(() => ({
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '14px',
  fontSize: '0.8rem',
  color: '#4b5563',
  lineHeight: 1.5,
  maxHeight: '200px',
  overflowY: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}));

function renderSnapshot(resource) {
  const content = resource.content || {};
  const rawType = resource.resource_type || '';
  const resourceType = typeof rawType === 'string' ? rawType : rawType.name || '';

  if (['text', 'manual', 'policy'].includes(resourceType)) {
    const text = content.text || '';
    if (!text) {
      return <p className="text-muted small fst-italic m-0">No content written yet</p>;
    }

    const preview = text.length > 300 ? text.substring(0, 300) + '...' : text;
    return (
      <section>
        <ContentPreview>{preview}</ContentPreview>
        <span className="d-block small text-muted mt-1">
          Format: {content.format || 'markdown'} &middot; {text.length} characters
        </span>
      </section>
    );
  }

  if (resourceType === 'list') {
    const items = content.structured_data?.items || [];
    if (items.length === 0) {
      return <p className="text-muted small fst-italic m-0">No items defined</p>;
    }

    return (
      <section>
        <ContentPreview>
          {items.slice(0, 5).map((item, i) => (
            <div key={i}>{item.value || item.key || `Item ${i + 1}`}</div>
          ))}
          {items.length > 5 && (
            <div style={{ color: '#9ca3af' }}>...and {items.length - 5} more</div>
          )}
        </ContentPreview>
        <span className="d-block small text-muted mt-1">{items.length} item(s)</span>
      </section>
    );
  }

  if (resourceType === 'taxonomy') {
    const categories = content.structured_data?.categories || [];
    if (categories.length === 0) {
      return <p className="text-muted small fst-italic m-0">No categories defined</p>;
    }

    const subcategoryCount = categories.reduce(
      (sum, cat) => sum + (Array.isArray(cat.subcategories) ? cat.subcategories.length : 0),
      0
    );

    return (
      <section>
        <ContentPreview>
          {categories.slice(0, 6).map((cat, i) => (
            <div key={i} style={{ marginBottom: i < categories.length - 1 ? 6 : 0 }}>
              <strong>{cat.name || `Category ${i + 1}`}</strong>
              {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 && (
                <div style={{ paddingLeft: 12, color: '#6B7280', fontSize: '0.75rem' }}>
                  {cat.subcategories.map((sub) => sub.name || sub).join(', ')}
                </div>
              )}
            </div>
          ))}
          {categories.length > 6 && (
            <div style={{ color: '#9ca3af', marginTop: 4 }}>...and {categories.length - 6} more</div>
          )}
        </ContentPreview>
        <span className="d-block small text-muted mt-1">
          {categories.length} category(ies), {subcategoryCount} subcategory(ies)
        </span>
      </section>
    );
  }

  if (resourceType === 'document') {
    const fileRef = content.file_ref || {};
    if (!fileRef.file_name) {
      return <p className="text-muted small fst-italic m-0">No file attached</p>;
    }

    const sizeKB = fileRef.file_size ? (fileRef.file_size / 1024).toFixed(1) : '—';
    return (
      <ContentPreview>
        <strong>{fileRef.file_name}</strong>
        <br />
        <span style={{ color: '#6B7280' }}>
          {fileRef.file_type || 'Unknown'} &middot; {sizeKB} KB
        </span>
      </ContentPreview>
    );
  }

  if (resourceType === 'reference') {
    const url = content.url || '';
    const structuredData = content.structured_data || {};
    const hasData = Object.keys(structuredData).length > 0;
    if (!url && !hasData) {
      return <p className="text-muted small fst-italic m-0">No reference data</p>;
    }

    return (
      <ContentPreview>
        {url && (
          <div style={{ marginBottom: hasData ? 6 : 0 }}>
            <span style={{ color: '#6B7280', fontWeight: 600, fontSize: '0.7rem' }}>URL: </span>
            <span style={{ wordBreak: 'break-all' }}>{url}</span>
          </div>
        )}
        {hasData && (
          <div>
            <span style={{ color: '#6B7280', fontWeight: 600, fontSize: '0.7rem' }}>Structured Data: </span>
            <span>{Object.keys(structuredData).join(', ')}</span>
          </div>
        )}
      </ContentPreview>
    );
  }

  if (resourceType === 'dataset') {
    const data = content.structured_data || {};
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return <p className="text-muted small fst-italic m-0">No dataset structure</p>;
    }

    return (
      <section>
        <ContentPreview>{JSON.stringify(data, null, 2).substring(0, 300)}</ContentPreview>
        <span className="d-block small text-muted mt-1">{keys.length} top-level key(s)</span>
      </section>
    );
  }

  return <p className="text-muted small fst-italic m-0">No content available</p>;
}

function CognitiveResourceContentSnapshotCard({ resource = {}, ui = {} }) {
  return (
    <StyledCard>
      <CardContent>
        <h5 className="fw-bold mb-2">{ui?.contentSnapshotTitle || 'Content Snapshot'}</h5>
        {renderSnapshot(resource)}
      </CardContent>
    </StyledCard>
  );
}

export default CognitiveResourceContentSnapshotCard;
