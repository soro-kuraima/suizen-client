// src/hooks/useNetworkState.ts

import { useEffect, useState } from 'react';
import { useSuiClientContext } from '@mysten/dapp-kit';
import { useConnectionStore } from '../store/connectionStore';
import { getCurrentNetworkConfig, switchNetwork as updateSuiClientNetwork } from '../config/sui-client';
import { toast } from 'sonner';

/**
 * Hook to manage network state and synchronization across different parts of the app
 */
export const useNetworkState = () => {
  const suiClientContext = useSuiClientContext();
  const { network: storedNetwork, setNetwork, setNetworkConfig } = useConnectionStore();
  const [syncing, setSyncing] = useState(false);

  // Get current network info
  const currentNetwork = suiClientContext?.network || storedNetwork;
  const currentNetworkConfig = getCurrentNetworkConfig();
  
  // Network list from dApp Kit
  const availableNetworks = suiClientContext ? 
    Object.keys(suiClientContext.networks) : 
    Object.keys(currentNetworkConfig ? { [currentNetwork]: currentNetworkConfig } : {});

  // Switch network function that updates all relevant stores
  const switchNetwork = async (newNetwork: string) => {
    if (!suiClientContext || syncing) return false;
    
    if (newNetwork === currentNetwork) {
      return true; // Already on this network
    }
    
    try {
      setSyncing(true);
      
      // 1. Update dApp Kit context
      suiClientContext.selectNetwork(newNetwork);
      
      // 2. Update our SuiClient configuration
      updateSuiClientNetwork(newNetwork);
      
      // 3. Update connection store
      setNetwork(newNetwork);
      setNetworkConfig(getCurrentNetworkConfig());
      
      // Success!
      toast.success(`Switched to ${newNetwork}`);
      
      // 4. Reload page to ensure all components use the new network
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error('Failed to switch network');
      return false;
    } finally {
      setSyncing(false);
    }
  };

  // Sync network state on mount
  useEffect(() => {
    const syncNetworks = async () => {
      if (!suiClientContext || syncing) return;
      
      // If networks don't match, synchronize them
      if (storedNetwork && storedNetwork !== suiClientContext.network) {
        try {
          setSyncing(true);
          
          // Update dApp Kit context to match stored network
          await suiClientContext.selectNetwork(storedNetwork);
          console.log('Synced network from store:', storedNetwork);
          
          // Update our SuiClient configuration
          updateSuiClientNetwork(storedNetwork);
        } catch (error) {
          console.error('Failed to sync network from store:', error);
          
          // If we failed to set dApp Kit to our stored network,
          // update our store to match dApp Kit
          setNetwork(suiClientContext.network);
          setNetworkConfig(getCurrentNetworkConfig());
        } finally {
          setSyncing(false);
        }
      }
    };
    
    syncNetworks();
  }, [setNetwork, setNetworkConfig, storedNetwork, suiClientContext, syncing]);

  return {
    currentNetwork,
    currentNetworkConfig,
    availableNetworks,
    switchNetwork,
    isSyncing: syncing
  };
};

export default useNetworkState;