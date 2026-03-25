import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationPluginService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/extensions/plugin/',
      create: '/workflow-orchestration/extensions/plugin/',
      update: '/workflow-orchestration/extensions/plugin/',
      delete: '/workflow-orchestration/extensions/plugin/',
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
