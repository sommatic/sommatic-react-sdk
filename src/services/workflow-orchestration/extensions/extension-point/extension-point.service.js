import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationExtensionPointService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/extensions/extension-point/',
      create: '/workflow-orchestration/extensions/extension-point/',
      update: '/workflow-orchestration/extensions/extension-point/',
      delete: '/workflow-orchestration/extensions/extension-point/',
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
