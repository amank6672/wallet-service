import { useState, useCallback, memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet, useCreateWallet, useTransaction } from '../hooks/useWalletQuery.js';
import { useDebounce } from '../utils/debounce.js';
import { formatAmount } from '../utils/formatters.js';
import { LoadingSkeleton } from '../components/LoadingSkeleton.jsx';
import { STORAGE_KEYS } from '../config/constants.js';
import styles from './WalletPage.module.css';

/**
 * Generate idempotency key for transaction
 */
function generateIdempotencyKey() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const WalletPage = memo(function WalletPage() {
  const walletId = localStorage.getItem(STORAGE_KEYS.WALLET_ID);
  
  // React Query hooks
  const { data: wallet, isLoading: walletLoading, error: walletError } = useWallet(walletId, {
    enabled: !!walletId,
  });
  
  const createWalletMutation = useCreateWallet();
  const transactionMutation = useTransaction();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  
  // Debounce name input for validation
  const debouncedName = useDebounce(name, 300);

  // Get error from either query or mutation
  const error = walletError?.message || createWalletMutation.error?.message || transactionMutation.error?.message;
  const isLoading = walletLoading || createWalletMutation.isPending || transactionMutation.isPending;

  const handleSetup = useCallback(async () => {
    if (!name.trim()) {
      return;
    }

    try {
      const result = await createWalletMutation.mutateAsync({
        name: name.trim(),
        balance: 0,
      });
      
      if (result?.id) {
        setName('');
      }
    } catch (err) {
      // Error is handled by mutation
      console.error('Failed to create wallet:', err);
    }
  }, [name, createWalletMutation]);

  const handleTransaction = useCallback(async (type) => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0 || !walletId) {
      return;
    }

    try {
      const transactionAmount = type === 'CREDIT' ? parseFloat(amount) : -parseFloat(amount);
      const idempotencyKey = generateIdempotencyKey();
      
      await transactionMutation.mutateAsync({
        walletId,
        amount: transactionAmount,
        description: `${type} transaction`,
        idempotencyKey,
      });
      
      setAmount('');
    } catch (err) {
      // Error is handled by mutation
      console.error('Transaction failed:', err);
    }
  }, [amount, walletId, transactionMutation]);

  const handleNameChange = useCallback((e) => {
    setName(e.target.value);
  }, []);

  const handleAmountChange = useCallback((e) => {
    setAmount(e.target.value);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !wallet && name.trim()) {
        handleSetup();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [wallet, name, handleSetup]);

  if (walletLoading && !wallet) {
    return (
      <div className={styles.container}>
        <LoadingSkeleton lines={5} showHeader />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Create Wallet</h2>
          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}
          <div className={styles.formGroup}>
            <input
              type="text"
              placeholder="User name"
              value={name}
              onChange={handleNameChange}
              className={styles.input}
              disabled={isLoading}
              aria-label="User name"
              aria-required="true"
              onKeyPress={(e) => e.key === 'Enter' && handleSetup()}
            />
            <button 
              onClick={handleSetup}
              disabled={isLoading || !name.trim()}
              className={`${styles.button} ${styles.buttonPrimary}`}
              aria-label="Create wallet"
            >
              {isLoading ? 'Creating...' : 'Create Wallet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>{wallet.name}</h2>
        <div className={styles.balanceContainer}>
          <span className={styles.balanceLabel}>Balance:</span>
          <span className={styles.balanceAmount}>
            {formatAmount(wallet.balance || 0)}
          </span>
        </div>

        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
            {transactionMutation.error?.code === 'INSUFFICIENT_BALANCE' && (
              <span> - Insufficient balance</span>
            )}
          </div>
        )}

        <div className={styles.transactionSection}>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={handleAmountChange}
            className={styles.input}
            disabled={isLoading}
            min="0"
            step="0.01"
            aria-label="Transaction amount"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && amount) {
                // Default to credit on Enter
                handleTransaction('CREDIT');
              }
            }}
          />

          <div className={styles.buttonGroup}>
            <button 
              onClick={() => handleTransaction('CREDIT')}
              disabled={isLoading || !amount}
              className={`${styles.button} ${styles.buttonCredit}`}
              aria-label="Credit transaction"
            >
              Credit
            </button>
            <button 
              onClick={() => handleTransaction('DEBIT')}
              disabled={isLoading || !amount}
              className={`${styles.button} ${styles.buttonDebit}`}
              aria-label="Debit transaction"
            >
              Debit
            </button>
          </div>
        </div>

        {isLoading && (
          <div className={styles.loadingMessage} aria-live="polite">
            Processing...
          </div>
        )}

        <div className={styles.linkContainer}>
          <Link to="/transactions" className={styles.link}>
            View Transactions →
          </Link>
        </div>
      </div>
    </div>
  );
});

WalletPage.displayName = 'WalletPage';

export default WalletPage;
