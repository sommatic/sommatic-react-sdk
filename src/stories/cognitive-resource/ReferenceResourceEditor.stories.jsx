import React, { useState } from 'react';
import ReferenceResourceEditor from '@components/cognitive-resource/editor/content-editors/ReferenceResourceEditor.component';

export default {
  title: 'Cognitive Resource/Content Editors/ReferenceResourceEditor',
  component: ReferenceResourceEditor,
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
  const [content, setContent] = useState({ format: 'json', url: '', structured_data: {} });
  return <ReferenceResourceEditor content={content} onChange={setContent} />;
};

export const WithData = () => {
  const [content, setContent] = useState({
    format: 'json',
    url: 'https://api.example.com/standards/iso-9001',
    structured_data: {
      standard: 'ISO 9001:2015',
      scope: 'Quality management systems',
      last_reviewed: '2024-01-15',
    },
  });
  return <ReferenceResourceEditor content={content} onChange={setContent} />;
};
