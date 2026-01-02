import { useState, useCallback, memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet, useCreateWallet, useTransaction } from '../hooks/useWalletQuery.js';
import { formatAmount } from '../utils/formatters.js';
import { LoadingSkeleton } from '../components/LoadingSkeleton.jsx';
import { STORAGE_KEYS, TRANSACTION_TYPES } from '../config/constants.js';
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
  const [initialBalance, setInitialBalance] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState(TRANSACTION_TYPES.CREDIT);

  // Get error from either query or mutation
  const error = walletError?.message || createWalletMutation.error?.message || transactionMutation.error?.message;
  const isLoading = walletLoading || createWalletMutation.isPending;

  const handleSetup = useCallback(async () => {
    if (!name.trim()) {
      return;
    }

    try {
      const balance = initialBalance && !isNaN(parseFloat(initialBalance)) 
        ? parseFloat(initialBalance) 
        : 0;
      
      const result = await createWalletMutation.mutateAsync({
        name: name.trim(),
        balance: balance,
      });
      
      if (result?.id) {
        setName('');
        setInitialBalance('');
      }
    } catch (err) {
      // Error is handled by mutation
      console.error('Failed to create wallet:', err);
    }
  }, [name, initialBalance, createWalletMutation]);

  const handleTransaction = useCallback(async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0 || !walletId) {
      return;
    }

    try {
      const transactionAmount = transactionType === TRANSACTION_TYPES.CREDIT
        ? parseFloat(amount) 
        : -parseFloat(amount);
      const idempotencyKey = generateIdempotencyKey();
      
      await transactionMutation.mutateAsync({
        walletId,
        amount: transactionAmount,
        description: `${transactionType} transaction`,
        idempotencyKey,
      });
      
      setAmount('');
    } catch (err) {
      // Error is handled by mutation
      console.error('Transaction failed:', err);
    }
  }, [amount, transactionType, walletId, transactionMutation]);

  const handleNameChange = useCallback((e) => {
    setName(e.target.value);
  }, []);

  const handleAmountChange = useCallback((e) => {
    setAmount(e.target.value);
  }, []);

  const handleInitialBalanceChange = useCallback((e) => {
    setInitialBalance(e.target.value);
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
        <LoadingSkeleton />
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
            <input
              type="number"
              placeholder="Initial balance (optional)"
              value={initialBalance}
              onChange={handleInitialBalanceChange}
              className={styles.input}
              disabled={isLoading}
              min="0"
              step="0.0001"
              aria-label="Initial balance"
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
          <label className={styles.label}>Transaction Type</label>
          <div className={styles.typeSelector}>
            <button
              type="button"
              onClick={() => setTransactionType(TRANSACTION_TYPES.CREDIT)}
              className={`${styles.typeButton} ${styles.typeButtonCredit} ${transactionType === TRANSACTION_TYPES.CREDIT ? styles.typeButtonActive : ''}`}
              aria-label="Credit transaction"
              disabled={transactionMutation.isPending}
            >
              <span className={styles.typeIcon}>+</span>
              <span>Add Money</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType(TRANSACTION_TYPES.DEBIT)}
              className={`${styles.typeButton} ${styles.typeButtonDebit} ${transactionType === TRANSACTION_TYPES.DEBIT ? styles.typeButtonActive : ''}`}
              aria-label="Debit transaction"
              disabled={transactionMutation.isPending}
            >
              <span className={styles.typeIcon}>−</span>
              <span>Withdraw Money</span>
            </button>
          </div>

          <label className={styles.label}>Amount</label>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={handleAmountChange}
            className={styles.input}
            disabled={transactionMutation.isPending}
            min="0"
            step="0.0001"
            aria-label="Transaction amount"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && amount && !transactionMutation.isPending) {
                handleTransaction();
              }
            }}
          />

          <button 
            onClick={handleTransaction}
            disabled={transactionMutation.isPending || !amount || parseFloat(amount) <= 0}
            className={`${styles.button} ${styles.buttonSubmit} ${transactionType === TRANSACTION_TYPES.CREDIT ? styles.buttonSubmitCredit : styles.buttonSubmitDebit}`}
            aria-label={`${transactionType === TRANSACTION_TYPES.CREDIT ? 'Add' : 'Withdraw'} money`}
          >
            {transactionMutation.isPending ? 'Processing...' : transactionType === TRANSACTION_TYPES.CREDIT ? 'Add Money' : 'Withdraw Money'}
          </button>
        </div>

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
