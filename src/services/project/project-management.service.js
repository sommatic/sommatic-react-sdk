import BaseApi from '../base/api.service';

export default class ProjectManagementService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/project/management/',
      create: '/project/management/',
      update: '/project/management/',
      delete: '/project/management/',
    };
  }

  async getByParameters(data) {
    const response = await super.getByParameters(data);

    if (data?.queryselector === 'search') {
      console.log('[OmniSearch][ProjectManagement] query:', data?.search, '| response:', response);
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
