import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationEnvelopeService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/data-plane/messaging-core/envelope/',
      create: '/workflow-orchestration/data-plane/messaging-core/envelope/',
      update: '/workflow-orchestration/data-plane/messaging-core/envelope/',
      delete: '/workflow-orchestration/data-plane/messaging-core/envelope/',
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
