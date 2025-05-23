import React, { useEffect } from 'react';
import {
  SuiClientProvider,
  WalletProvider as DAppKitWalletProvider,
  createNetworkConfig
} from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NETWORKS } from '../constants/config';
import { useConnectionStore } from '../store/connectionStore';

// Create network configuration
const { networkConfig } = createNetworkConfig({
  testnet: {
    url: getFullnodeUrl('testnet'),
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
  defaultNetwork?: 'testnet' | 'devnet' | 'localnet';
}

// Network Sync component to sync network state
const NetworkSync: React.FC<{ defaultNetwork: string }> = ({ defaultNetwork }) => {
  const { network, setNetwork, setNetworkConfig } = useConnectionStore();

  useEffect(() => {
    // Initialize network in store if not set
    if (!network) {
      setNetwork(defaultNetwork);
      setNetworkConfig(NETWORKS[defaultNetwork as keyof typeof NETWORKS]);
    }
  }, [network, defaultNetwork, setNetwork, setNetworkConfig]);

  return null;
};

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  defaultNetwork = 'testnet'
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={defaultNetwork}
        onNetworkChange={(network) => {
          console.log('Network changed in SuiClientProvider:', network);
          // We don't update here as this fires on initial load
          // and would conflict with our NetworkSync component
        }}
      >
        {/* Add NetworkSync component to initialize network in store */}
        <NetworkSync defaultNetwork={defaultNetwork} />

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