import BaseStream from '../../base/base-stream.service';

export default class WorkManagementTaskStreamService extends BaseStream {
  constructor(args) {
    super(args);

    this.streamEndpoints = {
      baseUrl: args?.baseUrl || import.meta.env.VITE_APP_BACKEND_URL || '',
      stream: '/work-management/task/stream',
    };
  }
}
