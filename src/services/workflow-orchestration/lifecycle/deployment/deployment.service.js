import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationDeploymentService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/lifecycle/deployment/',
      create: '/workflow-orchestration/lifecycle/deployment/',
      update: '/workflow-orchestration/lifecycle/deployment/',
      delete: '/workflow-orchestration/lifecycle/deployment/',
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
