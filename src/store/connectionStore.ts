import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WalletConnection, WalletConnectionStatus, NetworkConfig } from '../types/wallet';
import { getCurrentNetworkConfig, getCurrentNetwork } from '../config/sui-client';

interface ConnectionState {
  // Connection state
  connection: WalletConnection;
  network: string;
  networkConfig: NetworkConfig;
  
  // Wallet integration state
  availableWallets: string[];
  installedWallets: string[];
  
  // Connection actions
  setConnection: (connection: Partial<WalletConnection>) => void;
  connect: (walletName: string, address: string) => void;
  disconnect: () => void;
  setConnectionStatus: (status: WalletConnectionStatus) => void;
  
  // Network actions
  setNetwork: (network: string) => void;
  setNetworkConfig: (config: NetworkConfig) => void;
  
  // Wallet detection
  setAvailableWallets: (wallets: string[]) => void;
  setInstalledWallets: (wallets: string[]) => void;
  
  // Getters
  isConnected: () => boolean;
  isConnecting: () => boolean;
  getCurrentAddress: () => string | null;
  
  // Reset
  reset: () => void;
}

const initialConnection: WalletConnection = {
  address: null,
  status: 'disconnected',
  walletName: null,
};

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      // Initial state
      connection: initialConnection,
      network: getCurrentNetwork(),
      networkConfig: getCurrentNetworkConfig(),
      availableWallets: [],
      installedWallets: [],
      
      // Connection actions
      setConnection: (updates) => set((state) => ({
        connection: { ...state.connection, ...updates },
      })),
      
      connect: (walletName, address) => set({
        connection: {
          address,
          status: 'connected',
          walletName,
        },
      }),
      
      disconnect: () => set({
        connection: initialConnection,
      }),
      
      setConnectionStatus: (status) => set((state) => ({
        connection: { ...state.connection, status },
      })),
      
      // Network actions
      setNetwork: (network) => set({ network }),
      
      setNetworkConfig: (config) => set({ networkConfig: config }),
      
      // Wallet detection
      setAvailableWallets: (wallets) => set({ availableWallets: wallets }),
      
      setInstalledWallets: (wallets) => set({ installedWallets: wallets }),
      
      // Getters
      isConnected: () => {
        const state = get();
        return state.connection.status === 'connected' && !!state.connection.address;
      },
      
      isConnecting: () => {
        const state = get();
        return state.connection.status === 'connecting';
      },
      
      getCurrentAddress: () => {
        const state = get();
        return state.connection.address;
      },
      
      // Reset
      reset: () => set({
        connection: initialConnection,
        availableWallets: [],
        installedWallets: [],
      }),
    }),
    {
      name: 'suizen-connection-store',
      partialize: (state) => ({
        // Persist connection and network info
        connection: state.connection,
        network: state.network,
      }),
    }
  )
);

// Selector hooks
export const useConnection = () => useConnectionStore((state) => state.connection);
export const useNetwork = () => useConnectionStore((state) => state.network);
export const useNetworkConfig = () => useConnectionStore((state) => state.networkConfig);
export const useIsConnected = () => useConnectionStore((state) => state.isConnected());
export const useIsConnecting = () => useConnectionStore((state) => state.isConnecting());
export const useCurrentAddress = () => useConnectionStore((state) => state.getCurrentAddress());