import { API_BASE_URL, RETRY_CONFIG, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry logic with exponential backoff
 */
async function fetchWithRetry(url, options, retries = RETRY_CONFIG.MAX_RETRIES) {
  try {
    const response = await fetch(url, options);
    
    // Don't retry on 4xx errors (client errors)
    if (!response.ok && response.status >= 400 && response.status < 500) {
      return response;
    }
    
    // Retry on network errors or 5xx errors
    if (!response.ok && retries > 0) {
      await sleep(RETRY_CONFIG.RETRY_DELAY * Math.pow(RETRY_CONFIG.RETRY_BACKOFF, RETRY_CONFIG.MAX_RETRIES - retries));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    // Don't retry if request was aborted
    if (error.name === 'AbortError') {
      throw error;
    }
    
    if (retries > 0) {
      await sleep(RETRY_CONFIG.RETRY_DELAY * Math.pow(RETRY_CONFIG.RETRY_BACKOFF, RETRY_CONFIG.MAX_RETRIES - retries));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Handle API response and extract data or throw error
 */
async function handleResponse(response) {
  const data = await response.json();
  
  if (!response.ok || !data.success) {
    const error = new Error(data.error?.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    error.code = data.error?.code;
    error.details = data.error?.details;
    error.statusCode = response.status;
    throw error;
  }
  
  return data.data || data;
}

/**
 * API Client with AbortController support
 */
export const apiClient = {
  /**
   * GET request with AbortController support
   */
  async get(endpoint, options = {}) {
    const { signal, ...restOptions } = options;
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetchWithRetry(url, {
      ...restOptions,
      method: 'GET',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...restOptions.headers,
      },
    });
    
    return handleResponse(response);
  },

  /**
   * POST request with AbortController support
   */
  async post(endpoint, data, options = {}) {
    const { signal, ...restOptions } = options;
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetchWithRetry(url, {
      ...restOptions,
      method: 'POST',
      body: JSON.stringify(data),
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...restOptions.headers,
      },
    });
    
    return handleResponse(response);
  },

  /**
   * PUT request with AbortController support
   */
  async put(endpoint, data, options = {}) {
    const { signal, ...restOptions } = options;
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetchWithRetry(url, {
      ...restOptions,
      method: 'PUT',
      body: JSON.stringify(data),
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...restOptions.headers,
      },
    });
    
    return handleResponse(response);
  },

  /**
   * DELETE request with AbortController support
   */
  async delete(endpoint, options = {}) {
    const { signal, ...restOptions } = options;
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetchWithRetry(url, {
      ...restOptions,
      method: 'DELETE',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...restOptions.headers,
      },
    });
    
    return handleResponse(response);
  },
};
