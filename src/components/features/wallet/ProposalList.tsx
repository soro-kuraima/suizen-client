/* eslint-disable @typescript-eslint/no-explicit-any */
// Fixed version of src/components/features/wallet/ProposalList.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Progress } from '../../ui/progress';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Users,
  AlertCircle,
  Eye,
  ThumbsUp,
  Play,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import {
  useWalletProposals,
  useApproveProposal,
  useExecuteProposal,
  useOwnerCapabilityForWallet,
  useWallet
} from '../../../api/hooks/useWallet';
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';
import { shortenAddress, formatSuiAmount, formatTimestamp } from '../../../utils/sui';
import { toast } from 'sonner';

interface ProposalListProps {
  walletId: string;
}

export const ProposalList: React.FC<ProposalListProps> = ({ walletId }) => {
  const { currentAccount } = useWalletAdapter();
  const { data: proposals, isLoading } = useWalletProposals(walletId);
  const { data: wallet } = useWallet(walletId);

  // FIXED: Get real owner capability instead of using mock
  const { data: ownerCapId, isLoading: ownerCapLoading } = useOwnerCapabilityForWallet(walletId);

  const approveProposalMutation = useApproveProposal();
  const executeProposalMutation = useExecuteProposal();

  // Check if user is authorized
  const currentAddress = currentAccount?.address;
  const isOwner = wallet?.owners?.includes(currentAddress || '') || false;
  const hasOwnerCap = !!ownerCapId;
  const canInteract = isOwner && hasOwnerCap;

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 ProposalList Debug:', {
      walletId,
      currentAddress,
      isOwner,
      ownerCapId,
      hasOwnerCap,
      canInteract,
      proposalsCount: proposals?.length || 0
    });
  }, [walletId, currentAddress, isOwner, ownerCapId, hasOwnerCap, canInteract, proposals]);

  const handleApprove = async (proposalId: string) => {
    if (!canInteract) {
      toast.error('You are not authorized to approve proposals for this wallet');
      return;
    }

    if (!ownerCapId) {
      toast.error('Owner capability not found. You may not be an owner of this wallet.');
      return;
    }

    try {
      console.log('🎯 Approving proposal:', {
        proposalId,
        walletId,
        ownerCapId,
        userAddress: currentAddress
      });

      await approveProposalMutation.mutateAsync({
        walletId,
        proposalId,
        ownerCapId,
      });

      toast.success('Proposal approved successfully!');
    } catch (error: any) {
      console.error('❌ Failed to approve proposal:', error);

      // Parse specific error messages
      let errorMessage = 'Failed to approve proposal';
      if (error.message?.includes('ENotOwner')) {
        errorMessage = 'You are not authorized to approve this proposal';
      } else if (error.message?.includes('already approved')) {
        errorMessage = 'You have already approved this proposal';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleExecute = async (proposalId: string) => {
    if (!canInteract) {
      toast.error('You are not authorized to execute proposals for this wallet');
      return;
    }

    if (!ownerCapId) {
      toast.error('Owner capability not found. You may not be an owner of this wallet.');
      return;
    }

    try {
      console.log('🎯 Executing proposal:', {
        proposalId,
        walletId,
        ownerCapId,
        userAddress: currentAddress
      });

      await executeProposalMutation.mutateAsync({
        walletId,
        proposalId,
        ownerCapId,
      });

      toast.success('Proposal executed successfully!');
    } catch (error: any) {
      console.error('❌ Failed to execute proposal:', error);

      // Parse specific error messages
      let errorMessage = 'Failed to execute proposal';
      if (error.message?.includes('ENotOwner')) {
        errorMessage = 'You are not authorized to execute this proposal';
      } else if (error.message?.includes('EMultiSigRequired')) {
        errorMessage = 'Not enough approvals to execute this proposal';
      } else if (error.message?.includes('EInsufficientBalance')) {
        errorMessage = 'Insufficient wallet balance to execute this proposal';
      } else if (error.message?.includes('expired')) {
        errorMessage = 'This proposal has expired';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading proposals...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Show authorization status if there are issues
  if (!currentAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Please connect your wallet to view and interact with proposals
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
            Access Restricted
          </CardTitle>
          <CardDescription>
            You are not an owner of this wallet and cannot interact with proposals
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (ownerCapLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading authorization...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!hasOwnerCap) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
            Authorization Error
          </CardTitle>
          <CardDescription>
            Owner capability not found. You may not have the required permissions.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Transaction Proposals
          </CardTitle>
          <CardDescription>
            Multi-signature proposals for large transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-2">No proposals yet</p>
          <p className="text-sm text-muted-foreground">
            Proposals will appear here when transactions exceed spending limits
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
            <FileText className="mr-2 h-5 w-5" />
            Transaction Proposals
          </h3>
          <p className="text-sm text-muted-foreground">
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} requiring attention
          </p>
        </div>
        <Badge variant="secondary">{proposals.length}</Badge>
      </div>

      {/* Authorization Status */}
      {canInteract && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            You are authorized to approve and execute proposals for this wallet
          </AlertDescription>
        </Alert>
      )}

      {/* Proposal List */}
      <div className="space-y-4">
        {proposals.map((proposal) => {
          const approvalsNeeded = wallet?.requiredApprovals || 2;
          const approvalProgress = (proposal.approvals.length / approvalsNeeded) * 100;
          const canExecute = proposal.approvals.length >= approvalsNeeded;
          const hasApproved = proposal.approvals.includes(currentAddress || '');
          const isExpired = proposal.expiration ? Date.now() > proposal.expiration : false;

          return (
            <Card key={proposal.objectId} className={`${canExecute ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Send className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        Send {formatSuiAmount(proposal.amount, 4)}
                      </CardTitle>
                      <CardDescription>
                        To: {shortenAddress(proposal.recipient)}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {canExecute && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                    {isExpired && (
                      <Badge variant="destructive">
                        <Clock className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Approval Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>Approvals</span>
                    </span>
                    <span className="font-medium">
                      {proposal.approvals.length} of {approvalsNeeded}
                    </span>
                  </div>
                  <Progress value={approvalProgress} className="h-2" />
                </div>

                {/* Approvers */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Approved by:</div>
                  {proposal.approvals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {proposal.approvals.map((approver, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {approver.slice(2, 4).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">
                            {approver === currentAddress ? 'You' : shortenAddress(approver)}
                          </span>
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No approvals yet</p>
                  )}
                </div>

                {/* Expiration */}
                {proposal.expiration && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {isExpired ? 'Expired' : 'Expires'} {formatTimestamp(proposal.expiration, 'relative')}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-1 h-3 w-3" />
                      Details
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!hasApproved && !isExpired && canInteract && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(proposal.objectId)}
                        disabled={approveProposalMutation.isPending}
                      >
                        {approveProposalMutation.isPending ? (
                          <>
                            <Loader2 className="animate-spin h-3 w-3 mr-1" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="mr-1 h-3 w-3" />
                            Approve
                          </>
                        )}
                      </Button>
                    )}

                    {canExecute && !isExpired && canInteract && (
                      <Button
                        onClick={() => handleExecute(proposal.objectId)}
                        disabled={executeProposalMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {executeProposalMutation.isPending ? (
                          <>
                            <Loader2 className="animate-spin h-3 w-3 mr-1" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="mr-1 h-3 w-3" />
                            Execute
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status Messages */}
                {hasApproved && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      You have approved this proposal
                    </AlertDescription>
                  </Alert>
                )}

                {canExecute && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      This proposal has sufficient approvals and can be executed
                    </AlertDescription>
                  </Alert>
                )}

                {isExpired && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      This proposal has expired and cannot be executed
                    </AlertDescription>
                  </Alert>
                )}

                {!canInteract && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need proper authorization to interact with this proposal
                    </AlertDescription>
                  </Alert>
                )}

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};