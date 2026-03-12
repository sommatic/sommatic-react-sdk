import React from 'react';
import KnowledgeResourceStatusBadge from '@components/cognitive-resource/KnowledgeResourceStatusBadge.component';

export default {
  title: 'Cognitive Resource/KnowledgeResourceStatusBadge',
  component: KnowledgeResourceStatusBadge,
  parameters: {
    layout: 'centered',
  },
};

export const Draft = { args: { status: { name: 'draft', title: 'Draft' } } };
export const Active = { args: { status: { name: 'active', title: 'Active' } } };
export const Archived = { args: { status: { name: 'archived', title: 'Archived' } } };
export const Deleted = { args: { status: { name: 'deleted', title: 'Deleted' } } };
export const StringStatus = { args: { status: 'active' } };

export const AllStatuses = () => (
  <section style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {[
      { name: 'draft', title: 'Draft' },
      { name: 'active', title: 'Active' },
      { name: 'archived', title: 'Archived' },
      { name: 'deleted', title: 'Deleted' },
    ].map((status) => (
      <KnowledgeResourceStatusBadge key={status.name} status={status} />
    ))}
  </section>
);
