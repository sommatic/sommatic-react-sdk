import BaseApi from '@services/base/api.service';

export default class PlatformInfrastructureCredentialService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/platform-infrastructure/credential/',
      create: '/platform-infrastructure/credential/',
      update: '/platform-infrastructure/credential/',
      delete: '/platform-infrastructure/credential/',
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
