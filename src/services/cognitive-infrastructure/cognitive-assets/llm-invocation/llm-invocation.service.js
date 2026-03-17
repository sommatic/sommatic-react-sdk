import BaseApi from '../../../base/api.service';

export default class CognitiveInfrastructureLLMInvocationService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      invoke: '/cognitive-assets/llm-provider/invoke',
    };
  }

  async invoke(payload) {
    return this.post(payload, { endpoint: this.serviceEndpoints.invoke });
  }
}
