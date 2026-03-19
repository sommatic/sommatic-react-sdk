import BaseApi from '../../base/api.service';

export default class WorkManagementTaskService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/work-management/task/',
      create: '/work-management/task/',
      update: '/work-management/task/',
      delete: '/work-management/task/',
    };
  }

  async getByParameters(data) {
    return super.getByParameters(data);
  }

  async get(payload, endpoint) {
    if (endpoint === undefined && payload?.queryselector) {
      return this.getByParameters(payload);
    }
    return super.get(payload, endpoint);
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

  async transition(data) {
    return super.patch(data, { endpoint: `${this.serviceEndpoints.update}transition/` });
  }
}
