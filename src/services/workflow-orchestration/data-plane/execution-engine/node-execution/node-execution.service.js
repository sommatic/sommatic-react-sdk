import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationNodeExecutionService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/data-plane/execution-engine/node-execution/',
      create: '/workflow-orchestration/data-plane/execution-engine/node-execution/',
      update: '/workflow-orchestration/data-plane/execution-engine/node-execution/',
      delete: '/workflow-orchestration/data-plane/execution-engine/node-execution/',
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
