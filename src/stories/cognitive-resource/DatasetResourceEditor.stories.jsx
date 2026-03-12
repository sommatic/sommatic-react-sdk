import React, { useState } from 'react';
import DatasetResourceEditor from '@components/cognitive-resource/editor/content-editors/DatasetResourceEditor.component';

export default {
  title: 'Cognitive Resource/Content Editors/DatasetResourceEditor',
  component: DatasetResourceEditor,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty = () => {
  const [content, setContent] = useState({ format: 'json', structured_data: {} });
  return <DatasetResourceEditor content={content} onChange={setContent} />;
};

export const WithData = () => {
  const [content, setContent] = useState({
    format: 'json',
    structured_data: {
      schema: { version: '1.0', type: 'classification-dataset' },
      records: [
        { input: 'Water leak in basement', category: 'property', subcategory: 'water', priority: 'high' },
        { input: 'Fender bender in parking lot', category: 'auto', subcategory: 'collision', priority: 'medium' },
        { input: 'Routine dental checkup', category: 'health', subcategory: 'preventive', priority: 'low' },
      ],
    },
  });
  return <DatasetResourceEditor content={content} onChange={setContent} />;
};
