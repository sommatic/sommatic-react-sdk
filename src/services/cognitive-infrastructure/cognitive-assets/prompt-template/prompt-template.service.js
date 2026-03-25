import BaseApi from '@services/base/api.service';

export default class CognitiveInfrastructurePromptTemplateService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/cognitive-infrastructure/cognitive-assets/prompt-template/',
      create: '/cognitive-infrastructure/cognitive-assets/prompt-template/',
      update: '/cognitive-infrastructure/cognitive-assets/prompt-template/',
      delete: '/cognitive-infrastructure/cognitive-assets/prompt-template/',
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
