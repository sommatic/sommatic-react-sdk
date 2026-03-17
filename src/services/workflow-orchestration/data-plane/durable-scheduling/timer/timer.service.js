import BaseApi from '../../../../base/api.service';

export default class WorkflowOrchestrationTimerService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/data-plane/durable-scheduling/timer/',
      create: '/workflow-orchestration/data-plane/durable-scheduling/timer/',
      update: '/workflow-orchestration/data-plane/durable-scheduling/timer/',
      delete: '/workflow-orchestration/data-plane/durable-scheduling/timer/',
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
