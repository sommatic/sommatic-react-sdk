// Mock data for workflow nodes
const MOCK_NODES = [
  // Triggers
  {
    id: 'trigger-1',
    name: 'Webhook',
    description: 'Starts flow on HTTP request',
    type: 'Trigger',
    slug: 'webhook',
    category: 'Trigger',
  },
  {
    id: 'trigger-2',
    name: 'Schedule',
    description: 'runs at specific intervals',
    type: 'Trigger',
    slug: 'schedule',
    category: 'Trigger',
  },
  // Operators
  { id: 'op-1', name: 'HTTP Request', description: 'Make an external API call', category: 'HTTP', slug: 'http-request' },
  { id: 'op-2', name: 'Send Email', description: 'Send an email to a user', category: 'Email', slug: 'send-email' },
  { id: 'op-3', name: 'AI Generate', description: 'Generate text using LLM', category: 'AI', slug: 'ai-generate' },
  { id: 'op-4', name: 'Database Query', description: 'Execute a SQL query', category: 'Database', slug: 'db-query' },
  { id: 'op-5', name: 'JavaScript Code', description: 'Run custom JS code', category: 'Code', slug: 'js-code' },
  { id: 'op-6', name: 'Filter', description: 'Filter data based on conditions', category: 'Logic', slug: 'filter' },
  { id: 'op-7', name: 'Merge', description: 'Merge multiple branches', category: 'Logic', slug: 'merge' },
];

export const fetchEntityCollection = async ({ service, payload }) => {
  console.log('Mock fetchEntityCollection called for:', service);
  // Return all mock nodes regardless of service for simplicity in Storybook
  // In a real app, we'd filter by service type (Trigger vs Operator)

  // Simple logic to differentiate if expected to return triggers or operators based on payload or service name if needed
  // For now, returning everything ensures the sidebar populates.
  return {
    success: true,
    result: {
      items: MOCK_NODES,
    },
  };
};

export const fetchMultipleEntities = async () => ({ success: true, result: [] });
export const updateEntityRecord = async () => ({ success: true, result: {} });
export const createEntityRecord = async () => ({ success: true, result: { id: 'mock-id-' + Math.random() } });
export const fetchEntityRecord = async () => ({ success: true, result: {} });
