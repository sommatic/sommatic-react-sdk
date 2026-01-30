export const ConversationManagementService = {
  get: async () => ({ success: true, result: { items: [] } }),
  create: async () => ({ success: true, result: { id: 'new-conv' } }),
};

export const ConversationExecutionService = class {
  async execute() {
    return { success: true, result: { output: 'Mock response' } };
  }
};

export const WorkflowFlowDefinitionService = {
  get: async () => ({ success: true, result: [] }),
};

export const FgnClassificatorService = {};
export const LlmProviderService = {};
export const WorkflowFlowVersionService = {
  get: async () => ({ success: true, result: [] }),
};
export const WorkflowTriggerService = {};
export const WorkflowOperatorService = {};
