import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { useCurrentAddress } from '../../store/connectionStore';
import { walletService } from '../services/walletService';
import { WALLET_QUERY_KEYS } from './useWallet';

/**
 * Hook to fetch and manage user's wallets
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
        // This is a simplified approach - in a real app, you'd have better indexing
        const wallets = [];
        
        // For now, we'll create mock wallets based on owner caps
        // In production, you'd query the actual wallet objects
        for (let i = 0; i < ownerCaps.length; i++) {
          const capId = ownerCaps[i];
          
          // Try to find associated wallet (this is simplified)
          // In reality, you'd need to query the blockchain for wallets where this user is an owner
          const mockWallet = {
            objectId: `wallet_${i}_${Date.now()}`, // This should be the actual wallet ID
            balance: '1000000000', // 1 SUI in MIST
            owners: [currentAddress], // This should include all owners
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
 * Enhanced hook that queries actual wallet objects by events
 */
export const useUserWalletsFromEvents = () => {
  const currentAddress = useCurrentAddress();
  const { setWallets } = useWalletStore();

  const query = useQuery({
    queryKey: [...WALLET_QUERY_KEYS.wallets, 'events', currentAddress],
    queryFn: async () => {
      if (!currentAddress) return [];
      
      try {
        // Query WalletCreatedEvent events where current user is involved
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