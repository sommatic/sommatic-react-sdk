import React from 'react';
import { Typography } from '@mui/material';

import CodeEditor from '@components/shared/code-editor/CodeEditor';

function NodeConfigRightPanelComponent({ data = {}, onChange }) {
  return (
    <div
      className="col-lg-3 d-none d-lg-flex flex-column border-start"
      style={{ backgroundColor: '#212121', borderColor: 'rgba(255, 255, 255, 0.1) !important', overflowY: 'auto' }}
    >
      <div
        className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center flex-shrink-0"
        style={{ height: '48px', borderColor: 'rgba(255, 255, 255, 0.1) !important' }}
      >
        <Typography variant="caption" sx={{ letterSpacing: 1, color: '#9E9E9E', fontWeight: 700 }}>
          OUTPUT CONTRACT
        </Typography>
      </div>

      <div className="flex-grow-1 d-flex flex-column p-0">
        <CodeEditor
          language="json"
          value={data.output_contract ? JSON.stringify(data.output_contract, null, 2) : '{}'}
          onChange={(value) => {
            try {
              const parsed = JSON.parse(value);
              onChange('output_contract', parsed);
            } catch (e) {
              // See note in LeftPanel about error handling
            }
          }}
          defaultValue={
            data.output_contract ? JSON.stringify(data.output_contract, null, 2) : '{\n  "type": "object",\n  "properties": {}\n}'
          }
          height="100%"
        />
      </div>
    </div>
  );
}

export default NodeConfigRightPanelComponent;
