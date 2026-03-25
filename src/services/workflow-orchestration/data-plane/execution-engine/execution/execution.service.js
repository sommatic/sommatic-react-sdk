import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationExecutionService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      executeWorkflow: '/workflow-orchestration/data-plane/execution-engine/execution/workflow',
      executeNode: '/workflow-orchestration/data-plane/execution-engine/execution/node',
    };
  }

  async executeWorkflow(payload) {
    return this.post(payload, { endpoint: this.serviceEndpoints.executeWorkflow });
  }

  async executeNode(payload) {
    return this.post(payload, { endpoint: this.serviceEndpoints.executeNode });
  }
}
