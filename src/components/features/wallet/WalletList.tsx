import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Skeleton } from '../../ui/skeleton';
import { 
  Wallet, 
  Users, 
  Plus, 
  TrendingUp,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useWalletStore, useSelectedWallet } from '../../../store/walletStore';
import { useUserWalletsFromEvents } from '../../../api/hooks/useUserWallets';
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';
import { formatSuiAmount, getTimeUntilReset, formatDuration } from '../../../utils/sui';
import { cn } from '../../../lib/utils';

export const WalletList: React.FC = () => {
  const { currentAccount } = useWalletAdapter();
  const wallets = useWalletStore(state => state.wallets);
  const selectedWallet = useSelectedWallet();
  const setSelectedWallet = useWalletStore(state => state.setSelectedWallet);
  
  // Load user's wallets
  const { isLoading, refetch } = useUserWalletsFromEvents();

  // Auto-select first wallet if none selected
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0].objectId);
    }
  }, [wallets, selectedWallet, setSelectedWallet]);

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
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (wallets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              My Wallets
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            You don't have any wallets yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            My Wallets
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{wallets.length}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Multi-signature wallets you own
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {wallets.map((wallet) => {
          const isSelected = selectedWallet?.objectId === wallet.objectId;
          const balance = parseFloat(wallet.balance || '0') / 1_000_000_000; // Convert MIST to SUI
          
          return (
            <div
              key={wallet.objectId}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent",
                isSelected && "ring-2 ring-primary bg-accent"
              )}
              onClick={() => setSelectedWallet(wallet.objectId)}
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
                
                {isSelected && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
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
                      <span>Next reset</span>
                    </div>
                    <span className="font-medium">
                      {formatDuration(wallet.resetPeriodMs)}
                    </span>
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