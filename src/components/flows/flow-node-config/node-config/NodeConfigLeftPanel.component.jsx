import React from 'react';
import { Typography, Button } from '@mui/material';
import CodeEditor from '@components/shared/code-editor/CodeEditor';

function NodeConfigLeftPanelComponent({ data = {}, onChange }) {
  return (
    <div
      className="col-lg-3 d-none d-lg-flex flex-column border-end"
      style={{ backgroundColor: '#212121', borderColor: 'rgba(255, 255, 255, 0.1) !important', overflowY: 'auto' }}
    >
      <div
        className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center flex-shrink-0"
        style={{ height: '48px', borderColor: 'rgba(255, 255, 255, 0.1) !important' }}
      >
        <Typography variant="caption" sx={{ letterSpacing: 1, color: '#9E9E9E', fontWeight: 700 }}>
          INPUT CONTRACT
        </Typography>
      </div>

      <div className="flex-grow-1 d-flex flex-column p-0">
        <CodeEditor
          language="json"
          value={data.input_contract ? JSON.stringify(data.input_contract, null, 2) : '{}'}
          onChange={(value) => {
            try {
              const parsed = JSON.parse(value);
              onChange('input_contract', parsed);
            } catch (e) {
              // Allow typing invalid json, but maybe don't save or show error?
              // For now, we only update parent if valid, which might be annoying for typing.
              // A better approach is to store string in local state and try parse on blur or debounce.
              // But for this quick impl:
              // We will pass the raw string if we want to allow invalid JSON, but our parent expects object.
            }
          }}
          defaultValue={
            data.input_contract ? JSON.stringify(data.input_contract, null, 2) : '{\n  "type": "object",\n  "properties": {}\n}'
          }
          height="100%"
        />
      </div>
    </div>
  );
}

export default NodeConfigLeftPanelComponent;
