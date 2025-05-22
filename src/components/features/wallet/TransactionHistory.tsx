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
  Calendar,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useTransactionHistory } from '../../../api/hooks/useWallet';
import { formatSuiAmount, formatTimestamp, shortenAddress } from '../../../utils/sui';

interface TransactionHistoryProps {
  walletId: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ walletId }) => {
  const { data: historyData, isLoading } = useTransactionHistory(walletId);

  const handleViewOnExplorer = (digest: string) => {
    const explorerUrl = `https://explorer.sui.io/txblock/${digest}?network=testnet`;
    window.open(explorerUrl, '_blank');
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
            {transactions.map((tx, index) => {
              const isOutgoing = tx.type === 'send';
              const isIncoming = tx.type === 'receive';
              
              return (
                <div key={tx.digest} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    {/* Transaction Info */}
                    <div className="flex items-center space-x-4">
                      {/* Icon */}
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isOutgoing 
                          ? 'bg-red-500/10' 
                          : isIncoming 
                          ? 'bg-green-500/10' 
                          : 'bg-blue-500/10'
                      }`}>
                        {isOutgoing ? (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        ) : isIncoming ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-500" />
                        ) : (
                          <Send className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      
                      {/* Details */}
                      <div>
                        <div className="font-medium">
                          {isOutgoing ? 'Sent' : isIncoming ? 'Received' : 'Transaction'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {isOutgoing ? 'To' : isIncoming ? 'From' : 'With'}: {shortenAddress(
                            isOutgoing 
                              ? (tx.recipients[0] || 'Unknown') 
                              : tx.sender
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(tx.timestamp, 'long')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Amount and Status */}
                    <div className="text-right">
                      <div className={`font-medium ${
                        isOutgoing ? 'text-red-600' : isIncoming ? 'text-green-600' : ''
                      }`}>
                        {isOutgoing ? '-' : isIncoming ? '+' : ''}{formatSuiAmount(tx.amount, 4)}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
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
    </div>
  );
};