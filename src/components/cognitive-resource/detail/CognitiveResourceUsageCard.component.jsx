import React from 'react';
import { Card, CardContent, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

const StyledCard = styled(Card)(() => ({
  borderRadius: '12px',
  height: '100%',
  boxShadow: 'none',
  border: '1px solid #E5E7EB',
}));

function CognitiveResourceUsageCard({ resource = {}, ui = {} }) {
  if (!resource) {
    return null;
  }

  const capabilities = resource.capabilities || {};
  const modes = capabilities.allowed_usage_modes || [];

  const flags = [
    { label: 'Searchable', value: capabilities.is_searchable },
    { label: 'Bindable', value: capabilities.is_bindable },
    { label: 'Executable Reference', value: capabilities.is_executable_reference },
    { label: 'Version Locked', value: capabilities.is_version_locked },
  ];

  return (
    <StyledCard>
      <CardContent>
        <h5 className="fw-bold mb-2">{ui?.usageTitle || 'Usage & Capabilities'}</h5>

        {modes.length > 0 && (
          <section className="mb-3">
            <h6 className="text-muted small mb-1">Usage Modes</h6>
            <div className="d-flex flex-wrap gap-1">
              {modes.map((mode) => (
                <Chip
                  key={mode}
                  label={mode}
                  size="small"
                  sx={{
                    fontSize: '11px',
                    height: 22,
                    backgroundColor: '#F5F3FF',
                    color: '#6D28D9',
                  }}
                />
              ))}
            </div>
          </section>
        )}

        <h6 className="text-muted small mb-1">Flags</h6>
        {flags.map((flag) => (
          <div key={flag.label} className="d-flex align-items-center gap-2 py-1 small text-dark">
            {flag.value ? (
              <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#30BBB7' }} />
            ) : (
              <CancelOutlinedIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
            )}
            {flag.label}
          </div>
        ))}
      </CardContent>
    </StyledCard>
  );
}

export default CognitiveResourceUsageCard;
