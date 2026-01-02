import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../api/walletApi.js';
import { PAGINATION } from '../config/constants.js';
import { walletKeys } from './useWalletQuery.js';

/**
 * Hook to fetch transactions with pagination and sorting
 */
export function useTransactions(walletId, options = {}) {
  const {
    limit = PAGINATION.DEFAULT_PAGE_SIZE,
    cursor = null,
    type = null,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    enabled = true,
    ...queryOptions
  } = options;

  const queryKey = walletKeys.transactions(walletId, {
    limit,
    cursor,
    type,
    sortBy,
    sortOrder,
  });

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => 
      getTransactions(
        walletId,
        { limit, cursor, type, sortBy, sortOrder },
        signal
      ),
    enabled: !!walletId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    ...queryOptions,
  });
}

