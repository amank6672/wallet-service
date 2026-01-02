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
  
  // Pagination and sorting state
  const [currentCursor, setCurrentCursor] = useState(null);
  const [currentPageCursor, setCurrentPageCursor] = useState(null);
  const [pageHistory, setPageHistory] = useState([]);
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);
  const [currentPage, setCurrentPage] = useState(1);

  // Get sort parameters
  const sortBy = sorting[0]?.id || 'createdAt';
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  // React Query hook for transactions
  const {
    data,
    isLoading,
    error,
    isFetching,
  } = useTransactions(walletId, {
    limit: PAGINATION.DEFAULT_PAGE_SIZE,
    cursor: currentPageCursor,
    sortBy,
    sortOrder,
    enabled: !!walletId,
  });

  const transactions = data?.transactions || [];
  const pagination = data?.pagination || null;

  // Update cursor when data changes
  useEffect(() => {
    if (transactions.length > 0) {
      const lastTx = transactions[transactions.length - 1];
      setCurrentCursor(lastTx.createdAt);
    } else {
      setCurrentCursor(null);
    }
  }, [transactions]);

  // Update current page cursor when data loads
  useEffect(() => {
    if (data) {
      setCurrentPageCursor(currentPageCursor);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextPage = useCallback(() => {
    if (pagination?.hasMore && currentCursor) {
      // Store the cursor that was used to load the current page
      setPageHistory(prev => {
        if (prev.length === 0 || prev[prev.length - 1] !== currentPageCursor) {
          return [...prev, currentPageCursor];
        }
        return prev;
      });
      
      setCurrentPage(prev => prev + 1);
      setCurrentPageCursor(currentCursor);
    }
  }, [pagination, currentCursor, currentPageCursor]);

  const handlePreviousPage = useCallback(() => {
    if (pageHistory.length > 0) {
      const previousCursor = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentPage(prev => Math.max(1, prev - 1));
      setCurrentPageCursor(previousCursor);
    } else if (currentPage > 1) {
      setCurrentPage(1);
      setPageHistory([]);
      setCurrentCursor(null);
      setCurrentPageCursor(null);
    }
  }, [pageHistory, currentPage]);

  const handleFirstPage = useCallback(() => {
    setCurrentPage(1);
    setPageHistory([]);
    setCurrentCursor(null);
    setCurrentPageCursor(null);
  }, []);

  const handleSortingChange = useCallback((newSorting) => {
    setSorting(newSorting);
    setCurrentPage(1);
    setPageHistory([]);
    setCurrentCursor(null);
    setCurrentPageCursor(null);
  }, []);

  const handleExport = useCallback(() => {
    if (walletId) {
      exportCSV(walletId);
    }
  }, [walletId]);

  const canGoNext = pagination?.hasMore && currentCursor && !isLoading;
  const canGoPrevious = pageHistory.length > 0 || currentPage > 1;
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
              Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              {pagination?.hasMore && ' (more available)'}
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
