import BaseApi from '../../base/api.service';

export default class IdentityOrganizationManagementService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/identity/organization/',
      create: '/identity/organization/',
      update: '/identity/organization/',
      delete: '/identity/organization/',
    };
  }

  async getByParameters(data) {
    const response = await super.getByParameters(data);

    if (data?.queryselector === 'search') {
      console.log('[OmniSearch][OrganizationManagement] query:', data?.search, '| response:', response);
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
