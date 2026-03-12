import React, { useCallback } from 'react';
import { CodeEditor } from '@link-loom/react-sdk';
import styled from 'styled-components';

const EditorContainer = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

function DatasetResourceEditor({ content = {}, onChange, ui = {} }) {
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
        {ui?.title || 'Dataset'}
      </h6>

      <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: 12 }}>
        Define your dataset as a JSON structure. Arrays and objects are supported.
      </p>

      <CodeEditor
        language="json"
        defaultValue={JSON.stringify(content?.structured_data || {}, null, 2)}
        theme="vs-light"
        height="450px"
        onChange={handleJsonChange}
      />
    </EditorContainer>
  );
}

export default DatasetResourceEditor;
