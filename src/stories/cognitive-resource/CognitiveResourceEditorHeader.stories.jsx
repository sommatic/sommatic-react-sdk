import React from 'react';
import CognitiveResourceEditorHeader from '@components/cognitive-resource/editor/CognitiveResourceEditorHeader.component';

export default {
  title: 'Cognitive Resource/Editor/CognitiveResourceEditorHeader',
  component: CognitiveResourceEditorHeader,
  parameters: {
    layout: 'padded',
  },
};

export const Default = () => (
  <CognitiveResourceEditorHeader
    resource={{
      name: 'Claims Processing Policy',
      resource_type: 'policy',
      status: 'draft',
    }}
    isDirty={false}
    isSaving={false}
    onSave={() => console.log('Save')}
    onPublish={() => console.log('Publish')}
  />
);

export const UnsavedChanges = () => (
  <CognitiveResourceEditorHeader
    resource={{
      name: 'Claims Processing Policy',
      resource_type: 'policy',
      status: 'active',
    }}
    isDirty={true}
    isSaving={false}
    onSave={() => console.log('Save')}
    onPublish={() => console.log('Publish')}
  />
);

export const Saving = () => (
  <CognitiveResourceEditorHeader
    resource={{
      name: 'Claims Processing Policy',
      resource_type: 'taxonomy',
      status: 'draft',
    }}
    isDirty={true}
    isSaving={true}
    onSave={() => {}}
    onPublish={() => {}}
  />
);

export const WithBackButton = () => (
  <CognitiveResourceEditorHeader
    resource={{
      name: 'Standard Operating Procedures Manual',
      resource_type: 'manual',
      status: 'active',
    }}
    isDirty={false}
    onSave={() => console.log('Save')}
    onPublish={() => console.log('Publish')}
    onBack={() => console.log('Back')}
  />
);
