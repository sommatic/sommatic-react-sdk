import BaseApi from '../base/api.service';

export default class ConversationManagementService extends BaseApi {
  constructor (args) {
    super(args);

    this.api_key = args?.apiKey || '';
    this.service_uri = {
      get: '/conversation',
      create: '/conversation',
      update: '/conversation',
      delete: '/conversation',
    };
    this.settings = args?.settings || {};

    if (args?.baseUrl) {
        this.serviceEndpoints.baseUrlProduction = args.baseUrl;
        this.serviceEndpoints.baseUrlDevelopment = args.baseUrl;
        this.serviceEndpoints.baseUrlLocal = args.baseUrl;
    }
  }
}
