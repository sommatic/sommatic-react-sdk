import BaseApi from '../../base/api.service';

const SSE_EVENT_SEPARATOR = '\n\n';

function parseSseChunk(rawText) {
  const events = [];
  const blocks = rawText.split(SSE_EVENT_SEPARATOR);

  for (const block of blocks) {
    const trimmedBlock = block.trim();

    if (!trimmedBlock) {
      continue;
    }

    let eventName = 'message';
    let dataLine = '';

    for (const line of trimmedBlock.split('\n')) {
      if (line.startsWith('event:')) {
        eventName = line.slice('event:'.length).trim();
      } else if (line.startsWith('data:')) {
        dataLine = line.slice('data:'.length).trim();
      }
    }

    if (!dataLine) {
      continue;
    }

    try {
      events.push({ event: eventName, data: JSON.parse(dataLine) });
    } catch {
      events.push({ event: eventName, data: dataLine });
    }
  }

  return events;
}

export default class ConversationExecutionService extends BaseApi {
  constructor(args) {
    super(args);

    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL,
      execute: '/chat/conversation/execute',
      executeStream: '/chat/conversation/execute/stream',
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

  async executeStream(data, { onOpen, onChunk, onDone, onError, signal } = {}) {
    const url = `${this.serviceEndpoints.baseUrl}${this.serviceEndpoints.executeStream}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal,
      });

      if (!response.ok || !response.body) {
        const errorPayload = { success: false, message: `HTTP ${response.status}` };
        onError?.(errorPayload);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lastSeparatorIndex = buffer.lastIndexOf(SSE_EVENT_SEPARATOR);

        if (lastSeparatorIndex === -1) {
          continue;
        }

        const processable = buffer.slice(0, lastSeparatorIndex + SSE_EVENT_SEPARATOR.length);
        buffer = buffer.slice(lastSeparatorIndex + SSE_EVENT_SEPARATOR.length);

        const events = parseSseChunk(processable);

        for (const sseEvent of events) {
          if (sseEvent.event === 'open') {
            onOpen?.(sseEvent.data);
          } else if (sseEvent.event === 'chunk') {
            onChunk?.(sseEvent.data);
          } else if (sseEvent.event === 'done') {
            onDone?.(sseEvent.data);
          } else if (sseEvent.event === 'error') {
            onError?.(sseEvent.data);
          }
        }
      }
    } catch (fetchError) {
      if (fetchError?.name === 'AbortError') {
        onError?.({ success: false, message: 'Generation stopped by user' });
        return;
      }

      onError?.({ success: false, message: fetchError?.message || 'Stream connection failed' });
    }
  }
}
