import BaseApi from '../../../base/api.service';

export default class CognitiveInfrastructureDatasourceService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/cognitive-infrastructure/connectors/external-datasource/',
      create: '/cognitive-infrastructure/connectors/external-datasource/',
      update: '/cognitive-infrastructure/connectors/external-datasource/',
      delete: '/cognitive-infrastructure/connectors/external-datasource/',
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
