import React, { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Network } from 'lucide-react';
import { useSuiClientContext } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { switchNetwork as updateSuiClientNetwork } from '../../../config/sui-client';
import { useConnectionStore } from '../../../store/connectionStore';

const NETWORK_NAMES = {
  devnet: 'Devnet'
};

const NETWORK_BADGES = {
  testnet: { variant: 'secondary' as const, label: 'Test' },
  mainnet: { variant: 'default' as const, label: 'Live' },
  devnet: { variant: 'secondary' as const, label: 'Dev' },
  localnet: { variant: 'outline' as const, label: 'Local' },
};

export const NetworkSelector: React.FC = () => {
  // Get network context from dApp Kit
  const suiClientContext = useSuiClientContext();

  // Get our connection store to sync network state
  const { setNetwork, network: storedNetwork } = useConnectionStore();

  // Sync stored network with dApp Kit on component mount
  useEffect(() => {
    if (suiClientContext && storedNetwork) {
      // Only update if networks don't match
      if (storedNetwork !== suiClientContext.network) {
        try {
          suiClientContext.selectNetwork(storedNetwork);
          console.log('Synced network from store:', storedNetwork);
        } catch (error) {
          console.error('Failed to sync network from store:', error);
        }
      }
    }
  }, [storedNetwork, suiClientContext]);

  // Check if the context is available
  if (!suiClientContext) {
    return (
      <div className="flex items-center space-x-2">
        <Network className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline">Network</Badge>
      </div>
    );
  }

  const { network, networks, selectNetwork } = suiClientContext;

  const handleNetworkChange = (networkName: string) => {
    try {
      // 1. Update the network in dApp Kit context
      selectNetwork(networkName);

      // 2. Update our SuiClient configuration
      updateSuiClientNetwork(networkName);

      // 3. Update our connection store
      setNetwork(networkName);

      // 4. Show confirmation to user
      toast.success(`Switched to ${NETWORK_NAMES[networkName as keyof typeof NETWORK_NAMES] || networkName}`);

      // 5. Force reload page to ensure all components use the new network
      // This is important as some hooks may have cached data from the previous network
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error('Failed to switch network');
    }
  };

  // Get available networks
  const availableNetworks = Object.keys(networks);

  if (availableNetworks.length <= 1) {
    // Don't show selector if only one network
    return (
      <div className="flex items-center space-x-2">
        <Network className="h-4 w-4 text-muted-foreground" />
        <Badge variant={NETWORK_BADGES[network as keyof typeof NETWORK_BADGES]?.variant || 'outline'}>
          {NETWORK_NAMES[network as keyof typeof NETWORK_NAMES] || network}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Network className="h-4 w-4 text-muted-foreground" />

      <Select value={network} onValueChange={handleNetworkChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Network" />
        </SelectTrigger>

        <SelectContent>
          {availableNetworks.map((networkKey) => {
            const networkName = NETWORK_NAMES[networkKey as keyof typeof NETWORK_NAMES] || networkKey;
            const badge = NETWORK_BADGES[networkKey as keyof typeof NETWORK_BADGES];

            return (
              <SelectItem key={networkKey} value={networkKey}>
                <div className="flex items-center space-x-2">
                  <span>{networkName}</span>
                  {badge && (
                    <Badge variant={badge.variant} className="text-xs">
                      {badge.label}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};