import BaseApi from '@services/base/api.service';

export default class CognitiveInfrastructureCognitiveToolService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/cognitive-infrastructure/cognitive-assets/cognitive-tool/',
      create: '/cognitive-infrastructure/cognitive-assets/cognitive-tool/',
      update: '/cognitive-infrastructure/cognitive-assets/cognitive-tool/',
      delete: '/cognitive-infrastructure/cognitive-assets/cognitive-tool/',
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
