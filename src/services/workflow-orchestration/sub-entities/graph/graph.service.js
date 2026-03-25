import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationGraphService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/sub-entities/graph/',
      create: '/workflow-orchestration/sub-entities/graph/',
      update: '/workflow-orchestration/sub-entities/graph/',
      delete: '/workflow-orchestration/sub-entities/graph/',
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
