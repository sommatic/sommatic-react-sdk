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
        <div className="d-flex flex-column position-relative" style={{ minHeight: '150vh' }}>
          {/* Main Content Area */}
          <div className="p-4 flex-grow-1">
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
          <div className="footer-container bg-dark text-white p-4" style={{ height: '100px' }}>
            <h2>Footer</h2>
            <p className="m-0">
              The trigger button should jump beneath this footer text or stay above the footer container depending on logic.
            </p>
          </div>
        </div>
      </BrowserRouter>
    ),
  ],
};

export const Default = {};
