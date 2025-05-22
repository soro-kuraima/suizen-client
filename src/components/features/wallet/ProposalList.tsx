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
  Play
} from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import { useWalletProposals, useApproveProposal, useExecuteProposal } from '../../../api/hooks/useWallet';
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';
import { shortenAddress, formatSuiAmount, formatTimestamp } from '../../../utils/sui';
import { toast } from 'sonner';

interface ProposalListProps {
  walletId: string;
}

export const ProposalList: React.FC<ProposalListProps> = ({ walletId }) => {
  const { currentAccount } = useWalletAdapter();
  const { data: proposals, isLoading } = useWalletProposals(walletId);
  const approveProposalMutation = useApproveProposal();
  const executeProposalMutation = useExecuteProposal();

  // Mock owner cap ID - in real app, get from useOwnerCapabilities
  const ownerCapId = 'mock-owner-cap-id';

  const handleApprove = async (proposalId: string) => {
    try {
      await approveProposalMutation.mutateAsync({
        walletId,
        proposalId,
        ownerCapId,
      });
      toast.success('Proposal approved!');
    } catch (error) {
      console.error('Failed to approve proposal:', error);
    }
  };

  const handleExecute = async (proposalId: string) => {
    try {
      await executeProposalMutation.mutateAsync({
        walletId,
        proposalId,
        ownerCapId,
      });
      toast.success('Proposal executed successfully!');
    } catch (error) {
      console.error('Failed to execute proposal:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading proposals...</CardTitle>
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

      <div className="space-y-4">
        {proposals.map((proposal) => {
          const approvalsNeeded = 2; // Mock - would get from wallet.requiredApprovals
          const approvalProgress = (proposal.approvals.length / approvalsNeeded) * 100;
          const canExecute = proposal.approvals.length >= approvalsNeeded;
          const hasApproved = proposal.approvals.includes(currentAccount?.address || '');
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
                            {approver === currentAccount?.address ? 'You' : shortenAddress(approver)}
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
                    {!hasApproved && !isExpired && (
                      <Button 
                        size="sm" 
                        onClick={() => handleApprove(proposal.objectId)}
                        disabled={approveProposalMutation.isPending}
                      >
                        {approveProposalMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1" />
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
                    
                    {canExecute && !isExpired && (
                      <Button 
                        onClick={() => handleExecute(proposal.objectId)}
                        disabled={executeProposalMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {executeProposalMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1" />
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};