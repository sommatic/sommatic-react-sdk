import React, { useState, useCallback } from 'react';
import { CodeEditor } from '@link-loom/react-sdk';
import { TextField, IconButton, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import styled from 'styled-components';

const EditorContainer = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

const RowCard = styled.article`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const RowActions = styled.section`
  display: flex;
  gap: 4px;
  align-items: center;
  padding-top: 4px;
`;

const EMPTY_ITEM = { key: '', value: '', description: '' };

function ListResourceEditor({ content = {}, onChange, ui = {} }) {
  const [viewMode, setViewMode] = useState('table');

  const items = content?.structured_data?.items || [];

  const updateItems = useCallback(
    (nextItems) => {
      if (!onChange) {
        return;
      }

      onChange({
        ...content,
        format: 'json',
        structured_data: {
          ...content?.structured_data,
          items: nextItems,
        },
      });
    },
    [content, onChange]
  );

  const handleItemChange = useCallback(
    (index, field, value) => {
      const nextItems = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      updateItems(nextItems);
    },
    [items, updateItems]
  );

  const handleAddRow = useCallback(() => {
    updateItems([...items, { ...EMPTY_ITEM }]);
  }, [items, updateItems]);

  const handleRemoveRow = useCallback(
    (index) => {
      updateItems(items.filter((_, i) => i !== index));
    },
    [items, updateItems]
  );

  const handleDuplicateRow = useCallback(
    (index) => {
      const duplicate = { ...items[index] };
      const nextItems = [...items];
      nextItems.splice(index + 1, 0, duplicate);
      updateItems(nextItems);
    },
    [items, updateItems]
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
        // Invalid JSON, ignore
      }
    },
    [content, onChange]
  );

  return (
    <EditorContainer>
      <header className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0" style={{ color: '#374151', fontWeight: 600 }}>
          {ui?.title || 'List Items'}
        </h6>
        <section className="d-flex gap-2 align-items-center">
          <Chip
            label="Table view"
            size="small"
            variant={viewMode === 'table' ? 'filled' : 'outlined'}
            onClick={() => setViewMode('table')}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="Structured JSON"
            size="small"
            variant={viewMode === 'json' ? 'filled' : 'outlined'}
            onClick={() => setViewMode('json')}
            sx={{ cursor: 'pointer' }}
          />
        </section>
      </header>

      {viewMode === 'table' ? (
        <section>
          {items.map((item, index) => (
            <RowCard key={index}>
              <section className="flex-grow-1">
                <div className="row g-2">
                  <div className="col-md-4">
                    <TextField
                      label="Key"
                      value={item.key || ''}
                      onChange={(e) => handleItemChange(index, 'key', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </div>
                  <div className="col-md-4">
                    <TextField
                      label="Value"
                      value={item.value || ''}
                      onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </div>
                  <div className="col-md-4">
                    <TextField
                      label="Description"
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </div>
                </div>
              </section>
              <RowActions>
                <IconButton size="small" onClick={() => handleDuplicateRow(index)} title="Duplicate">
                  <ContentCopyIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                </IconButton>
                <IconButton size="small" onClick={() => handleRemoveRow(index)} title="Remove">
                  <DeleteOutlineIcon sx={{ fontSize: 16, color: '#FB7185' }} />
                </IconButton>
              </RowActions>
            </RowCard>
          ))}

          <button className="btn btn-sm mt-2" style={{ color: '#3A2E4F', border: '1px dashed #3A2E4F' }} onClick={handleAddRow}>
            <AddIcon sx={{ fontSize: 16, marginRight: 0.5 }} /> Add row
          </button>
        </section>
      ) : (
        <CodeEditor
          language="json"
          defaultValue={JSON.stringify(content?.structured_data || { items: [] }, null, 2)}
          theme="vs-light"
          height="400px"
          onChange={handleJsonChange}
        />
      )}
    </EditorContainer>
  );
}

export default ListResourceEditor;
