import BaseApi from '../../base/api.service';

export default class CommunicationUploadService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      uploadSingle: '/file/upload/single',
      uploadBulk: '/file/upload/bulk',
    };

    // File uploads stream through the backend to cloud storage (Firebase/Azure),
    // which can take well over the 31s default. Give uploads a generous timeout
    // so large documents don't get aborted as "(cancelled)".
    this.settings = { ...(this.settings || {}), timeout: 120000 };
  }

  async uploadSingle(payload, requestConfig) {
    // Call axios directly (BaseApi.post forwards no per-request config) so the
    // caller can pass an AbortController `signal` and cancel an in-flight upload.
    try {
      const url = `${this.serviceEndpoints.baseUrl}${this.serviceEndpoints.uploadSingle}`;
      const result = await this.request().post(url, payload, requestConfig);
      return result.data;
    } catch (error) {
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        return { success: false, canceled: true };
      }
      console.error(error);
      if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
        return {
          success: false,
          isTimeout: true,
          message: 'The request took too long to complete (timeout).',
          code: error.code || 'ECONNABORTED',
        };
      }
      return error?.response?.data;
    }
  }

  async uploadBulk(payload) {
    return this.post(payload, { endpoint: this.serviceEndpoints.uploadBulk });
  }
}
