import BaseApi from '../../../../../../base/api.service';

export default class WorkflowOrchestrationEndpointTemplateService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/control-plane/integration-registry/connector/sub-entities/endpoint-template/',
      create: '/workflow-orchestration/control-plane/integration-registry/connector/sub-entities/endpoint-template/',
      update: '/workflow-orchestration/control-plane/integration-registry/connector/sub-entities/endpoint-template/',
      delete: '/workflow-orchestration/control-plane/integration-registry/connector/sub-entities/endpoint-template/',
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
