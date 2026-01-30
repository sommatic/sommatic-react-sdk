/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const path = require('path');
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-webpack5-compiler-swc',
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@components': path.resolve(__dirname, '../src/components'),
      '@hooks': path.resolve(__dirname, '../src/hooks'),
      '@styles': path.resolve(__dirname, '../src/styles'),
      '@constants': path.resolve(__dirname, '../src/constants'),
      '@assets': path.resolve(__dirname, '../src/assets'),
      '@': path.resolve(__dirname, '../src'),
      // Mocks for external SDKs and services
      '@veripass/react-sdk': path.resolve(__dirname, './mocks/veripass-react-sdk.js'),
      '@services': path.resolve(__dirname, './mocks/services'),
    };
    return config;
  },
};
export default config;
