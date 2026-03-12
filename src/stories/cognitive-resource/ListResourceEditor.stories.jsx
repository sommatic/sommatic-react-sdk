import React, { useState } from 'react';
import ListResourceEditor from '@components/cognitive-resource/editor/content-editors/ListResourceEditor.component';

export default {
  title: 'Cognitive Resource/Content Editors/ListResourceEditor',
  component: ListResourceEditor,
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
  const [content, setContent] = useState({ format: 'json', structured_data: { items: [] } });
  return <ListResourceEditor content={content} onChange={setContent} />;
};

export const WithItems = () => {
  const [content, setContent] = useState({
    format: 'json',
    structured_data: {
      items: [
        { key: 'priority-high', value: 'High', description: 'Requires immediate attention' },
        { key: 'priority-medium', value: 'Medium', description: 'Standard processing time' },
        { key: 'priority-low', value: 'Low', description: 'Can be deferred' },
      ],
    },
  });
  return <ListResourceEditor content={content} onChange={setContent} />;
};
