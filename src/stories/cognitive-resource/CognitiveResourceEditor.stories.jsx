import React, { useState } from 'react';
import CognitiveResourceEditor from '@components/cognitive-resource/editor/CognitiveResourceEditor.component';

export default {
  title: 'Cognitive Resource/Editor/CognitiveResourceEditor',
  component: CognitiveResourceEditor,
  parameters: {
    layout: 'fullscreen',
  },
};

const mockResource = {
  id: 'kr-001',
  name: 'Claims Processing Policy',
  slug: 'claims-processing-policy',
  description: 'Standard operating procedures for insurance claims processing across all departments.',
  resource_type: 'policy',
  status: 'draft',
  version: '1.0.0',
  language: 'en',
  tags: ['claims', 'insurance', 'policy', 'sop'],
  content: {
    format: 'markdown',
    text: '# Claims Processing Policy\n\nAll claims must be reviewed within 48 hours of submission.\n\n## Priority Classification\n\n- **High**: Property damage > $50,000\n- **Medium**: Vehicle claims\n- **Low**: Minor incidents',
  },
  governance: {
    owner_user_id: 'user-123',
    owner_team_id: 'team-compliance',
    visibility_scope: 'organization',
    review_status: 'pending',
    is_authoritative: true,
    effective_from: '2024-01-01',
    expires_at: '2025-12-31',
  },
  capabilities: {
    allowed_usage_modes: ['retrieval', 'context'],
    is_searchable: true,
    is_bindable: true,
    is_executable_reference: false,
    is_version_locked: false,
  },
  bindings: [
    {
      id: 'bind-001',
      target_type: 'workflow',
      target_id: 'wf-claims-intake',
      role: 'policy',
      mode: 'context',
      status: 'active',
    },
    {
      id: 'bind-002',
      target_type: 'agent-profile',
      target_id: 'agent-claims-reviewer',
      role: 'instructions',
      mode: 'instruction',
      status: 'active',
    },
  ],
};

export const FullEditor = () => {
  const handleEvent = (event) => {
    console.log('Editor event:', event);
  };

  return (
    <div style={{ height: '100vh' }}>
      <CognitiveResourceEditor
        entitySelected={mockResource}
        onEvent={handleEvent}
        apiKey="demo-key"
        environment="development"
      />
    </div>
  );
};

export const EmptyResource = () => {
  const handleEvent = (event) => {
    console.log('Editor event:', event);
  };

  return (
    <div style={{ height: '100vh' }}>
      <CognitiveResourceEditor
        entitySelected={{ resource_type: 'text', status: 'draft', content: {} }}
        onEvent={handleEvent}
        apiKey="demo-key"
        environment="development"
      />
    </div>
  );
};

export const TaxonomyEditor = () => {
  const taxonomyResource = {
    ...mockResource,
    id: 'kr-002',
    name: 'Claims Categories',
    slug: 'claims-categories',
    resource_type: 'taxonomy',
    content: {
      format: 'json',
      structured_data: {
        categories: [
          {
            name: 'Auto Claims',
            description: 'Vehicle-related insurance claims',
            subcategories: [
              { name: 'Collision', description: 'Vehicle collision damage' },
              { name: 'Theft', description: 'Vehicle theft or break-in' },
            ],
          },
          {
            name: 'Property Claims',
            description: 'Home and building insurance claims',
            subcategories: [
              { name: 'Fire', description: 'Fire damage to property' },
              { name: 'Water', description: 'Water damage or flooding' },
            ],
          },
        ],
      },
    },
    bindings: [],
  };

  return (
    <div style={{ height: '100vh' }}>
      <CognitiveResourceEditor
        entitySelected={taxonomyResource}
        onEvent={(e) => console.log('Event:', e)}
        apiKey="demo-key"
        environment="development"
      />
    </div>
  );
};

export const PopupContext = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Editor closed.</p>
        <button onClick={() => setIsOpen(true)}>Reopen</button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh' }}>
      <CognitiveResourceEditor
        entitySelected={mockResource}
        onEvent={(e) => console.log('Event:', e)}
        isPopupContext={true}
        setIsOpen={setIsOpen}
        apiKey="demo-key"
        environment="development"
      />
    </div>
  );
};
