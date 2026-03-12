import React, { useState } from 'react';
import RichTextResourceEditor from '@components/cognitive-resource/editor/content-editors/RichTextResourceEditor.component';
import { BrowserRouter } from 'react-router-dom';

export default {
  title: 'Cognitive Resource/Content Editors/RichTextResourceEditor',
  component: RichTextResourceEditor,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export const Empty = () => {
  const [content, setContent] = useState({ format: 'markdown', text: '' });
  return <RichTextResourceEditor content={content} onChange={setContent} />;
};

export const WithContent = () => {
  const [content, setContent] = useState({
    format: 'markdown',
    text: '# Claims Triage Manual\n\nThis document describes the standard operating procedure for triaging incoming insurance claims.\n\n## Categories\n\n- **Auto**: Vehicle-related claims\n- **Property**: Home and building claims\n- **Health**: Medical and wellness claims\n\n## Process\n\n1. Review claim submission\n2. Classify by category\n3. Assign priority level\n4. Route to appropriate handler',
  });
  return <RichTextResourceEditor content={content} onChange={setContent} />;
};
