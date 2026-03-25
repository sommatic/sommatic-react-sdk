import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationFlowVersionService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/control-plane/flow-compilation/flow-version/',
      create: '/workflow-orchestration/control-plane/flow-compilation/flow-version/',
      update: '/workflow-orchestration/control-plane/flow-compilation/flow-version/',
      delete: '/workflow-orchestration/control-plane/flow-compilation/flow-version/',
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
