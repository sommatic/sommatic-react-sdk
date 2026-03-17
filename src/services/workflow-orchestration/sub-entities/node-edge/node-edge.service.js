import BaseApi from '../../../base/api.service';

export default class WorkflowOrchestrationNodeEdgeService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/sub-entities/node-edge/',
      create: '/workflow-orchestration/sub-entities/node-edge/',
      update: '/workflow-orchestration/sub-entities/node-edge/',
      delete: '/workflow-orchestration/sub-entities/node-edge/',
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
