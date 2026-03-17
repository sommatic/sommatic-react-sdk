import BaseApi from '../../../../base/api.service';

export default class WorkflowOrchestrationCredentialService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/control-plane/integration-registry/credential/',
      create: '/workflow-orchestration/control-plane/integration-registry/credential/',
      update: '/workflow-orchestration/control-plane/integration-registry/credential/',
      delete: '/workflow-orchestration/control-plane/integration-registry/credential/',
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
