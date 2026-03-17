import BaseApi from '../../../base/api.service';

export default class WorkflowOrchestrationNodeDefinitionService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/sub-entities/node-definition/',
      create: '/workflow-orchestration/sub-entities/node-definition/',
      update: '/workflow-orchestration/sub-entities/node-definition/',
      delete: '/workflow-orchestration/sub-entities/node-definition/',
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
