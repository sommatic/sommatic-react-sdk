import React, { useCallback } from 'react';
import { TextEditor, serializeToMarkdown } from '@link-loom/react-sdk';
import styled from 'styled-components';

const EditorContainer = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const TOOLBAR_OPTIONS = ['undo', 'heading', 'bold', 'italic', 'underline', 'list', 'blockquote', 'link', 'image'];

function RichTextResourceEditor({ content = {}, onChange, ui = {} }) {
  const toolbarOptions = ui?.toolbarOptions || TOOLBAR_OPTIONS;

  const handleModelChange = useCallback(
    ({ model, modelText, json }) => {
      if (!onChange) {
        return;
      }

      const markdownContent = serializeToMarkdown(json);

      onChange({
        ...content,
        format: 'markdown',
        text: markdownContent,
      });
    },
    [content, onChange]
  );

  const encodedContent = content?.text ? encodeURIComponent(content.text) : '';

  return (
    <EditorContainer>
      <TextEditor
        id="knowledge-resource-rich-editor"
        modelraw={encodedContent}
        onModelChange={handleModelChange}
        outputFormat="markdown"
        toolbarOptions={toolbarOptions}
        minRows={15}
        autoGrow
      />
    </EditorContainer>
  );
}

export default RichTextResourceEditor;
