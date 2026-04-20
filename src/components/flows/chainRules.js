// Chain validation rules for flow designer nodes.
// Mirrors `chain_constraints` declared in orchestrator .definition.js files.
// Keyed by operator slug.

export const CHAIN_RULES = {
  'human.task.create': {
    next: [
      {
        when: { has_hag: true },
        required_slug: 'human.approval.gate',
        message:
          'When "Has Human Approval" is checked, this node must be followed by a Human Approval Gate node.',
      },
    ],
  },
  'human.approval.gate': {
    prev: {
      required_slug: 'human.task.create',
      message:
        'Human Approval Gate requires a preceding Create Task node to receive the task_id.',
    },
  },
};
