import BaseApi from '../../base/api.service';

export default class ConversationRecordService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      get: '/chat/conversation/sub-entities/conversation-record/',
      create: '/chat/conversation/sub-entities/conversation-record/',
      update: '/chat/conversation/sub-entities/conversation-record/',
      delete: '/chat/conversation/sub-entities/conversation-record/',
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
