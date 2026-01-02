import { useEffect, memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactionsQuery.js';
import { useWallet } from '../hooks/useWalletQuery.js';
import { exportCSV } from '../api/walletApi.js';
import TransactionTable from '../components/TransactionTable.jsx';
import { TableSkeleton } from '../components/LoadingSkeleton.jsx';
import { STORAGE_KEYS, PAGINATION } from '../config/constants.js';
import styles from './TransactionsPage.module.css';

const TransactionsPage = memo(function TransactionsPage() {
  const walletId = localStorage.getItem(STORAGE_KEYS.WALLET_ID);
  
  // Get wallet to ensure it exists
  const { data: wallet } = useWallet(walletId, { enabled: !!walletId });
  
  // Pagination and sorting state - using skip/limit
  const [skip, setSkip] = useState(0);
  const [sorting, setSorting] = useState([{ id: 'date', desc: true }]);
  const [currentPage, setCurrentPage] = useState(1);

  // Get sort parameters - map 'date' to 'date' and 'amount' to 'amount'
  const sortBy = sorting[0]?.id || 'date';
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
  const limit = PAGINATION.DEFAULT_PAGE_SIZE;

  // React Query hook for transactions
  const {
    data,
    isLoading,
    error,
    isFetching,
  } = useTransactions(walletId, {
    skip,
    limit,
    sortBy,
    sortOrder,
    enabled: !!walletId,
  });

  // API now returns array directly
  const transactions = Array.isArray(data) ? data : [];

  const handleNextPage = useCallback(() => {
    setSkip(prev => prev + limit);
    setCurrentPage(prev => prev + 1);
  }, [limit]);

  const handlePreviousPage = useCallback(() => {
    const newSkip = Math.max(0, skip - limit);
    setSkip(newSkip);
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, [skip, limit]);

  const handleFirstPage = useCallback(() => {
    setSkip(0);
    setCurrentPage(1);
  }, []);

  const handleSortingChange = useCallback((newSorting) => {
    setSorting(newSorting);
    setCurrentPage(1);
    setSkip(0);
  }, []);

  const handleExport = useCallback(() => {
    if (walletId) {
      exportCSV(walletId);
    }
  }, [walletId]);

  // Determine if we can go to next page (if we got full page of results)
  const canGoNext = transactions.length === limit && !isLoading;
  const canGoPrevious = skip > 0;
  const loading = isLoading || isFetching;

  if (!walletId) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage} role="alert">
          No wallet found. Please create a wallet first.
        </div>
        <Link to="/" className={styles.link}>
          ← Back to Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Transactions</h2>

      {error && (
        <div className={styles.errorMessage} role="alert">
          {error.message || 'Failed to load transactions'}
        </div>
      )}

      <div className={styles.actions}>
        <Link 
          to="/" 
          className={styles.link}
          aria-label="Back to wallet"
        >
          ← Back to Wallet
        </Link>
        <button 
          onClick={handleExport}
          disabled={!walletId || loading}
          className={`${styles.button} ${styles.buttonExport}`}
          aria-label="Export transactions as CSV"
        >
          Export CSV
        </button>
      </div>

      {loading && transactions.length === 0 ? (
        <TableSkeleton rows={5} />
      ) : (
        <TransactionTable 
          data={transactions} 
          loading={loading}
          sorting={sorting}
          onSortingChange={handleSortingChange}
        />
      )}

      {/* Pagination Controls */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          {transactions.length > 0 && (
            <>
              Showing {skip + 1}-{skip + transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              {canGoNext && ' (more available)'}
            </>
          )}
        </div>
        
        <div className={styles.paginationControls}>
          <button
            onClick={handleFirstPage}
            disabled={!canGoPrevious && currentPage === 1}
            className={`${styles.button} ${styles.buttonFirst}`}
            aria-label="Go to first page"
          >
            First
          </button>
          <button
            onClick={handlePreviousPage}
            disabled={!canGoPrevious}
            className={`${styles.button} ${styles.buttonPrevious}`}
            aria-label="Go to previous page"
          >
            ← Previous
          </button>
          <span className={styles.pageNumber} aria-label={`Current page ${currentPage}`}>
            Page {currentPage}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!canGoNext || loading}
            className={`${styles.button} ${styles.buttonNext}`}
            aria-label="Go to next page"
          >
            {loading ? 'Loading...' : 'Next →'}
          </button>
        </div>
      </div>

      {transactions.length === 0 && !loading && (
        <div className={styles.emptyState}>
          No transactions found
        </div>
      )}
    </div>
  );
});

TransactionsPage.displayName = 'TransactionsPage';

export default TransactionsPage;
