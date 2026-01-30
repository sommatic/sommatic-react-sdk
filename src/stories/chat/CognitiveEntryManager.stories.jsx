import React from 'react';
import CognitiveEntryManagerComponent from '@components/chat/CognitiveEntryManager.component';
import { BrowserRouter } from 'react-router-dom';

export default {
  title: 'Chat/CognitiveEntryManager',
  component: CognitiveEntryManagerComponent,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div style={{ width: '800px', height: '600px', border: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export const Default = {
  args: {
    mode: 'default',
  },
};

export const SidebarMode = {
  args: {
    mode: 'sidebar',
    initialConversationId: 'conv-123',
  },
};
