import React, { useState } from 'react';
import TaxonomyResourceEditor from '@components/cognitive-resource/editor/content-editors/TaxonomyResourceEditor.component';

export default {
  title: 'Cognitive Resource/Content Editors/TaxonomyResourceEditor',
  component: TaxonomyResourceEditor,
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
  const [content, setContent] = useState({ format: 'json', structured_data: { categories: [] } });
  return <TaxonomyResourceEditor content={content} onChange={setContent} />;
};

export const WithCategories = () => {
  const [content, setContent] = useState({
    format: 'json',
    structured_data: {
      categories: [
        {
          name: 'Auto Claims',
          description: 'Vehicle-related insurance claims',
          subcategories: [
            { name: 'Collision', description: 'Vehicle collision damage' },
            { name: 'Theft', description: 'Vehicle theft or break-in' },
            { name: 'Weather', description: 'Weather-related vehicle damage' },
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
        {
          name: 'Health Claims',
          description: 'Medical and wellness claims',
          subcategories: [],
        },
      ],
    },
  });
  return <TaxonomyResourceEditor content={content} onChange={setContent} />;
};
