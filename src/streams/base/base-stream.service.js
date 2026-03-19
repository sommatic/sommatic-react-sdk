export default class BaseStream {
  constructor(args) {
    this.streamEndpoints = {
      baseUrl: args?.baseUrl || '',
      stream: '',
    };

    this._source = null;
    this._listeners = new Map();
    this._closed = false;
    this._reconnectMs = args?.reconnectMs || 3000;
    this._reconnectTimer = null;
    this._params = {};
  }

  /** Set query parameters for the stream URL */
  setParams(params) {
    this._params = params || {};
  }

  /**
   * Build the full URL with query params.
   * Supports nested objects (e.g., { user: { identity: 'xxx' } } → user[identity]=xxx).
   */
  #buildUrl() {
    const parts = [];

    const flatten = (obj, prefix) => {
      for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}[${key}]` : key;

        if (val && typeof val === 'object' && !Array.isArray(val)) {
          flatten(val, fullKey);
        } else if (val != null) {
          parts.push(
            `${encodeURIComponent(fullKey)}=${encodeURIComponent(val)}`,
          );
        }
      }
    };

    flatten(this._params);

    const base = `${this.streamEndpoints.baseUrl}${this.streamEndpoints.stream}`;
    return parts.length ? `${base}?${parts.join('&')}` : base;
  }

  /** Connect to the SSE endpoint */
  connect() {
    if (this._source) {
      this.disconnect();
    }

    this._closed = false;
    this._source = new EventSource(this.#buildUrl());

    // Re-attach registered listeners
    for (const [event, handler] of this._listeners) {
      this._source.addEventListener(event, handler);
    }

    // Auto-reconnect on error
    this._source.onerror = () => {
      if (this._closed) return;

      this._source?.close();
      this._reconnectTimer = setTimeout(() => {
        if (!this._closed) {
          this.connect();
        }
      }, this._reconnectMs);
    };
  }

  /** Register a named event listener. Callback receives parsed JSON data. */
  on(eventName, callback) {
    const handler = (e) => {
      try {
        callback(JSON.parse(e.data), e);
      } catch {
        callback(e.data, e);
      }
    };

    this._listeners.set(eventName, handler);

    if (this._source) {
      this._source.addEventListener(eventName, handler);
    }
  }

  /** Remove a named event listener */
  off(eventName) {
    const handler = this._listeners.get(eventName);

    if (handler && this._source) {
      this._source.removeEventListener(eventName, handler);
    }

    this._listeners.delete(eventName);
  }

  /** Disconnect and cleanup */
  disconnect() {
    this._closed = true;
    clearTimeout(this._reconnectTimer);

    if (this._source) {
      this._source.close();
      this._source = null;
    }
  }

  /** Whether the connection is active */
  get connected() {
    return this._source?.readyState === EventSource.OPEN;
  }
}
