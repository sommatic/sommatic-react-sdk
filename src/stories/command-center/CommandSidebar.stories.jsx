import React, { useRef } from 'react';
import CommandSidebar from '@components/command-center/CommandSidebar';
import { BrowserRouter } from 'react-router-dom';

export default {
  title: 'CommandCenter/CommandSidebar',
  component: CommandSidebar,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Main layout container */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Render the sidebar component which acts as the layout wrapper */}
            <Story />
          </div>
          <div ref={(node) => (window.footerRef = node)} style={{ height: '50px', backgroundColor: '#ddd', flexShrink: 0 }}>
            Footer (Fab Anchor)
          </div>
        </div>
      </BrowserRouter>
    ),
  ],
};

export const Default = {
  args: {
    footerRef: { current: null }, // Mock ref, might need adjustments based on real usage
  },
};
