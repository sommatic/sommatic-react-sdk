import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationPayloadBlobService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/data-plane/execution-engine/payload-blob/',
    };
  }

  async getByParameters(data) {
    return super.getByParameters(data);
  }
}
