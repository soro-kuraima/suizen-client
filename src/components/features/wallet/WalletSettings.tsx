import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Skeleton } from '../../ui/skeleton';
import {
  Users,
  Shield,
  Clock,
  Edit,
  Trash2,
  AlertCircle,
  UserPlus,
  Wallet
} from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import {
  useWallet,
  useSpendingRecords,
  useWalletBalances
} from '../../../api/hooks/useWallet';
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';
import {
  shortenAddress,
  formatDuration,
  mistToSui,
} from '../../../utils/sui';
import { AddOwnerDialog } from './AddOwnerDialog';

interface WalletSettingsProps {
  walletId: string;
  mode: 'owners' | 'settings';
}

// Helper component to show owner with spending limit
const OwnerWithSpendingLimit: React.FC<{
  walletId: string;
  ownerAddress: string;
  index: number;
  isCurrentUser: boolean;
  isOwner: boolean;
}> = ({ walletId, ownerAddress, index, isCurrentUser, isOwner }) => {
  // Fetch this owner's spending record
  const { data: spendingRecord, isLoading } = useSpendingRecords(walletId, ownerAddress);

  const { currentAccount } = useWalletAdapter();



  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {ownerAddress.slice(2, 4).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div>
          <div className="font-medium">
            {ownerAddress === currentAccount.address ? 'You' : `Owner ${index + 1}`}
          </div>
          <div className="text-sm text-muted-foreground">
            {shortenAddress(ownerAddress)}
          </div>
          <div className="text-xs text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-3 w-24" />
            ) : (
              `Spending limit: ${spendingRecord ?
                parseFloat(mistToSui(spendingRecord.spendingLimit)).toFixed(4) :
                '1.0'} SUI`
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isCurrentUser && (
          <Badge variant="secondary">You</Badge>
        )}

        {isOwner && ownerAddress !== currentAccount.address && (
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const WalletSettings: React.FC<WalletSettingsProps> = ({ walletId, mode }) => {
  const { currentAccount } = useWalletAdapter();
  const currentAddress = currentAccount?.address || '';

  const { data: wallet, isLoading, refetch } = useWallet(walletId);
  const { data: balances } = useWalletBalances(walletId);

  // Get this user's spending record for the reset time calculation
  const { data: spendingRecord, isLoading: spendingLoading } =
    useSpendingRecords(walletId, currentAddress);

  const timeUntilReset = useMemo(() => {
    if (!wallet || !wallet.resetPeriodMs) {
      return 0;
    }

    // Use the wallet's reset period directly
    const resetPeriod = wallet.resetPeriodMs;

    // If we don't have spending record data, just return a reasonable default
    // based on the reset period (showing less than one period remaining)
    if (!spendingRecord || !spendingRecord.lastReset) {
      return Math.min(resetPeriod / 2, 12 * 60 * 60 * 1000); // Half period or 12 hours, whichever is smaller
    }

    try {
      const now = Date.now();
      const lastReset = typeof spendingRecord.lastReset === 'number'
        ? spendingRecord.lastReset
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : parseInt(spendingRecord.lastReset as any);

      // Validate that lastReset is a reasonable timestamp
      if (isNaN(lastReset) || lastReset <= 0 || lastReset > now + (365 * 24 * 60 * 60 * 1000)) {
        return resetPeriod / 2; // Return half the reset period as fallback
      }

      // Calculate when the next reset will occur
      const msElapsedSinceLastReset = now - lastReset;
      const periodsElapsed = Math.floor(msElapsedSinceLastReset / resetPeriod);
      const nextResetTime = lastReset + ((periodsElapsed + 1) * resetPeriod);

      // Return the time remaining until next reset
      return Math.max(0, nextResetTime - now);
    } catch (error) {
      console.error("Error calculating time until reset:", error);
      return resetPeriod / 2; // Return half the reset period as fallback
    }
  }, [spendingRecord, wallet]);

  if (isLoading || !wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOwner = wallet.owners?.includes(currentAddress);

  // Handler for when owner is successfully added
  const handleOwnerAdded = () => {
    // Refetch wallet data to update the owners list
    refetch();
  };

  if (mode === 'owners') {
    return (
      <div className="space-y-6">
        {/* Owners List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Wallet Owners
                </CardTitle>
                <CardDescription>
                  Manage who has access to this wallet
                </CardDescription>
              </div>

              {isOwner && (
                <AddOwnerDialog walletId={walletId} onSuccess={handleOwnerAdded}>
                  <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Owner
                  </Button>
                </AddOwnerDialog>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {wallet.owners?.map((ownerAddress, index) => (
                <OwnerWithSpendingLimit
                  key={ownerAddress}
                  walletId={walletId}
                  ownerAddress={ownerAddress}
                  index={index}
                  isCurrentUser={ownerAddress === currentAddress}
                  isOwner={isOwner}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Multi-Sig Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Multi-Signature Settings
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-1">Required Approvals</div>
                <div className="text-2xl font-bold">{wallet.requiredApprovals}</div>
                <div className="text-sm text-muted-foreground">
                  of {wallet.owners?.length} owners
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-1">Security Level</div>
                <div className="text-2xl font-bold">
                  {wallet.requiredApprovals === 1 ? 'Basic' :
                    wallet.requiredApprovals === 2 ? 'Standard' : 'High'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Multi-signature protection
                </div>
              </div>
            </div>

            {isOwner && (
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Update Approval Requirements
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Spending Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Spending Limits & Reset
          </CardTitle>
          <CardDescription>
            Configure automatic spending limit resets
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="font-medium mb-1">Reset Period</div>
              <div className="text-2xl font-bold">
                {formatDuration(wallet.resetPeriodMs)}
              </div>
              <div className="text-sm text-muted-foreground">
                Spending limits reset automatically
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="font-medium mb-1">Next Reset</div>
              <div className="text-2xl font-bold">
                {spendingLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatDuration(timeUntilReset)
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Time until limits reset
              </div>
            </div>
          </div>

          {isOwner && (
            <Button variant="outline" disabled>
              <Edit className="mr-2 h-4 w-4" />
              Update Reset Period
            </Button>
          )}
          <div className="text-xs text-muted-foreground">
            Note: Reset period can only be set during wallet creation
          </div>
        </CardContent>
      </Card>

      {/* Wallet Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Wallet Balance
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="font-medium mb-1">Current Balance</div>
            <div className="text-2xl font-bold">
              {balances && balances[0] ? (
                parseFloat(mistToSui(balances[0].balance)).toFixed(4)
              ) : (
                parseFloat(mistToSui(wallet.balance)).toFixed(4)
              )} SUI
            </div>
            <div className="text-sm text-muted-foreground">
              Available in wallet
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                These actions cannot be undone. Please proceed with caution.
              </AlertDescription>
            </Alert>

            <div className="mt-4 space-y-2">
              <Button variant="destructive" size="sm" disabled>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Wallet Access
              </Button>
              <p className="text-xs text-muted-foreground">
                This feature is not yet implemented for security reasons
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};