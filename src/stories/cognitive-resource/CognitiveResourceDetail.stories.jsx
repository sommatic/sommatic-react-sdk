import React from 'react';
import CognitiveResourceDetail from '@components/cognitive-resource/detail/CognitiveResourceDetail.component';

export default {
  title: 'Cognitive Resource/Detail/CognitiveResourceDetail',
  component: CognitiveResourceDetail,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

const mockResource = {
  id: 'kr-001',
  name: 'Claims Processing Policy',
  slug: 'claims-processing-policy',
  description: 'Standard operating procedures for insurance claims processing across all departments.',
  resource_type: 'policy',
  status: 'active',
  version: '2.1.0',
  language: 'en',
  tags: ['claims', 'insurance', 'policy', 'sop'],
  updated_at: '2024-03-10T14:30:00Z',
  content: {
    format: 'markdown',
    text: '# Claims Processing Policy\n\nAll claims must be reviewed within 48 hours of submission.\n\n## Priority Classification\n\n- **High**: Property damage > $50,000\n- **Medium**: Vehicle claims\n- **Low**: Minor incidents',
  },
  governance: {
    owner_user_id: 'user-123',
    owner_team_id: 'team-compliance',
    visibility_scope: 'organization',
    review_status: 'approved',
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
    { id: 'b-1', target_type: 'workflow', target_id: 'wf-claims', role: 'policy', mode: 'context', status: 'active' },
    { id: 'b-2', target_type: 'workflow', target_id: 'wf-intake', role: 'knowledge', mode: 'retrieval', status: 'active' },
    { id: 'b-3', target_type: 'agent-profile', target_id: 'agent-reviewer', role: 'instructions', mode: 'instruction', status: 'active' },
  ],
};

export const FullDetail = () => (
  <CognitiveResourceDetail
    entitySelected={mockResource}
    onEvent={(e) => console.log('Event:', e)}
    apiKey="demo-key"
    environment="development"
  />
);

export const MinimalResource = () => (
  <CognitiveResourceDetail
    entitySelected={{
      id: 'kr-002',
      name: 'Simple Text Resource',
      resource_type: 'text',
      status: 'draft',
      content: { format: 'markdown', text: '' },
      governance: {},
      capabilities: {},
      bindings: [],
    }}
    onEvent={(e) => console.log('Event:', e)}
    apiKey="demo-key"
    environment="development"
  />
);
