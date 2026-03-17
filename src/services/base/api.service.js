import axios from 'axios';

export default class BaseApi {
  constructor(args) {
    this.api_key = args?.apiKey || null;
    this.client = null;
    this.serviceEndpoints = {
      baseUrl: '',
      get: '',
      create: '',
      update: '',
      delete: '',
      patch: '',
      put: '',
    };
    this.settings = args?.settings || {};
  }

  /**
   * Initializes and returns an Axios client instance with the necessary headers and configurations.
   *
   * @param {Object} settings Optional settings to override instance defaults during the request.
   * @returns {Object} Axios client instance.
   */
  request(settings = null) {
    let headers = {
      Accept: 'application/json',
    };

    if (this.api_key) {
      headers['authorization'] = `Bearer ${this.api_key}`;
    }

    const mergedSettings = { ...this.settings, ...settings };

    this.client = axios.create({
      baseURL: this.api_url,
      timeout: mergedSettings?.timeout || 31000,
      headers: headers,
    });

    return this.client;
  }

  /**
   * Serializes a nested object into a query string format.
   *
   * @param {Object} obj The object to be serialized.
   * @param {string} [prefix] Prefix for nested properties in the object.
   * @returns {string} Serialized query string.
   */
  serializerOjectToQueryString(obj, prefix) {
    if (obj && typeof obj === 'object') {
      const serializedArr = [];
      let key = {};

      for (key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const k = prefix ? prefix + '[' + key + ']' : key;
          const value = obj[key] || null;
          serializedArr.push(
            value !== null && typeof value === 'object'
              ? this.serializerOjectToQueryString(value, k)
              : encodeURIComponent(k) + '=' + encodeURIComponent(value),
          );
        }
      }
      return serializedArr.join('&');
    }
  }

  /**
   * Converts an object into a query string format.
   *
   * @param {Object} obj The object to be converted.
   * @returns {string} Query string starting with '?' or an empty string if the object is not valid.
   */
  objectToQueryString(obj) {
    if (obj && typeof obj === 'object') {
      const result = this.serializerOjectToQueryString(obj);
      return `?${result}`;
    } else {
      return '';
    }
  }

  /**
   * Execute a query to filter by parameters
   * @param {Object} data Provides all information to get an entity by parameters
   * @param {string} data.queryselector Is the selector of filter
   * @returns an object to be processed
   */
  async getByParameters(data) {
    try {
      if (!data) {
        return null;
      }

      if (!data.queryselector) {
        console.error('Provide a query selector to query');
        return null;
      }

      const parameters = this.objectToQueryString(data);
      const url = `${this.serviceEndpoints.baseUrl}${this.serviceEndpoints.get}${data.queryselector}${parameters}`;

      const result = await this.request().get(url);

      return result.data;
    } catch (error) {
      console.error(error);
      return error?.body;
    }
  }

  /**
   * Execute a create query into backend service
   * @param {*} payload
   * @returns
   */
  async create(payload) {
    try {
      if (!payload) {
        return null;
      }

      const result = await this.request().post(
        `${this.serviceEndpoints.baseUrl}${this.serviceEndpoints.create}`,
        payload,
      );

      return result.data;
    } catch (error) {
      console.error(error);
      if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
        return {
          success: false,
          isTimeout: true,
          message: 'The request took too long to complete (timeout).',
          code: error.code || 'ECONNABORTED',
        };
      }
      return error?.response?.data || null;
    }
  }

  /**
   * Execute an update query into backend service
   * @param {*} payload
   * @returns
   */
  async update(payload) {
    try {
      if (!payload) {
        return null;
      }

      const result = await this.request().patch(
        `${this.serviceEndpoints.baseUrl}${this.serviceEndpoints.update}`,
        payload,
      );

      return result.data;
    } catch (error) {
      console.error(error);
      if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
        return {
          success: false,
          isTimeout: true,
          message: 'The request took too long to complete (timeout).',
          code: error.code || 'ECONNABORTED',
        };
      }
      return error?.body;
    }
  }

  /**
   * Execute a delete query into backend service
   * @param {*} payload
   * @returns
   */
  async delete(payload) {
    try {
      if (!payload) {
        return null;
      }

      const result = await this.request().delete(
        `${this.serviceEndpoints.baseUrl}${this.serviceEndpoints.delete}`,
        {
          data: payload,
        },
      );

      return result.data;
    } catch (error) {
      console.error(error);
      if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
        return {
          success: false,
          isTimeout: true,
          message: 'The request took too long to complete (timeout).',
          code: error.code || 'ECONNABORTED',
        };
      }
      return error?.body;
    }
  }

  /**
   * Execute a post query
   * @param {*} payload Define what data need to be posted
   * @param {*} settings Configuration settings for the request
   * @returns
   */
  async post(payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const result = await this.request().post(
        `${this.serviceEndpoints.baseUrl}${settings?.endpoint || this.serviceEndpoints.post}`,
        payload,
      );

      return result.data;
    } catch (error) {
      console.error(error);
      if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
        return {
          success: false,
          isTimeout: true,
          message: 'The request took too long to complete (timeout).',
          code: error.code || 'ECONNABORTED',
        };
      }
      return error?.response?.data;
    }
  }

  /**
   * Execute a put query
   * @param {*} payload Define what data need to be posted
   * @param {*} settings Configuration settings for the request
   * @returns
   */
  async put(payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const result = await this.request().put(
        `${this.serviceEndpoints.baseUrl}${settings?.endpoint || this.serviceEndpoints.put}`,
        payload,
      );

      return result.data;
    } catch (error) {
      console.error(error);
      if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
        return {
          success: false,
          isTimeout: true,
          message: 'The request took too long to complete (timeout).',
          code: error.code || 'ECONNABORTED',
        };
      }
      return error?.response?.data;
    }
  }

  /**
   * Execute a patch query
   * @param {*} payload Define what data need to be posted
   * @param {*} settings Configuration settings for the request
   * @returns
   */
  async patch(payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const result = await this.request().patch(
        `${this.serviceEndpoints.baseUrl}${settings?.endpoint || this.serviceEndpoints.patch}`,
        payload,
      );

      return result.data;
    } catch (error) {
      console.error(error);
      if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
        return {
          success: false,
          isTimeout: true,
          message: 'The request took too long to complete (timeout).',
          code: error.code || 'ECONNABORTED',
        };
      }
      return error?.response?.data;
    }
  }

  /**
   * Execute a query get query
   * @param {*} payload
   * @param {*} endpoint
   * @returns
   */
  async get(payload, endpoint) {
    try {
      if (!payload) {
        return null;
      }

      const parameters = this.objectToQueryString(payload);

      const result = await this.request().get(
        `${this.serviceEndpoints.baseUrl}${endpoint}${parameters}`,
      );

      return result.data;
    } catch (error) {
      console.error(error);
      return error?.body;
    }
  }
}
