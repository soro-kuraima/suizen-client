/* eslint-disable @typescript-eslint/no-explicit-any */
// Updated src/components/features/wallet/TransactionHistory.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Activity,
  Send,
  Download,
  ExternalLink,
  Filter,
  ArrowDownLeft,
  Shield,
  Zap,
  Plus,
  Users
} from 'lucide-react';
import { useTransactionHistory } from '../../../api/hooks/useWallet';
import { formatTimestamp, shortenAddress, mistToSui } from '../../../utils/sui';

interface TransactionHistoryProps {
  walletId: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ walletId }) => {
  const { data: historyData, isLoading } = useTransactionHistory(walletId);

  const handleViewOnExplorer = (digest: string) => {
    const explorerUrl = `https://explorer.sui.io/txblock/${digest}?network=testnet`;
    window.open(explorerUrl, '_blank');
  };

  // Helper function to get transaction type info
  const getTransactionTypeInfo = (tx: any) => {
    switch (tx.type) {
      case 'deposit':
        return {
          icon: ArrowDownLeft,
          label: 'Deposit',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
        };
      case 'multi_sig':
        return {
          icon: Shield,
          label: 'Multi-Sig Send',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
        };
      case 'send':
        return {
          icon: Zap,
          label: 'Direct Send',
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200'
        };
      case 'receive':
        return {
          icon: Plus,
          label: 'Received',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
        };
      default:
        return {
          icon: Send,
          label: 'Transaction',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          badgeColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
        };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading transaction history...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const transactions = historyData?.transactions || [];

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            All wallet transaction activity
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-2">No transactions yet</p>
          <p className="text-sm text-muted-foreground">
            Transaction history will appear here once you start using the wallet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Transaction History
          </h3>
          <p className="text-sm text-muted-foreground">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Transaction List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {transactions.map((tx) => {
              const typeInfo = getTransactionTypeInfo(tx);
              const IconComponent = typeInfo.icon;
              const amountInSui = parseFloat(mistToSui(tx.amount));
              const isOutgoing = tx.type === 'send' || tx.type === 'multi_sig';
              const isIncoming = tx.type === 'deposit' || tx.type === 'receive';

              return (
                <div key={tx.digest} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    {/* Transaction Info */}
                    <div className="flex items-center space-x-4">
                      {/* Icon with type-specific styling */}
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${typeInfo.bgColor}`}>
                        <IconComponent className={`h-5 w-5 ${typeInfo.color}`} />
                      </div>

                      {/* Transaction Details */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{typeInfo.label}</span>

                          {/* Multi-Sig Badge */}
                          {tx.isMultiSig && (
                            <Badge className={typeInfo.badgeColor}>
                              <Users className="h-3 w-3 mr-1" />
                              Multi-Sig
                            </Badge>
                          )}

                          {/* Direct Transfer Badge */}
                          {tx.type === 'send' && !tx.isMultiSig && (
                            <Badge className={typeInfo.badgeColor}>
                              <Zap className="h-3 w-3 mr-1" />
                              Direct
                            </Badge>
                          )}
                        </div>

                        {/* Recipient/Sender Info */}
                        <div className="text-sm text-muted-foreground">
                          {isOutgoing && tx.recipients.length > 0 ? (
                            <>To: {shortenAddress(tx.recipients[0])}</>
                          ) : isIncoming ? (
                            <>From: {shortenAddress(tx.sender)}</>
                          ) : (
                            <>With: {shortenAddress(tx.sender)}</>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(tx.timestamp, 'long')}
                        </div>
                      </div>
                    </div>

                    {/* Amount and Status */}
                    <div className="text-right">
                      <div className={`font-medium text-lg ${isOutgoing ? 'text-red-600' : isIncoming ? 'text-green-600' : ''
                        }`}>
                        {isOutgoing ? '-' : isIncoming ? '+' : ''}
                        {amountInSui.toFixed(4)} SUI
                      </div>

                      <div className="flex items-center justify-end space-x-2 mt-1">
                        <Badge
                          variant={tx.status === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {tx.status}
                        </Badge>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOnExplorer(tx.digest)}
                          className="h-6 w-6 p-0"
                          title="View on Explorer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Load More */}
      {historyData?.hasMore && (
        <div className="text-center">
          <Button variant="outline">
            Load More Transactions
          </Button>
        </div>
      )}

      {/* Transaction Type Legend */}
      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <div className="text-sm font-medium mb-3">Transaction Types:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Zap className="h-3 w-3 text-orange-500" />
              <span>Direct Send - Within spending limit</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-3 w-3 text-blue-500" />
              <span>Multi-Sig - Required approvals</span>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowDownLeft className="h-3 w-3 text-green-500" />
              <span>Deposit - Funds added</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-3 w-3 text-gray-500" />
              <span>Multi-Sig Badge - Multiple owners</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};