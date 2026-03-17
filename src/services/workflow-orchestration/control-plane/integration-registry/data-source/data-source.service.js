import BaseApi from '../../../../base/api.service';

export default class WorkflowOrchestrationDataSourceService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/control-plane/integration-registry/data-source/',
      create: '/workflow-orchestration/control-plane/integration-registry/data-source/',
      update: '/workflow-orchestration/control-plane/integration-registry/data-source/',
      delete: '/workflow-orchestration/control-plane/integration-registry/data-source/',
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
