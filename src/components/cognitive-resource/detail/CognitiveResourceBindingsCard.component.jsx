import React from 'react';
import { Card, CardContent, Chip, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link as LinkIcon } from '@mui/icons-material';

const StyledCard = styled(Card)(() => ({
  borderRadius: '12px',
  height: '100%',
  boxShadow: 'none',
  border: '1px solid #E5E7EB',
}));

function CognitiveResourceBindingsCard({ bindings = [], ui = {} }) {
  const grouped = (bindings || []).reduce((acc, binding) => {
    const type = binding.target_type || 'unknown';
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type] += 1;
    return acc;
  }, {});

  const entries = Object.entries(grouped);

  return (
    <StyledCard>
      <CardContent>
        <h5 className="fw-bold mb-2">{ui?.bindingsTitle || 'Bindings'}</h5>

        {entries.length === 0 ? (
          <p className="text-muted small fst-italic m-0">No bindings configured</p>
        ) : (
          <List dense disablePadding>
            {entries.map(([targetType, count], index) => (
              <React.Fragment key={targetType}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LinkIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <span className="small fw-medium text-dark" style={{ textTransform: 'capitalize' }}>
                        {targetType.replace(/-/g, ' ')}
                      </span>
                    }
                  />
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '10px',
                      bgcolor: '#F3F4F6',
                      color: '#374151',
                    }}
                  />
                </ListItem>
                {index < entries.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}

        <p className="small text-muted m-0 mt-2">{bindings.length} total binding(s)</p>
      </CardContent>
    </StyledCard>
  );
}

export default CognitiveResourceBindingsCard;
