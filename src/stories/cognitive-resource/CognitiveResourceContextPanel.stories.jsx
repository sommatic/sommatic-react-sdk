import React, { useState } from 'react';
import CognitiveResourceContextPanel from '@components/cognitive-resource/editor/CognitiveResourceContextPanel.component';

export default {
  title: 'Cognitive Resource/Editor/CognitiveResourceContextPanel',
  component: CognitiveResourceContextPanel,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240, height: 600, border: '1px solid #e5e7eb' }}>
        <Story />
      </div>
    ),
  ],
};

export const Default = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <CognitiveResourceContextPanel
      resource={{
        name: 'Claims Processing Policy',
        slug: 'claims-processing-policy',
        resource_type: 'policy',
        status: 'active',
        version: '2.1.0',
        language: 'en',
        tags: ['claims', 'insurance', 'policy'],
      }}
      bindings={[{ id: '1' }, { id: '2' }, { id: '3' }]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};

export const Empty = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <CognitiveResourceContextPanel
      resource={{
        name: 'Untitled Resource',
        resource_type: 'text',
        status: 'draft',
      }}
      bindings={[]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};
