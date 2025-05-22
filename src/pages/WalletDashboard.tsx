// pages/WalletDashboard.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { 
  Wallet, 
  Send, 
  Receive, 
  Users, 
  Clock, 
  FileText,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useWalletSelectors } from '../store/walletStore';
import { 
  useWallet, 
  useWalletProposals, 
  useWalletTransactions,
  useWithdraw,
  useDeposit,
  useCreateProposal,
  useApproveProposal,
  useExecuteProposal
} from '../api/hooks/useWallet';
import { MIST_PER_SUI } from '../constants/sui';
import { SendDialog } from '../components/features/wallet/SendDialog';
import { ReceiveDialog } from '../components/features/wallet/ReceiveDialog';
import { CreateProposalDialog } from '../components/features/wallet/CreateProposalDialog';
import { format } from 'date-fns';

const WalletDashboard: React.FC = () => {
  const { walletId } = useParams<{ walletId: string }>();
  const {
    activeWallet,
    activeWalletCapability,
    activeWalletProposals,
    activeWalletTransactions,
    isActiveWalletOwner,
    userAddress,
  } = useWalletSelectors();

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading } = useWallet(walletId || null);
  const { data: proposals, isLoading: proposalsLoading } = useWalletProposals(walletId || null);
  const { data: transactions, isLoading: transactionsLoading } = useWalletTransactions(walletId || null);

  // Mutations
  const approveProposal = useApproveProposal();
  const executeProposal = useExecuteProposal();

  if (!walletId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Wallet not found</h1>
          <p className="text-muted-foreground">Please select a valid wallet.</p>
        </div>
      </div>
    );
  }

  if (walletLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Wallet not found</h1>
          <p className="text-muted-foreground">The requested wallet could not be loaded.</p>
        </div>
      </div>
    );
  }

  const balanceInSui = (parseFloat(wallet.balance) / MIST_PER_SUI).toFixed(4);
  const resetPeriodDays = Math.floor(parseInt(wallet.resetPeriodMs) / (24 * 60 * 60 * 1000));

  const handleApproveProposal = async (proposalId: string) => {
    if (!activeWalletCapability) return;
    
    try {
      await approveProposal.mutateAsync({
        walletId: wallet.id,
        proposalId,
        ownerCapId: activeWalletCapability.id,
      });
    } catch (error) {
      console.error('Failed to approve proposal:', error);
    }
  };

  const handleExecuteProposal = async (proposalId: string) => {
    if (!activeWalletCapability) return;
    
    try {
      await executeProposal.mutateAsync({
        walletId: wallet.id,
        proposalId,
        ownerCapId: activeWalletCapability.id,
      });
    } catch (error) {
      console.error('Failed to execute proposal:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Multi-Owner Wallet</h1>
            <p className="text-muted-foreground">
              ID: {wallet.id.slice(0, 8)}...{wallet.id.slice(-8)}
            </p>
          </div>
        </div>
        {isActiveWalletOwner && (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Owner
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balanceInSui} SUI</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Owners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallet.owners.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Required Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallet.requiredApprovals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Reset Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resetPeriodDays}d</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {isActiveWalletOwner && (
        <div className="flex gap-3">
          <SendDialog walletId={wallet.id}>
            <Button className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </SendDialog>
          
          <ReceiveDialog walletId={wallet.id}>
            <Button variant="outline" className="flex items-center gap-2">
              <Receive className="h-4 w-4" />
              Receive
            </Button>
          </ReceiveDialog>

          <CreateProposalDialog walletId={wallet.id}>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Create Proposal
            </Button>
          </CreateProposalDialog>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="owners">Owners</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-16 bg-gray-100 rounded"></div>
                  ))}
                </div>
              ) : activeWalletTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-3">
                  {activeWalletTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'deposit' ? 'bg-green-100' :
                          transaction.type === 'withdraw' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {transaction.type === 'deposit' ? <Receive className="h-4 w-4 text-green-600" /> :
                           transaction.type === 'withdraw' ? <Send className="h-4 w-4 text-red-600" /> :
                           <FileText className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{transaction.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(parseInt(transaction.timestamp)), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {transaction.type === 'deposit' ? '+' : '-'}
                          {(parseFloat(transaction.amount) / MIST_PER_SUI).toFixed(4)} SUI
                        </p>
                        <Badge variant={transaction.success ? "default" : "destructive"}>
                          {transaction.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              {proposalsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="animate-pulse h-24 bg-gray-100 rounded"></div>
                  ))}
                </div>
              ) : activeWalletProposals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active proposals
                </div>
              ) : (
                <div className="space-y-4">
                  {activeWalletProposals.map((proposal) => {
                    const amountInSui = (parseFloat(proposal.amount) / MIST_PER_SUI).toFixed(4);
                    const canExecute = proposal.approvals.length >= wallet.requiredApprovals;
                    const hasUserApproved = userAddress ? proposal.approvals.includes(userAddress) : false;
                    
                    return (
                      <div key={proposal.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Send {amountInSui} SUI</p>
                            <p className="text-sm text-muted-foreground">
                              To: {proposal.recipient.slice(0, 8)}...{proposal.recipient.slice(-8)}
                            </p>
                          </div>
                          <Badge variant={canExecute ? "default" : "secondary"}>
                            {proposal.approvals.length}/{wallet.requiredApprovals} Approvals
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Approvers:</span>
                          {proposal.approvals.map((approver, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {approver.slice(0, 6)}...{approver.slice(-4)}
                            </Badge>
                          ))}
                        </div>

                        {isActiveWalletOwner && activeWalletCapability && (
                          <div className="flex gap-2">
                            {!hasUserApproved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveProposal(proposal.id)}
                                disabled={approveProposal.isPending}
                              >
                                {approveProposal.isPending ? 'Approving...' : 'Approve'}
                              </Button>
                            )}
                            {canExecute && (
                              <Button
                                size="sm"
                                onClick={() => handleExecuteProposal(proposal.id)}
                                disabled={executeProposal.isPending}
                              >
                                {executeProposal.isPending ? 'Executing...' : 'Execute'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Owners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wallet.owners.map((owner, index) => (
                  <div key={owner} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {owner.slice(0, 8)}...{owner.slice(-8)}
                        </p>
                        <p className="text-sm text-muted-foreground">Owner #{index + 1}</p>
                      </div>
                    </div>
                    {owner === userAddress && (
                      <Badge variant="default">You</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletDashboard;