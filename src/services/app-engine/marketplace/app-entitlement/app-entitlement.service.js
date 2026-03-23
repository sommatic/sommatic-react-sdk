import BaseApi from '../../../../base/api.service';

export default class AppEngineMarketplaceAppEntitlementService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/app-engine/marketplace/app-entitlement/',
      grantEntitlement: '/app-engine/marketplace/app-entitlement/grant',
      revokeEntitlement: '/app-engine/marketplace/app-entitlement/revoke',
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
