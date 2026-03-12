import React from 'react';
import KnowledgeResourceTypeBadge from '@components/cognitive-resource/KnowledgeResourceTypeBadge.component';

export default {
  title: 'Cognitive Resource/KnowledgeResourceTypeBadge',
  component: KnowledgeResourceTypeBadge,
  parameters: {
    layout: 'centered',
  },
};

export const Text = { args: { type: 'text' } };
export const Manual = { args: { type: 'manual' } };
export const Policy = { args: { type: 'policy' } };
export const List = { args: { type: 'list' } };
export const Taxonomy = { args: { type: 'taxonomy' } };
export const Document = { args: { type: 'document' } };
export const Dataset = { args: { type: 'dataset' } };
export const Reference = { args: { type: 'reference' } };
export const UnknownType = { args: { type: 'custom-type' } };

export const AllTypes = () => (
  <section style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {['text', 'manual', 'policy', 'list', 'taxonomy', 'document', 'dataset', 'reference'].map((type) => (
      <KnowledgeResourceTypeBadge key={type} type={type} />
    ))}
  </section>
);
