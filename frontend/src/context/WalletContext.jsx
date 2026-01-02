import { createContext, useContext } from 'react';

const WalletContext = createContext(null);

/**
 * Wallet Context Provider
 * Simplified context - wallet state is now managed by React Query
 * This context is kept for backward compatibility if needed
 */
export function WalletProvider({ children }) {
  const value = {};

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Hook to use wallet context
 * Note: Wallet state is now managed by React Query hooks
 */
export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
}

