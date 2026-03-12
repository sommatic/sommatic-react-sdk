import React from 'react';
import CognitiveResourceQuickCreate from '@components/cognitive-resource/create/CognitiveResourceQuickCreate.component';

export default {
  title: 'Cognitive Resource/Create/CognitiveResourceQuickCreate',
  component: CognitiveResourceQuickCreate,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty = () => (
  <CognitiveResourceQuickCreate
    onEvent={(event) => console.log('Event:', event)}
    apiKey="demo-key"
    environment="development"
  />
);

export const WithPrefilledData = () => (
  <CognitiveResourceQuickCreate
    entitySelected={{
      name: 'Claims Processing Policy',
      slug: 'claims-processing-policy',
      description: 'Standard operating procedures for insurance claims.',
      resource_type: 'policy',
      tags: ['claims', 'insurance'],
    }}
    onEvent={(event) => console.log('Event:', event)}
    apiKey="demo-key"
    environment="development"
  />
);

export const PopupContext = () => (
  <CognitiveResourceQuickCreate
    onEvent={(event) => console.log('Event:', event)}
    isPopupContext={true}
    setIsOpen={(val) => console.log('setIsOpen:', val)}
    apiKey="demo-key"
    environment="development"
  />
);
