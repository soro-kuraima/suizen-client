/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Progress } from '../../ui/progress';
import { Skeleton } from '../../ui/skeleton';
import {
  TrendingUp,
  Users,
  Shield,
  Clock,
  Activity,
  Wallet,
  Send,
  AlertCircle,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { QuickDepositCard } from './QuickDepositCard';
import {
  useWallet,
  useWalletBalances,
  useWalletProposals,
  useTransactionHistory,
  useSpendingRecords
} from '../../../api/hooks/useWallet';
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';
import {
  shortenAddress,
  formatSuiAmount,
  formatTimestamp,
  formatDuration,
  mistToSui
} from '../../../utils/sui';

interface WalletOverviewProps {
  walletId: string;
}

export const WalletOverview: React.FC<WalletOverviewProps> = ({ walletId }) => {
  const { currentAccount } = useWalletAdapter();
  const { data: wallet, isLoading: walletLoading } = useWallet(walletId);
  const { data: balances, isLoading: balancesLoading } = useWalletBalances(walletId);
  const { data: proposals, isLoading: proposalsLoading } = useWalletProposals(walletId);
  const { data: transactions, isLoading: transactionsLoading } = useTransactionHistory(walletId);

  // Fetch REAL spending records for the current user
  const { data: spendingRecord, isLoading: spendingLoading } = useSpendingRecords(
    walletId,
    currentAccount?.address || ''
  );

  // Calculate REAL spending data using the fetched record
  const spendingData = useMemo(() => {
    if (!spendingRecord || !wallet) {
      return {
        spent: 0,
        limit: 0,
        lastReset: Date.now(),
        resetPeriod: wallet?.resetPeriodMs || 24 * 60 * 60 * 1000,
        available: 0
      };
    }

    // Convert from MIST to SUI for display
    const spentAmount = parseFloat(mistToSui(spendingRecord.spentAmount));
    const spendingLimit = parseFloat(mistToSui(spendingRecord.spendingLimit));

    return {
      spent: spentAmount,
      limit: spendingLimit,
      lastReset: spendingRecord.lastReset,
      resetPeriod: wallet.resetPeriodMs,
      available: Math.max(0, spendingLimit - spentAmount)
    };
  }, [spendingRecord, wallet]);

  // Calculate REAL spending percentage
  const spendingPercentage = useMemo(() => {
    if (spendingData.limit === 0) return 0;
    return (spendingData.spent / spendingData.limit) * 100;
  }, [spendingData]);

  // Calculate REAL time until reset
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

  // Check if user can spend
  const canSpend = spendingData.spent < spendingData.limit;

  console.log("wallet overview mounted");

  if (walletLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Wallet not found or failed to load</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats
  const suiBalance = balances?.find(b => b.symbol === 'SUI');
  const balance = parseFloat(suiBalance?.balance || '0') / 1_000_000_000;
  const pendingProposals = proposals?.filter(p => p.approvals.length < wallet.requiredApprovals) || [];
  const recentTransactions = transactions?.transactions.slice(0, 5) || [];

  // Check if user is an owner
  const isOwner = wallet.owners?.includes(currentAccount?.address || '');

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Balance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Balance</p>
                <div className="text-2xl font-bold">
                  {formatSuiAmount(suiBalance?.balance || '0', 4, false)}
                </div>
                <p className="text-xs text-muted-foreground">SUI</p>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owners */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Owners</p>
                <div className="text-2xl font-bold">{wallet.owners?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {wallet.requiredApprovals} required
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Proposals */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Proposals</p>
                <div className="text-2xl font-bold">{pendingProposals.length}</div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="h-8 w-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Level */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security</p>
                <div className="text-2xl font-bold">
                  {wallet.requiredApprovals === 1 ? 'Basic' :
                    wallet.requiredApprovals === 2 ? 'Standard' : 'High'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {wallet.requiredApprovals}-of-{wallet.owners?.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Quick Deposit Section (only show if wallet has low balance) */}
      {walletId && balance < 1 && ( // Show if less than 1 SUI
        <QuickDepositCard
          walletId={walletId}
          walletBalance={suiBalance?.balance || '0'}
          className="lg:col-span-2"
        />
      )}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Limit (if user is owner) */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Your Spending Limit
              </CardTitle>
              <CardDescription>
                Current usage of your individual spending allowance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {spendingLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spent this period</span>
                    <span className="font-medium">
                      {spendingData.spent.toFixed(4)} / {spendingData.limit.toFixed(4)} SUI
                    </span>
                  </div>
                  <Progress value={spendingPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{spendingPercentage.toFixed(1)}% used</span>
                    <span>{spendingData.available.toFixed(4)} SUI remaining</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Spending limits reset in</span>
                </div>
                <Badge variant="outline">
                  {formatDuration(timeUntilReset)}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                {canSpend ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
                <span className="text-sm">
                  {canSpend
                    ? "You can send transactions within your limit"
                    : "Limit exceeded - multi-sig approval required"
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet Owners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Wallet Owners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wallet.owners?.map((ownerAddress, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {ownerAddress.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {ownerAddress === currentAccount?.address ? 'You' : `Owner ${index + 1}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {shortenAddress(ownerAddress)}
                      </div>
                    </div>
                  </div>
                  {ownerAddress === currentAccount?.address && (
                    <Badge variant="secondary">Me</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((tx, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tx.type === 'send' ? 'bg-red-500/10' : 'bg-green-500/10'
                        }`}>
                        <Send className={`h-4 w-4 ${tx.type === 'send' ? 'text-red-500 rotate-45' : 'text-green-500 -rotate-45'
                          }`} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {tx.type === 'send' ? 'Sent' : 'Received'} {formatSuiAmount(tx.amount, 2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(tx.timestamp, 'relative')}
                        </div>
                      </div>
                    </div>
                    <Badge variant={tx.status === 'success' ? 'default' : 'destructive'}>
                      {tx.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Transactions will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};