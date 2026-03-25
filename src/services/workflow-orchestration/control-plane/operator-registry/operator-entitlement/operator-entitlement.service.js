import BaseApi from '@services/base/api.service';

export default class WorkflowOrchestrationOperatorEntitlementService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/workflow-orchestration/control-plane/operator-registry/operator-entitlement/',
      grantEntitlement: '/workflow-orchestration/control-plane/operator-registry/operator-entitlement/grant',
      revokeEntitlement: '/workflow-orchestration/control-plane/operator-registry/operator-entitlement/revoke',
    };
  }

  async getByParameters(data) {
    return super.getByParameters(data);
  }

  async grantEntitlement(data) {
    return this.post(data, { endpoint: this.serviceEndpoints.grantEntitlement });
  }

  async revokeEntitlement(data) {
    return this.post(data, { endpoint: this.serviceEndpoints.revokeEntitlement });
  }
}
