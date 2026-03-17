import BaseApi from '../../base/api.service';

export default class ConversationExecutionService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      execute: '/chat/conversation/execute',
    };
    this.settings = args?.settings || {};
  }

  async execute(data, signal) {
    return super.post(data, {
      endpoint: this.serviceEndpoints.execute,
      signal: signal,
      ...this.settings,
    });
  }
}
