import React, { useCallback, useRef } from 'react';
import { TextField } from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import styled from 'styled-components';

const EditorContainer = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

const DropZone = styled.section`
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;

  &:hover {
    border-color: #3a2e4f;
    background: #faf5ff;
  }
`;

const FileCard = styled.article`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const FileIcon = styled.section`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ede9fe;
  border-radius: 8px;
`;

function DocumentResourceEditor({ content = {}, onChange, ui = {} }) {
  const fileInputRef = useRef(null);
  const fileRef = content?.file_ref || {};
  const hasFile = fileRef?.file_name || fileRef?.storage_url;

  const handleFileSelect = useCallback(
    (event) => {
      const file = event.target.files?.[0];

      if (!file || !onChange) {
        return;
      }

      onChange({
        ...content,
        format: 'file-reference',
        file_ref: {
          ...fileRef,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        },
      });
    },
    [content, fileRef, onChange]
  );

  const handleMetadataChange = useCallback(
    (field, value) => {
      if (!onChange) {
        return;
      }

      onChange({
        ...content,
        format: 'file-reference',
        file_ref: {
          ...fileRef,
          [field]: value,
        },
      });
    },
    [content, fileRef, onChange]
  );

  const handleRemoveFile = useCallback(() => {
    if (!onChange) {
      return;
    }

    onChange({
      ...content,
      format: 'file-reference',
      file_ref: {},
    });
  }, [content, onChange]);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];

      if (!file || !onChange) {
        return;
      }

      onChange({
        ...content,
        format: 'file-reference',
        file_ref: {
          ...fileRef,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        },
      });
    },
    [content, fileRef, onChange]
  );

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return '';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <EditorContainer>
      <h6 className="mb-3" style={{ color: '#374151', fontWeight: 600 }}>
        {ui?.title || 'Document'}
      </h6>

      {hasFile ? (
        <>
          <FileCard>
            <FileIcon>
              <InsertDriveFileOutlinedIcon sx={{ fontSize: 24, color: '#3A2E4F' }} />
            </FileIcon>
            <section className="flex-grow-1">
              <div style={{ fontWeight: 500, color: '#1F2937' }}>{fileRef.file_name || 'Unnamed file'}</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                {fileRef.file_type || 'Unknown type'}
                {fileRef.file_size ? ` \u00B7 ${formatFileSize(fileRef.file_size)}` : ''}
              </div>
            </section>
            <button
              className="btn btn-sm"
              style={{ color: '#FB7185', border: '1px solid #FECDD3' }}
              onClick={handleRemoveFile}
            >
              <DeleteOutlineIcon sx={{ fontSize: 16 }} /> Remove
            </button>
          </FileCard>

          <div className="row g-3">
            <div className="col-md-6">
              <TextField
                label="Storage URL"
                value={fileRef.storage_url || ''}
                onChange={(e) => handleMetadataChange('storage_url', e.target.value)}
                size="small"
                fullWidth
                placeholder="https://storage.example.com/file"
              />
            </div>
            <div className="col-md-6">
              <TextField
                label="Source mode"
                value={content?.source?.sync_mode || 'manual'}
                size="small"
                fullWidth
                disabled
              />
            </div>
          </div>
        </>
      ) : (
        <DropZone
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: '#9CA3AF', marginBottom: 1 }} />
          <p style={{ color: '#6B7280', margin: '8px 0 4px' }}>Drop a file here or click to browse</p>
          <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: 0 }}>Supported formats: PDF, DOCX, TXT, CSV, JSON</p>
        </DropZone>
      )}

      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
    </EditorContainer>
  );
}

export default DocumentResourceEditor;
