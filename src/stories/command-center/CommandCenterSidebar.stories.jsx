import React from 'react';
import CommandCenterSidebar from '@components/command-center/CommandCenterSidebar';
import { BrowserRouter } from 'react-router-dom';

export default {
  title: 'CommandCenter/CommandCenterSidebar',
  component: CommandCenterSidebar,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div style={{ minHeight: '150vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Main Content Area */}
          <div style={{ padding: '20px', flex: 1 }}>
            <h1>Page Title</h1>
            <p>Scroll down to see how the sidebar overlays content and how the trigger interacts with the footer.</p>
            {Array.from({ length: 30 }).map((_, i) => (
              <p key={i}>
                Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullram, posuere eget aliquet nec,
                tincidunt a nisl.
              </p>
            ))}

            {/* The component layout is expected to be a sibling, but technically it renders fixed elements so position in DOM matters less, 
                but typically it's at the end of content or near the root. */}
            <Story />
          </div>

          {/* Footer for Trigger visibility check */}
          <div
            className="footer-container"
            style={{ height: '100px', backgroundColor: '#212529', color: '#fff', padding: '20px' }}
          >
            <h2>Footer</h2>
            <p>The trigger button should jump beneath this footer text or stay above the footer container depending on logic.</p>
          </div>
        </div>
      </BrowserRouter>
    ),
  ],
};

export const Default = {};
