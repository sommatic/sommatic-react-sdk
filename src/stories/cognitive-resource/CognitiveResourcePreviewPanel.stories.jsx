import React from 'react';
import CognitiveResourcePreviewPanel from '@components/cognitive-resource/editor/CognitiveResourcePreviewPanel.component';

export default {
  title: 'Cognitive Resource/Editor/CognitiveResourcePreviewPanel',
  component: CognitiveResourcePreviewPanel,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, border: '1px solid #e5e7eb' }}>
        <Story />
      </div>
    ),
  ],
};

export const TextPreview = () => (
  <CognitiveResourcePreviewPanel
    resource={{
      resource_type: 'text',
      content: {
        text: '# Claims Processing Policy\n\nAll claims must be reviewed within 48 hours of submission.\n\n## Priority Classification\n\n- High: Property damage > $50,000\n- Medium: Vehicle claims\n- Low: Minor incidents',
      },
    }}
  />
);

export const ListPreview = () => (
  <CognitiveResourcePreviewPanel
    resource={{
      resource_type: 'list',
      content: {
        structured_data: {
          items: [
            { key: 'high', value: 'High Priority', description: 'Immediate attention' },
            { key: 'medium', value: 'Medium Priority', description: 'Standard processing' },
            { key: 'low', value: 'Low Priority', description: 'Can be deferred' },
          ],
        },
      },
    }}
  />
);

export const TaxonomyPreview = () => (
  <CognitiveResourcePreviewPanel
    resource={{
      resource_type: 'taxonomy',
      content: {
        structured_data: {
          categories: [
            { name: 'Auto Claims', subcategories: [{ name: 'Collision' }, { name: 'Theft' }] },
            { name: 'Property Claims', subcategories: [{ name: 'Fire' }, { name: 'Water' }] },
            { name: 'Health Claims', subcategories: [] },
          ],
        },
      },
    }}
  />
);

export const DocumentPreview = () => (
  <CognitiveResourcePreviewPanel
    resource={{
      resource_type: 'document',
      content: {
        file_ref: {
          file_name: 'claims-manual.pdf',
          file_type: 'application/pdf',
          file_size: 2457600,
        },
      },
    }}
  />
);

export const Empty = () => (
  <CognitiveResourcePreviewPanel resource={{ resource_type: 'text', content: {} }} />
);
