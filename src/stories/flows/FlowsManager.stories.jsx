import React from 'react';
import FlowsManagerComponent from '@components/flows/FlowsManager.component';
import { ReactFlowProvider } from '@xyflow/react';
import { BrowserRouter } from 'react-router-dom';

export default {
  title: 'Flows/FlowsManager',
  component: FlowsManagerComponent,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <ReactFlowProvider>
          <div style={{ height: '100vh', width: '100vw' }}>
            <Story />
          </div>
        </ReactFlowProvider>
      </BrowserRouter>
    ),
  ],
};

export const Default = {
  args: {},
};
