// Fixed version of src/components/features/wallet/WalletList.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Skeleton } from '../../ui/skeleton';
import {
  Wallet,
  Users,
  Plus,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useWalletStore, useSelectedWallet } from '../../../store/walletStore';
import { useUserWalletsFromOwnerCaps } from '../../../api/hooks/useUserWallets'; // Updated import
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';
import { formatSuiAmount, formatDuration } from '../../../utils/sui';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';

export const WalletList: React.FC = () => {
  const { currentAccount } = useWalletAdapter();
  const selectedWallet = useSelectedWallet();
  const setSelectedWallet = useWalletStore(state => state.setSelectedWallet);

  // Use the NEW hook that queries wallets from owner capabilities
  const { data: userWallets = [], isLoading, error, refetch } = useUserWalletsFromOwnerCaps();

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Wallets refreshed');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to refresh wallets');
    }
  };

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 WalletList Debug Info:');
    console.log('Current user:', currentAccount?.address);
    console.log('Wallets found:', userWallets.length);
    console.log('Selected wallet:', selectedWallet?.objectId);
    console.log('Loading state:', isLoading);
    console.log('Error state:', error);
  }, [currentAccount, userWallets, selectedWallet, isLoading, error]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            My Wallets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            My Wallets
          </CardTitle>
          <CardDescription className="text-destructive">
            Failed to load wallets: {error.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (userWallets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Wallet className="mr-2 h-5 w-5" />
                My Wallets
              </CardTitle>
              <CardDescription>
                {currentAccount?.address ?
                  "You don't have any wallets yet" :
                  "Connect your wallet to see your multi-sig wallets"
                }
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentAccount?.address ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/wallet/create'}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Wallet
            </Button>
          ) : (
            <div className="text-center text-muted-foreground">
              Please connect your wallet first
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              My Wallets
            </CardTitle>
            <CardDescription>
              Multi-signature wallets you own
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{userWallets.length}</Badge>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {userWallets.map((wallet) => {
          const isSelected = selectedWallet?.objectId === wallet.objectId; // Convert MIST to SUI
          const isUserOwner = wallet.owners?.includes(currentAccount?.address || '');

          return (
            <div
              key={wallet.objectId}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent",
                isSelected && "ring-2 ring-primary bg-accent"
              )}
              onClick={() => {
                console.log('🎯 Selecting wallet:', wallet.objectId);
                setSelectedWallet(wallet.objectId);
              }}
            >
              {/* Wallet Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10">
                      <Wallet className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">Multi-Sig Wallet</div>
                    <div className="text-xs text-muted-foreground">
                      {wallet.objectId.slice(0, 8)}...{wallet.objectId.slice(-6)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {isSelected && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                  {isUserOwner && (
                    <Badge variant="secondary" className="text-xs">
                      Owner
                    </Badge>
                  )}
                  {/* Show if wallet was recently created */}
                  {wallet.createdAt && Date.now() - wallet.createdAt < 5 * 60 * 1000 && (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
              </div>

              {/* Balance */}
              <div className="mb-3">
                <div className="text-lg font-semibold">
                  {formatSuiAmount(wallet.balance, 4, false)} SUI
                </div>
                <div className="text-xs text-muted-foreground">
                  Available Balance
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{wallet.owners?.length || 0} owners</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  <span>{wallet.requiredApprovals}-of-{wallet.owners?.length || 0}</span>
                </div>
              </div>

              {/* Reset Timer (if available) */}
              {wallet.resetPeriodMs && (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Reset period</span>
                    </div>
                    <span className="font-medium">
                      {formatDuration(wallet.resetPeriodMs)}
                    </span>
                  </div>
                </div>
              )}

              {/* Creation timestamp for new wallets */}
              {wallet.createdAt && Date.now() - wallet.createdAt < 60 * 60 * 1000 && (
                <div className="mt-2 pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Created {Math.floor((Date.now() - wallet.createdAt) / (60 * 1000))} minutes ago
                  </div>
                </div>
              )}

            </div>
          );
        })}

        {/* Create New Wallet Button */}
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => window.location.href = '/wallet/create'}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Wallet
        </Button>
      </CardContent>
    </Card>
  );
};