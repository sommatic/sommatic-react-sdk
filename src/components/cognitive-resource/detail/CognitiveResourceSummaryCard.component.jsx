import React from 'react';
import { Card, CardContent, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(() => ({
  borderRadius: '12px',
  height: '100%',
  boxShadow: 'none',
  border: '1px solid #E5E7EB',
}));

function CognitiveResourceSummaryCard({ resource = {}, ui = {} }) {
  if (!resource) {
    return null;
  }

  const governance = resource.governance || {};
  const tags = resource.tags || [];

  return (
    <StyledCard>
      <CardContent>
        <h5 className="fw-bold mb-2">{ui?.summaryTitle || 'Summary'}</h5>
        <section className="row">
          <article className="col-12 mb-3">
            <h6 className="text-muted small m-0">Description:</h6>
            <p className="m-0 text-dark small">
              {resource.description || 'No description provided. Add a brief description to help others understand this resource.'}
            </p>
          </article>
          <article className="col-6 mb-2">
            <h6 className="text-muted small m-0">Language:</h6>
            <p className="text-dark fw-medium small m-0">{resource.language || '—'}</p>
          </article>
          <article className="col-6 mb-2">
            <h6 className="text-muted small m-0">Authoritative:</h6>
            <p className="text-dark fw-medium small m-0">{governance.is_authoritative ? 'Yes' : 'No'}</p>
          </article>
          <article className="col-6 mb-2">
            <h6 className="text-muted small m-0">Visibility:</h6>
            <p className="text-dark fw-medium small m-0">{governance.visibility_scope || '—'}</p>
          </article>
          <article className="col-6 mb-2">
            <h6 className="text-muted small m-0">Version:</h6>
            <p className="text-dark fw-medium small m-0">{resource.version || '—'}</p>
          </article>
          {tags.length > 0 && (
            <article className="col-12 mt-1">
              <h6 className="text-muted small m-0 mb-1">Tags:</h6>
              <div className="d-flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '11px',
                      bgcolor: '#F9FAFB',
                      color: '#4B5563',
                      border: '1px solid #E5E7EB',
                    }}
                  />
                ))}
              </div>
            </article>
          )}
        </section>
      </CardContent>
    </StyledCard>
  );
}

export default CognitiveResourceSummaryCard;
