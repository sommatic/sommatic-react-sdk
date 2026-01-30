import React from 'react';
import CodeEditor from '@components/shared/code-editor/CodeEditor';

export default {
  title: 'Shared/CodeEditor',
  component: CodeEditor,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    language: {
      control: 'select',
      options: ['json', 'javascript', 'typescript', 'html', 'css', 'python'],
      description: 'Language for syntax highlighting',
    },
    theme: {
      control: 'radio',
      options: ['vs-dark', 'light'],
      description: 'Editor theme',
    },
    height: {
      control: 'text',
      description: 'Height of the editor container',
    },
    defaultValue: {
      control: 'text',
      description: 'Initial content of the editor',
    },
    onChange: { action: 'changed' },
  },
};

const Template = (args) => <CodeEditor {...args} />;

export const DefaultJSON = Template.bind({});
DefaultJSON.args = {
  language: 'json',
  defaultValue: JSON.stringify(
    {
      appName: 'Sommatic',
      version: 1.0,
      features: ['AI', 'Workflows', 'Chat'],
    },
    null,
    2,
  ),
  theme: 'vs-dark',
  height: '400px',
};

export const JavaScript = Template.bind({});
JavaScript.args = {
  language: 'javascript',
  defaultValue: `// Calculate factorial
function factorial(n) {
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

console.log(factorial(5));`,
  theme: 'vs-dark',
  height: '400px',
};

export const LightTheme = Template.bind({});
LightTheme.args = {
  language: 'json',
  defaultValue: '{\n  "theme": "light",\n  "status": "active"\n}',
  theme: 'light',
  height: '300px',
};
