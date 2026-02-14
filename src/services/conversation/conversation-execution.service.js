import BaseApi from '../base/api.service';

export default class ConversationExecutionService extends BaseApi {
  constructor (args) {
    super(args);

    this.api_key = args?.apiKey || '';
    this.service_uri = {
      execute: '/conversation/execute',
    };
    this.settings = args?.settings || {};

    // Override base URLs if provided in args
    if (args?.baseUrl) {
        this.serviceEndpoints.baseUrlProduction = args.baseUrl;
        this.serviceEndpoints.baseUrlDevelopment = args.baseUrl;
        this.serviceEndpoints.baseUrlLocal = args.baseUrl;
    }
  }

  async execute (payload) {
    return super.post(payload, { endpoint: this.service_uri.execute });
  }
}
