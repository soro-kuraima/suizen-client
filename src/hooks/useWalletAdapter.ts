import { useEffect, useCallback } from 'react';
import { 
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
  useConnectWallet,
  useWallets,
  useSignTransaction,
  useSignAndExecuteTransaction,
  useSuiClient
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { useConnectionStore } from '../store/connectionStore';
import { getCurrentNetworkConfig } from '../config/sui-client';
import { toast } from 'sonner';

/**
 * Enhanced wallet adapter hook using dApp Kit
 */
export const useWalletAdapter = () => {
  const currentAccount = useCurrentAccount();
  const { currentWallet, connectionStatus } = useCurrentWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutate: connectWallet } = useConnectWallet();
  const wallets = useWallets();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  
  // Get network config from our config system
  const networkConfig = getCurrentNetworkConfig();
  const packageAddress = networkConfig.packageAddress;

  // Connection store integration
  const { 
    setConnection, 
    connect: updateConnectionStore, 
    disconnect: clearConnectionStore 
  } = useConnectionStore();

  // Update connection store when wallet state changes
  useEffect(() => {
    if (currentAccount && currentWallet) {
      updateConnectionStore(currentWallet.name, currentAccount.address);
      setConnection({ 
        status: 'connected',
        walletName: currentWallet.name,
        address: currentAccount.address 
      });
    } else if (connectionStatus === 'connecting') {
      setConnection({ status: 'connecting' });
    } else if (connectionStatus === 'disconnected') {
      clearConnectionStore();
    }
  }, [
    currentAccount, 
    currentWallet, 
    connectionStatus,
    updateConnectionStore,
    clearConnectionStore,
    setConnection
  ]);

  // Connect to a specific wallet
  const connect = useCallback(async (walletName: string) => {
    try {
      const wallet = wallets.find(w => w.name === walletName);
      if (!wallet) {
        throw new Error(`Wallet ${walletName} not found`);
      }

      setConnection({ status: 'connecting' });
      
      await new Promise<void>((resolve, reject) => {
        connectWallet(
          { wallet },
          {
            onSuccess: () => {
              toast.success(`Connected to ${walletName}`);
              resolve();
            },
            onError: (error) => {
              toast.error(`Failed to connect: ${error.message}`);
              setConnection({ status: 'error' });
              reject(error);
            },
          }
        );
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setConnection({ status: 'error' });
      throw error;
    }
  }, [wallets, connectWallet, setConnection]);

  // Disconnect wallet
  const handleDisconnect = useCallback(async () => {
    try {
      await new Promise<void>((resolve) => {
        disconnect(undefined, {
          onSuccess: () => {
            toast.success('Wallet disconnected');
            clearConnectionStore();
            resolve();
          },
          onError: (error) => {
            console.error('Disconnect error:', error);
            // Still clear the connection store even if disconnect fails
            clearConnectionStore();
            resolve();
          },
        });
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      // Ensure we clear the connection store even on error
      clearConnectionStore();
      throw error;
    }
  }, [disconnect, clearConnectionStore]);

  // Sign transaction
  const handleSignTransaction = useCallback(async (transaction: Transaction) => {
    if (!currentAccount) {
      throw new Error('No wallet connected');
    }

    try {
      const result = await signTransaction({
        transaction,
        account: currentAccount,
      });

      return result;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  }, [signTransaction, currentAccount]);

  // Sign and execute transaction
 const handleSignAndExecuteTransaction = useCallback(async (
  transaction: Transaction
): Promise<SuiTransactionBlockResponse> => {
  if (!currentAccount) {
    throw new Error('No wallet connected');
  }

  try {
    const result = await signAndExecuteTransaction({
      transaction,
      account: currentAccount,
    });

    console.log('✅ Transaction submitted:', result.digest);

    // Retry getTransactionBlock for 8 seconds, checking every 500ms
    const maxAttempts = 16; // 8 seconds / 500ms = 16 attempts
    const delayMs = 500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔍 Fetching transaction details (attempt ${attempt}/${maxAttempts})...`);
        
        const fullTransaction = await suiClient.getTransactionBlock({
          digest: result.digest,
          options: {
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
            showBalanceChanges: true,
          },
        });

        console.log('✅ Transaction details retrieved successfully!');
        console.log(fullTransaction);
        console.log(fullTransaction.effects);

        if (fullTransaction.effects?.status?.status !== 'success') {
          if (attempt < maxAttempts) {
            console.log(`⏳ Transaction not indexed yet, waiting ${delayMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          }
        }

        return fullTransaction;

      } catch (error) {
        const isNotFound = error.message?.includes('not found') || 
                          error.message?.includes('digest') ||
                          error.status === 404;

        if (isNotFound && attempt < maxAttempts) {
          throw new Error(`Transaction failed: ${error || 'Unknown error'}`);
        }
      }
    }

    // If we get here, we've exhausted all retries
    throw new Error(`Transaction ${result.digest} not found after ${(maxAttempts * delayMs) / 1000} seconds`);

  } catch (error) {
    console.error('❌ Transaction execution failed:', error);
    throw error;
  }
}, [signAndExecuteTransaction, currentAccount, suiClient]);
  // Get current accounts
  const getAccounts = useCallback(async (): Promise<string[]> => {
    if (!currentAccount) {
      return [];
    }
    return [currentAccount.address];
  }, [currentAccount]);

  // Check if specific wallet is installed
  const isWalletInstalled = useCallback((walletName: string): boolean => {
    return wallets.some(w => w.name === walletName);
  }, [wallets]);

  // Get available wallet info
  const getAvailableWallets = useCallback(() => {
    return wallets.map(wallet => ({
      name: wallet.name,
      icon: wallet.icon,
      installed: true, // All wallets in the list are installed/detected
      version: wallet.version,
      accounts: wallet.accounts,
    }));
  }, [wallets]);

  return {
    // State
    currentAccount,
    currentWallet,
    connectionStatus,
    connected: connectionStatus === 'connected',
    connecting: connectionStatus === 'connecting',
    wallets: getAvailableWallets(),
    suiClient,
    packageAddress,
    
    // Actions
    connect,
    disconnect: handleDisconnect,
    signTransaction: handleSignTransaction,
    signAndExecuteTransaction: handleSignAndExecuteTransaction,
    getAccounts,
    
    // Utils
    isWalletInstalled,
    
    // Legacy compatibility
    availableWallets: getAvailableWallets(),
    walletAdapter: currentWallet,
  };
};