import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationFlowDefinitionService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/control-plane/flow-design/flow-definition/',
      create: '/workflow-orchestration/control-plane/flow-design/flow-definition/',
      update: '/workflow-orchestration/control-plane/flow-design/flow-definition/',
      delete: '/workflow-orchestration/control-plane/flow-design/flow-definition/',
    };
  }

  async getByParameters(data) {
    return super.getByParameters(data);
  }

  async update(data) {
    return super.update(data);
  }

  async create(data) {
    return super.create(data);
  }

  async delete(data) {
    return super.delete(data);
  }
}
