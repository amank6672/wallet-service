/**
 * Application constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/wallet';

export const STORAGE_KEYS = {
  WALLET_ID: 'walletId',
  WALLET_CACHE: 'wallet_cache',
  TRANSACTIONS_CACHE: 'transactions_cache',
};

export const CACHE_CONFIG = {
  WALLET_TTL: 5 * 60 * 1000, // 5 minutes
  TRANSACTIONS_TTL: 2 * 60 * 1000, // 2 minutes
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 1000,
  MIN_PAGE_SIZE: 1,
};

export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  INPUT: 500,
};

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RETRY_BACKOFF: 2,
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

