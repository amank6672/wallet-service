import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWallet, setupWallet, transact } from '../api/walletApi.js';
import { STORAGE_KEYS } from '../config/constants.js';

/**
 * Query keys factory
 */
export const walletKeys = {
  all: ['wallets'],
  detail: (id) => [...walletKeys.all, id],
  transactions: (id, options) => [...walletKeys.all, id, 'transactions', options],
};

/**
 * Hook to fetch wallet by ID
 */
export function useWallet(walletId, options = {}) {
  return useQuery({
    queryKey: walletKeys.detail(walletId),
    queryFn: ({ signal }) => getWallet(walletId, signal),
    enabled: !!walletId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    ...options,
  });
}

/**
 * Hook to create a new wallet
 */
export function useCreateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, balance = 0, signal }) => 
      setupWallet({ name, balance }, signal),
    onSuccess: (data) => {
      // Invalidate all wallet queries
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
      // Set wallet ID in localStorage
      if (data?.id) {
        localStorage.setItem(STORAGE_KEYS.WALLET_ID, data.id);
      }
    },
  });
}

/**
 * Hook to process a transaction
 */
export function useTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ walletId, amount, description, idempotencyKey, signal }) =>
      transact(walletId, { amount, description, idempotencyKey }, signal),
    onSuccess: (data, variables) => {
      // Invalidate wallet query
      queryClient.invalidateQueries({ 
        queryKey: walletKeys.detail(variables.walletId) 
      });
      // Invalidate all transaction queries for this wallet
      queryClient.invalidateQueries({ 
        queryKey: [...walletKeys.all, variables.walletId, 'transactions'] 
      });
    },
  });
}

