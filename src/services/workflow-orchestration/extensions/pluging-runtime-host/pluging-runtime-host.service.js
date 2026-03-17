import BaseApi from '../../../base/api.service';

export default class WorkflowOrchestrationPlugingRuntimeHostService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/extensions/pluging-runtime-host/',
      create: '/workflow-orchestration/extensions/pluging-runtime-host/',
      update: '/workflow-orchestration/extensions/pluging-runtime-host/',
      delete: '/workflow-orchestration/extensions/pluging-runtime-host/',
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
