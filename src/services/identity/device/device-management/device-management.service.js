import BaseApi from '@services/base/api.service';

export default class DeviceManagementService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/identity/device/device-management/',
      create: '/identity/device/device-management/',
      update: '/identity/device/device-management/',
      delete: '/identity/device/device-management/',
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
