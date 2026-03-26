import BaseApi from '@services/base/api.service';

export default class CognitiveInfrastructureAgentProfileService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/cognitive-infrastructure/cognitive-assets/agent-profile/',
      create: '/cognitive-infrastructure/cognitive-assets/agent-profile/',
      update: '/cognitive-infrastructure/cognitive-assets/agent-profile/',
      delete: '/cognitive-infrastructure/cognitive-assets/agent-profile/',
    };
  }

  async getByParameters(data) {
    const response = await super.getByParameters(data);

    if (data?.queryselector === 'search') {
      console.log('[OmniSearch][AgentProfile] query:', data?.search, '| response:', response);
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
