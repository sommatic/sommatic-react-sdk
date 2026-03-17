import BaseApi from '../../../base/api.service';

export default class CognitiveInfrastructureKnowledgeResourceBindingService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/cognitive-infrastructure/cognitive-assets/knowledge-resource-binding/',
      create: '/cognitive-infrastructure/cognitive-assets/knowledge-resource-binding/',
      update: '/cognitive-infrastructure/cognitive-assets/knowledge-resource-binding/',
      delete: '/cognitive-infrastructure/cognitive-assets/knowledge-resource-binding/',
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
