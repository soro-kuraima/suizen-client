import React from 'react';
import { 
  SuiClientProvider, 
  WalletProvider as DAppKitWalletProvider,
  createNetworkConfig
} from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NETWORKS } from '../constants/config';

// Create network configuration
const { networkConfig } = createNetworkConfig({
  testnet: {
    url: getFullnodeUrl('testnet'),
  },
  mainnet: {
    url: getFullnodeUrl('mainnet'),
  },
  devnet: {
    url: getFullnodeUrl('devnet'),
  },
  localnet: {
    url: NETWORKS.localnet.rpcUrl,
  },
});

// Query client for wallet provider
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

interface WalletProviderProps {
  children: React.ReactNode;
  defaultNetwork?: 'testnet' | 'mainnet' | 'devnet' | 'localnet';
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ 
  children, 
  defaultNetwork = 'testnet' 
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider 
        networks={networkConfig} 
        defaultNetwork={defaultNetwork}
      >
        <DAppKitWalletProvider
          autoConnect={true}
          storage={{
            // Custom storage adapter for persistence
            getItem: (key: string) => {
              try {
                return localStorage.getItem(key);
              } catch {
                return null;
              }
            },
            setItem: (key: string, value: string) => {
              try {
                localStorage.setItem(key, value);
              } catch {
                // Ignore storage errors
              }
            },
            removeItem: (key: string) => {
              try {
                localStorage.removeItem(key);
              } catch {
                // Ignore storage errors
              }
            },
          }}
        >
          {children}
        </DAppKitWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};