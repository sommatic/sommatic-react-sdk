import React, { useCallback } from 'react';
import { CodeEditor } from '@link-loom/react-sdk';
import { TextField } from '@mui/material';
import styled from 'styled-components';

const EditorContainer = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

function ReferenceResourceEditor({ content = {}, onChange, ui = {} }) {
  const handleUrlChange = useCallback(
    (value) => {
      if (!onChange) {
        return;
      }

      onChange({
        ...content,
        url: value,
      });
    },
    [content, onChange]
  );

  const handleJsonChange = useCallback(
    (jsonString) => {
      try {
        const parsed = JSON.parse(jsonString);

        onChange({
          ...content,
          format: 'json',
          structured_data: parsed,
        });
      } catch {
        // Invalid JSON
      }
    },
    [content, onChange]
  );

  return (
    <EditorContainer>
      <h6 className="mb-3" style={{ color: '#374151', fontWeight: 600 }}>
        {ui?.title || 'Reference'}
      </h6>

      <div className="mb-3">
        <TextField
          label="URL"
          value={content?.url || ''}
          onChange={(e) => handleUrlChange(e.target.value)}
          size="small"
          fullWidth
          placeholder="https://example.com/resource"
        />
      </div>

      <h6 className="mb-2" style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>
        Structured data (optional)
      </h6>
      <CodeEditor
        language="json"
        defaultValue={JSON.stringify(content?.structured_data || {}, null, 2)}
        theme="vs-light"
        height="300px"
        onChange={handleJsonChange}
      />
    </EditorContainer>
  );
}

export default ReferenceResourceEditor;
