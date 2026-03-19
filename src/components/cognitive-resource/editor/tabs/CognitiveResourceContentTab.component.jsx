import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';

import RichTextResourceEditor from '../content-editors/RichTextResourceEditor.component.jsx';
import ListResourceEditor from '../content-editors/ListResourceEditor.component.jsx';
import TaxonomyResourceEditor from '../content-editors/TaxonomyResourceEditor.component.jsx';
import DocumentResourceEditor from '../content-editors/DocumentResourceEditor.component.jsx';
import ReferenceResourceEditor from '../content-editors/ReferenceResourceEditor.component.jsx';
import DatasetResourceEditor from '../content-editors/DatasetResourceEditor.component.jsx';

const TabContainer = styled.section`
  padding: 24px 0;
`;

const EmptyState = styled.article`
  text-align: center;
  padding: 40px 20px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.85rem;
`;

const EDITOR_MAP = {
  text: RichTextResourceEditor,
  manual: RichTextResourceEditor,
  policy: RichTextResourceEditor,
  list: ListResourceEditor,
  taxonomy: TaxonomyResourceEditor,
  document: DocumentResourceEditor,
  reference: ReferenceResourceEditor,
  dataset: DatasetResourceEditor,
};

function CognitiveResourceContentTab({ resource = {}, onChange, ui = {} }) {
  const resourceType = resource.resource_type || '';
  const EditorComponent = EDITOR_MAP[resourceType.name];

  const handleContentChange = useCallback(
    (nextContent) => {
      if (!onChange) {
        return;
      }

      onChange({ ...resource, content: nextContent });
    },
    [resource, onChange],
  );

  if (!EditorComponent) {
    return (
      <TabContainer>
        <EmptyState>
          {resourceType
            ? `No editor available for type "${resourceType.title}"`
            : ui?.noTypeMessage || 'Select a resource type in the Overview tab to enable the content editor'}
        </EmptyState>
      </TabContainer>
    );
  }

  return (
    <TabContainer>
      <EditorComponent content={resource.content || {}} onChange={handleContentChange} ui={ui} />
    </TabContainer>
  );
}

export default CognitiveResourceContentTab;
