import BaseApi from '../../../base/api.service';

export default class CognitiveInfrastructureMemoryStoreService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/cognitive-infrastructure/connectors/memory-store/',
      create: '/cognitive-infrastructure/connectors/memory-store/',
      update: '/cognitive-infrastructure/connectors/memory-store/',
      delete: '/cognitive-infrastructure/connectors/memory-store/',
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
