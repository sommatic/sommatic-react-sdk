import BaseApi from '../../base/api.service';

export default class CommunicationUploadService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      uploadSingle: '/upload/single',
      uploadBulk: '/upload/bulk',
    };
  }

  async uploadSingle(payload) {
    return this.post(payload, { endpoint: this.serviceEndpoints.uploadSingle });
  }

  async uploadBulk(payload) {
    return this.post(payload, { endpoint: this.serviceEndpoints.uploadBulk });
  }
}
