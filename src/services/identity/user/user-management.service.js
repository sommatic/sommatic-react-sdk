import BaseApi from '../../base/api.service';

export default class IdentityUserManagementService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/identity/user/',
      create: '/identity/user/',
      update: '/identity/user/',
      delete: '/identity/user/',
    };
  }

  async getByParameters(data) {
    const response = await super.getByParameters(data);

    if (data?.queryselector === 'search') {
      console.log('[OmniSearch][UserManagement] query:', data?.search, '| response:', response);
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

  async completeOnboarding(userId) {
    console.log('Patching user to complete onboarding:', { id: userId, onboarding_completed: true });
    return this.update({ id: userId, onboarding_completed: true });
  }
}
