export const APPROVAL_TYPES = [
  { id: 1, name: 'binary_approval',        title: 'Binary Approval',        color: '#1976d2' },
  { id: 2, name: 'tool_approval',          title: 'Tool Approval',          color: '#f57c00' },
  { id: 3, name: 'plan_review',            title: 'Plan Review',            color: '#7b1fa2' },
  { id: 4, name: 'single_select_decision', title: 'Single-Select Decision', color: '#0288d1' },
  { id: 5, name: 'multi_select_decision',  title: 'Multi-Select Decision',  color: '#455a64' },
  { id: 6, name: 'review_edit_reject',     title: 'Review / Edit / Reject', color: '#2e7d32' },
];

export const APPROVAL_TYPE_BY_NAME = APPROVAL_TYPES.reduce((acc, type) => {
  acc[type.name] = type;
  return acc;
}, {});

export const HITL_APP_SLUG = 'human-approval-gate';

export const APPROVAL_TYPES_BY_TASK_TYPE = {
  approval:        ['binary_approval', 'tool_approval', 'plan_review', 'review_edit_reject'],
  data_completion: ['review_edit_reject', 'single_select_decision', 'multi_select_decision'],
  review:          ['binary_approval', 'plan_review', 'review_edit_reject'],
  resolution:      ['binary_approval', 'single_select_decision', 'multi_select_decision', 'tool_approval'],
  delegation:      ['binary_approval', 'single_select_decision'],
};

export const HITL_EXTRAS_TEMPLATES = {
  binary_approval: {},
  tool_approval: {
    tool: {
      name: 'send_email',
      args: { to: 'customer@example.com', subject: 'Notice' },
      risk_level: 'medium',
    },
  },
  plan_review: {
    plan: {
      steps: [
        { id: 'step-1', title: 'Validate inputs', detail: 'Check the request payload.' },
        { id: 'step-2', title: 'Execute action', detail: 'Run the operation.' },
        { id: 'step-3', title: 'Notify stakeholders', detail: 'Send confirmation email.' },
      ],
    },
  },
  single_select_decision: {
    options: [
      { id: 'opt-a', name: 'option_a', title: 'Option A' },
      { id: 'opt-b', name: 'option_b', title: 'Option B' },
      { id: 'opt-c', name: 'option_c', title: 'Option C' },
    ],
  },
  multi_select_decision: {
    options: [
      { id: 'tag-1', name: 'urgent', title: 'Urgent' },
      { id: 'tag-2', name: 'finance', title: 'Finance' },
      { id: 'tag-3', name: 'legal', title: 'Legal' },
    ],
  },
  review_edit_reject: {
    content: {
      text: 'Draft message to customer:\n\nThank you for your patience...',
      editable: true,
    },
  },
};
