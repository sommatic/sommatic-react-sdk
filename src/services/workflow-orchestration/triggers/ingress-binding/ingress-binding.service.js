import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationIngressBindingService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/triggers/ingress-binding/',
      create: '/workflow-orchestration/triggers/ingress-binding/',
      update: '/workflow-orchestration/triggers/ingress-binding/',
      delete: '/workflow-orchestration/triggers/ingress-binding/',
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
