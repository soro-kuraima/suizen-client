// Fixed version of src/api/hooks/useUserWallets.ts

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { useCurrentAddress } from '../../store/connectionStore';
import { walletService } from '../services/walletService';
import { WALLET_QUERY_KEYS } from './useWallet';

/**
 * IMPROVED: Hook to fetch user's wallets using owner capabilities 
 * This will find wallets where the user is an owner, not just creator
 */
export const useUserWalletsFromOwnerCaps = () => {
  const currentAddress = useCurrentAddress();
  const { setWallets } = useWalletStore();

  const query = useQuery({
    queryKey: [...WALLET_QUERY_KEYS.wallets, 'ownerCaps', currentAddress],
    queryFn: async () => {
      if (!currentAddress) {
        console.log('❌ No current address, returning empty wallets');
        return [];
      }
      
      try {
        console.log('🔍 Fetching wallets for user via owner caps:', currentAddress);
        
        // Use the new method that finds wallets via owner capabilities
        const wallets = await walletService.getUserWalletsByOwnerCaps(currentAddress);
        
        console.log('✅ Found', wallets.length, 'wallets for user:', currentAddress);
        
        return wallets;
        
      } catch (error) {
        console.error('❌ Failed to fetch user wallets via owner caps:', error);
        return [];
      }
    },
    enabled: !!currentAddress,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refetch every minute
  });

  // Update store when data changes
  useEffect(() => {
    if (query.data) {
      console.log('📝 Updating wallet store with', query.data.length, 'wallets');
      setWallets(query.data);
    }
  }, [query.data, setWallets]);

  return query;
};

/**
 * Original hook - now deprecated but kept for backward compatibility
 */
export const useUserWallets = () => {
  const currentAddress = useCurrentAddress();
  const { setWallets } = useWalletStore();

  const query = useQuery({
    queryKey: [...WALLET_QUERY_KEYS.wallets, currentAddress],
    queryFn: async () => {
      if (!currentAddress) return [];
      
      try {
        // Get owner capabilities first
        const ownerCaps = await walletService.getOwnerCapabilities(currentAddress);
        
        if (ownerCaps.length === 0) {
          return [];
        }

        // For each owner cap, we need to find the associated wallet
        const wallets = [];
        
        // For now, we'll create mock wallets based on owner caps
        // In production, you'd query the actual wallet objects
        for (let i = 0; i < ownerCaps.length; i++) {
          const capId = ownerCaps[i];
          
          // Try to find associated wallet (this is simplified)
          const mockWallet = {
            objectId: `wallet_${i}_${Date.now()}`,
            balance: '1000000000', // 1 SUI in MIST
            owners: [currentAddress],
            requiredApprovals: 2,
            createdAt: Date.now(),
            resetPeriodMs: 24 * 60 * 60 * 1000, // 24 hours
            version: '1',
            digest: 'mock_digest',
          };
          
          wallets.push(mockWallet);
        }
        
        return wallets;
        
      } catch (error) {
        console.error('Failed to fetch user wallets:', error);
        return [];
      }
    },
    enabled: !!currentAddress,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Update store when data changes
  useEffect(() => {
    if (query.data) {
      setWallets(query.data);
    }
  }, [query.data, setWallets]);

  return query;
};

/**
 * FIXED: Enhanced hook that queries actual wallet objects by events
 * Now also checks if user is an owner, not just creator
 */
export const useUserWalletsFromEvents = () => {
  const currentAddress = useCurrentAddress();
  const { setWallets } = useWalletStore();

  const query = useQuery({
    queryKey: [...WALLET_QUERY_KEYS.wallets, 'events', currentAddress],
    queryFn: async () => {
      if (!currentAddress) return [];
      
      try {
        console.log('🔍 Fetching wallets via events for:', currentAddress);
        
        // First, try to get wallets via owner capabilities (more reliable)
        const walletsFromCaps = await walletService.getUserWalletsByOwnerCaps(currentAddress);
        
        if (walletsFromCaps.length > 0) {
          console.log('✅ Found wallets via owner caps:', walletsFromCaps.length);
          return walletsFromCaps;
        }
        
        // Fallback: Query WalletCreatedEvent events where current user might be involved
        console.log('🔄 Fallback: Checking creation events...');
        const events = await walletService.getUserWalletEvents(currentAddress);
        
        const walletList = [];
        for (const event of events) {
          try {
            const walletDetails = await walletService.getWallet(event.walletId);
            if (walletDetails && walletDetails.owners?.includes(currentAddress)) {
              walletList.push(walletDetails);
            }
          } catch (error) {
            console.warn(`Failed to fetch wallet ${event.walletId}:`, error);
          }
        }
        
        console.log('✅ Found wallets via events:', walletList.length);
        return walletList;
        
      } catch (error) {
        console.error('Failed to fetch user wallets from events:', error);
        return [];
      }
    },
    enabled: !!currentAddress,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
  });

  // Update store when data changes
  useEffect(() => {
    if (query.data) {
      setWallets(query.data);
    }
  }, [query.data, setWallets]);

  return query;
};

/**
 * RECOMMENDED: Use this hook - it's the most reliable
 * This uses owner capabilities to find wallets where the user is an owner
 */
export default useUserWalletsFromOwnerCaps;