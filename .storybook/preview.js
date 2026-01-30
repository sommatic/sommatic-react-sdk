import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap styles for grid and utils
import '@link-loom/react-sdk/dist/styles.css'; // LinkLoom styles

// Create a light theme (default) or customization as needed.
// The user requested removing the black background, so we use standard light palette.
// Specific components like Sidebar have their own dark styles hardcoded.
const theme = createTheme({
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderLeft: '1px solid rgba(107, 114, 128, 0.25)',
        },
      },
    },
  },
});

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Using 'padded' or 'centered' might be better than fullscreen if we want to see boundaries,
    // but the user's app seems to take full width.
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
