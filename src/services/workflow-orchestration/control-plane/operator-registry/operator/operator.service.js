import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationOperatorService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/control-plane/operator-registry/operator/',
      create: '/workflow-orchestration/control-plane/operator-registry/operator/',
      update: '/workflow-orchestration/control-plane/operator-registry/operator/',
      delete: '/workflow-orchestration/control-plane/operator-registry/operator/',
    };
  }

  async getByParameters(data) {
    const response = await super.getByParameters(data);

    if (data?.queryselector === 'search') {
      console.log('[OmniSearch][OperatorService] query:', data?.search, '| response:', response);
      return response?.result;
    }

    return response;
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
