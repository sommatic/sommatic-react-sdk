import React, { useState } from 'react';
import DocumentResourceEditor from '@components/cognitive-resource/editor/content-editors/DocumentResourceEditor.component';

export default {
  title: 'Cognitive Resource/Content Editors/DocumentResourceEditor',
  component: DocumentResourceEditor,
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
  const [content, setContent] = useState({ format: 'file-reference', file_ref: {} });
  return <DocumentResourceEditor content={content} onChange={setContent} />;
};

export const WithFile = () => {
  const [content, setContent] = useState({
    format: 'file-reference',
    file_ref: {
      file_name: 'claims-processing-manual.pdf',
      file_type: 'application/pdf',
      file_size: 2457600,
      storage_url: 'https://storage.sommatic.ai/docs/claims-processing-manual.pdf',
    },
  });
  return <DocumentResourceEditor content={content} onChange={setContent} />;
};
