import React, { useState } from 'react';
import { Typography, Button, Tabs, Tab, Box } from '@mui/material';
import { PlayArrow as ExecuteIcon, Code as CodeIcon } from '@mui/icons-material';
import { CodeEditor } from '@link-loom/react-sdk';

function NodeConfigCenterPanelComponent({ node, data = {}, onChange }) {
  // UI States
  const [tabIndex, setTabIndex] = useState(0);

  // Component Functions
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const IconComponent = node?.icon || node?.data?.Icon || CodeIcon;

  return (
    <div className="col-lg-6 col-12 d-flex flex-column" style={{ backgroundColor: '#2B2B2B', overflow: 'hidden' }}>
      {/* Node Header */}
      <div className="px-3 pt-3 pb-0 flex-shrink-0">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div style={{ display: 'grid', placeItems: 'center', width: 20, height: 20 }}>
              <IconComponent sx={{ color: '#FF6F5C', fontSize: 20 }} />
            </div>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#FFFFFF', fontSize: '0.95rem' }}>
              {node.label || node.data?.title || node.id}
            </Typography>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="contained"
              size="small"
              startIcon={<ExecuteIcon sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: '#FF6F5C',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '4px',
                boxShadow: 'none',
                fontSize: '0.75rem',
                px: 1.5,
                minHeight: '28px',
                '&:hover': { bgcolor: '#E05D4E' },
              }}
            >
              Execute step
            </Button>
          </div>
        </div>

        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            minHeight: '32px',
            '& .MuiTab-root': {
              color: '#9E9E9E',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              minHeight: '32px',
              pb: 0.5,
              pt: 0,
            },
            '& .Mui-selected': { color: '#FF6F5C' },
            '& .MuiTabs-indicator': { backgroundColor: '#FF6F5C', height: '2px', borderRadius: '2px 2px 0 0' },
          }}
        >
          <Tab label="Config (Parameters)" disableRipple />
          <Tab label="Ports (Settings)" disableRipple />
        </Tabs>
      </div>

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // Editor handles scrolling
          p: 0,
        }}
      >
        {/* Parameters Tab Content: CONFIG */}
        {tabIndex === 0 && (
          <div className="flex-grow-1 d-flex flex-column">
            <CodeEditor
              language="json"
              value={data.config ? JSON.stringify(data.config, null, 2) : '{}'}
              defaultValue={data.config ? JSON.stringify(data.config, null, 2) : '{}'}
              onChange={(value) => {
                try {
                  const parsed = JSON.parse(value);
                  onChange('config', parsed);
                } catch (e) {
                  // ignore
                }
              }}
              height="100%"
            />
          </div>
        )}

        {/* Settings Tab Content: PORTS */}
        {tabIndex === 1 && (
          <div className="flex-grow-1 d-flex flex-column">
            <CodeEditor
              language="json"
              value={data.ports ? JSON.stringify(data.ports, null, 2) : '[]'}
              defaultValue={data.ports ? JSON.stringify(data.ports, null, 2) : '[]'}
              onChange={(value) => {
                try {
                  const parsed = JSON.parse(value);
                  onChange('ports', parsed);
                } catch (e) {
                  // ignore
                }
              }}
              height="100%"
            />
          </div>
        )}
      </Box>
    </div>
  );
}

export default NodeConfigCenterPanelComponent;
