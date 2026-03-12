import React, { useState } from 'react';
import CognitiveResourceOverviewTab from '@components/cognitive-resource/editor/tabs/CognitiveResourceOverviewTab.component';
import CognitiveResourceContentTab from '@components/cognitive-resource/editor/tabs/CognitiveResourceContentTab.component';
import CognitiveResourceGovernanceTab from '@components/cognitive-resource/editor/tabs/CognitiveResourceGovernanceTab.component';
import CognitiveResourceUsageTab from '@components/cognitive-resource/editor/tabs/CognitiveResourceUsageTab.component';
import CognitiveResourceBindingsTab from '@components/cognitive-resource/editor/tabs/CognitiveResourceBindingsTab.component';

export default {
  title: 'Cognitive Resource/Editor/Tabs',
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

const baseMockResource = {
  id: 'kr-001',
  name: 'Claims Processing Policy',
  slug: 'claims-processing-policy',
  description: 'Standard operating procedures for insurance claims processing.',
  resource_type: 'policy',
  status: 'draft',
  version: '1.0.0',
  language: 'en',
  tags: ['claims', 'insurance'],
  content: {
    format: 'markdown',
    text: '# Claims Processing\n\nAll claims must be reviewed within 48 hours.',
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
};

export const OverviewTab = () => {
  const [resource, setResource] = useState({ ...baseMockResource });
  return <CognitiveResourceOverviewTab resource={resource} onChange={setResource} />;
};

export const ContentTab = () => {
  const [resource, setResource] = useState({ ...baseMockResource });
  return <CognitiveResourceContentTab resource={resource} onChange={setResource} />;
};

export const ContentTabList = () => {
  const [resource, setResource] = useState({
    ...baseMockResource,
    resource_type: 'list',
    content: {
      format: 'json',
      structured_data: {
        items: [
          { key: 'high', value: 'High', description: 'Immediate attention' },
          { key: 'medium', value: 'Medium', description: 'Standard processing' },
        ],
      },
    },
  });
  return <CognitiveResourceContentTab resource={resource} onChange={setResource} />;
};

export const GovernanceTab = () => {
  const [resource, setResource] = useState({ ...baseMockResource });
  return <CognitiveResourceGovernanceTab resource={resource} onChange={setResource} />;
};

export const UsageTab = () => {
  const [resource, setResource] = useState({ ...baseMockResource });
  return <CognitiveResourceUsageTab resource={resource} onChange={setResource} />;
};

export const BindingsTab = () => {
  const [bindings, setBindings] = useState([
    { id: 'b-1', target_type: 'workflow', target_id: 'wf-claims', role: 'policy', mode: 'context', status: 'active' },
    { id: 'b-2', target_type: 'agent-profile', target_id: 'agent-reviewer', role: 'instructions', mode: 'instruction', status: 'active' },
  ]);

  return (
    <CognitiveResourceBindingsTab
      resource={baseMockResource}
      bindings={bindings}
      onAddBinding={(binding) => setBindings((prev) => [...prev, { ...binding, id: `b-${prev.length + 1}` }])}
      onRemoveBinding={(_, index) => setBindings((prev) => prev.filter((__, i) => i !== index))}
    />
  );
};

export const BindingsTabEmpty = () => (
  <CognitiveResourceBindingsTab
    resource={baseMockResource}
    bindings={[]}
    onAddBinding={(b) => console.log('Add binding:', b)}
    onRemoveBinding={(b) => console.log('Remove binding:', b)}
  />
);
