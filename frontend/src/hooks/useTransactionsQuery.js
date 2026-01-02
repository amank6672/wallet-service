import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../api/walletApi.js';
import { PAGINATION } from '../config/constants.js';
import { walletKeys } from './useWalletQuery.js';

/**
 * Hook to fetch transactions with skip/limit pagination and sorting
 */
export function useTransactions(walletId, options = {}) {
  const {
    skip = 0,
    limit = PAGINATION.DEFAULT_PAGE_SIZE,
    sortBy = 'date',
    sortOrder = 'desc',
    enabled = true,
    ...queryOptions
  } = options;

  const queryKey = walletKeys.transactions(walletId, {
    skip,
    limit,
    sortBy,
    sortOrder,
  });

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => 
      getTransactions(
        walletId,
        { skip, limit, sortBy, sortOrder },
        signal
      ),
    enabled: !!walletId && enabled,
    staleTime: 0, // Always refetch when query key changes (skip/limit/sort changes)
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnMount: true, // Refetch when component mounts
    ...queryOptions,
  });
}

