import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  Send,
  AlertCircle,
  Shield,
  Zap,
  Clock,
  Users,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import {
  useWithdraw,
  useCreateProposal,
  useOwnerCapabilityForWallet,
  useSpendingRecords,
  useWallet,
  useSpendingLimitCheck
} from '../../../api/hooks/useWallet';
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';
import { validateAndNormalizeSuiAddress, formatSuiAmount, mistToSui } from '../../../utils/sui';
import { toast } from 'sonner';
import { ScrollArea } from '@radix-ui/react-scroll-area';

const sendTransactionSchema = z.object({
  recipient: z.string().min(1, 'Recipient address is required').refine(
    (addr) => validateAndNormalizeSuiAddress(addr) !== null,
    'Invalid Sui address format'
  ),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Must be a positive number'
  ),
  note: z.string().optional(),
});

type SendTransactionData = z.infer<typeof sendTransactionSchema>;

interface SendTransactionFormProps {
  walletId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SendTransactionForm: React.FC<SendTransactionFormProps> = ({
  walletId,
  isOpen,
  onClose,
}) => {
  const [transactionType, setTransactionType] = useState<'direct' | 'proposal'>('direct');
  const { currentAccount } = useWalletAdapter();

  const withdrawMutation = useWithdraw();
  const createProposalMutation = useCreateProposal();

  // Get real data from smart contract
  const { data: wallet, isLoading: walletLoading } = useWallet(walletId);
  const { data: ownerCapId, isLoading: capLoading } = useOwnerCapabilityForWallet(walletId);
  const { data: spendingRecord, isLoading: spendingLoading } = useSpendingRecords(
    walletId,
    currentAccount?.address || ''
  );

  const form = useForm<SendTransactionData>({
    resolver: zodResolver(sendTransactionSchema),
    defaultValues: {
      recipient: '',
      amount: '',
      note: '',
    },
  });

  // Get spending limit check for current amount
  const amount = parseFloat(form.watch('amount') || '0');
  const { data: limitCheck } = useSpendingLimitCheck(
    walletId,
    amount > 0 ? amount.toString() : ''
  );

  // Calculate spending limits based on real data
  const spendingData = React.useMemo(() => {
    if (!spendingRecord) {
      return {
        spent: 0,
        limit: 0,
        lastReset: Date.now(),
        resetPeriod: wallet?.resetPeriodMs || 24 * 60 * 60 * 1000
      };
    }

    return {
      spent: parseFloat(mistToSui(spendingRecord.spentAmount)),
      limit: parseFloat(mistToSui(spendingRecord.spendingLimit)),
      lastReset: spendingRecord.lastReset,
      resetPeriod: wallet?.resetPeriodMs || 24 * 60 * 60 * 1000
    };
  }, [spendingRecord, wallet]);

  const availableLimit = Math.max(0, spendingData.limit - spendingData.spent);
  const exceedsLimit = limitCheck ? !limitCheck.withinLimit : amount > availableLimit;
  const requiresMultiSig = exceedsLimit;

  // Check if user is authorized
  const isOwner = wallet?.owners?.includes(currentAccount?.address || '') || false;
  const hasOwnerCap = !!ownerCapId;

  const currentAddress = currentAccount.address;

  const onSubmit = async (values: SendTransactionData) => {
    if (!wallet || !currentAddress || !ownerCapId) {
      toast.error('Wallet or owner capability not found');
      return;
    }

    if (!isOwner) {
      toast.error('You are not an owner of this wallet');
      return;
    }

    try {
      const normalizedRecipient = validateAndNormalizeSuiAddress(values.recipient);
      if (!normalizedRecipient) {
        form.setError('recipient', { message: 'Invalid Sui address' });
        return;
      }

      // Check wallet balance
      const walletBalance = parseFloat(mistToSui(wallet.balance));
      if (amount > walletBalance) {
        toast.error('Insufficient wallet balance');
        return;
      }

      if (transactionType === 'direct' && !exceedsLimit) {
        // Direct withdrawal within spending limit
        await withdrawMutation.mutateAsync({
          request: {
            walletId,
            recipient: normalizedRecipient,
            amount: values.amount,
          },
          ownerCapId,
        });
        toast.success('Transaction sent successfully!');
      } else {
        // Create proposal for multi-sig approval
        await createProposalMutation.mutateAsync({
          request: {
            walletId,
            recipient: normalizedRecipient,
            amount: values.amount,
            // Set expiration to 24 hours from now
            expirationMs: (24 * 60 * 60 * 1000),
          },
          ownerCapId,
        });
        toast.success('Proposal created! Waiting for approvals.');
      }

      onClose();
      form.reset();
    } catch (error: any) {
      console.error('Transaction failed:', error);

      // Parse error messages from smart contract
      let errorMessage = 'Transaction failed';
      if (error.message?.includes('EAmountExceedsLimit')) {
        errorMessage = 'Amount exceeds your spending limit. A proposal has been created instead.';
      } else if (error.message?.includes('EInsufficientBalance')) {
        errorMessage = 'Insufficient wallet balance';
      } else if (error.message?.includes('ENotOwner')) {
        errorMessage = 'You are not authorized to perform this action';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const isLoading = withdrawMutation.isPending || createProposalMutation.isPending;
  const dataLoading = walletLoading || capLoading || spendingLoading;

  if (dataLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading wallet data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isOwner || !hasOwnerCap) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
              Access Denied
            </DialogTitle>
            <DialogDescription>
              You are not authorized to send transactions from this wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ScrollArea>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Send className="mr-2 h-5 w-5" />
              Send Transaction
            </DialogTitle>
            <DialogDescription>
              Send SUI from your multi-owner wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-auto">
            {/* Transaction Type Tabs */}
            <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="direct" className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Direct Send</span>
                </TabsTrigger>
                <TabsTrigger value="proposal" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Create Proposal</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="direct" className="mt-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Direct Send:</strong> Instant transactions within your spending limit
                    ({limitCheck ? parseFloat(limitCheck.available).toFixed(4) : availableLimit.toFixed(4)} SUI available)
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="proposal" className="mt-4">
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Multi-Sig Proposal:</strong> Requires approval from {wallet?.requiredApprovals} of {wallet?.owners?.length} owners
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            {/* Spending Limit Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Your spending limit</span>
                  </div>
                  <Badge variant="outline">
                    {limitCheck ? parseFloat(limitCheck.available).toFixed(4) : availableLimit.toFixed(4)} SUI available
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {limitCheck ? parseFloat(limitCheck.currentSpent).toFixed(4) : spendingData.spent.toFixed(4)} spent of {limitCheck ? parseFloat(limitCheck.limit).toFixed(4) : spendingData.limit.toFixed(4)} limit
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, limitCheck ?
                          (parseFloat(limitCheck.currentSpent) / parseFloat(limitCheck.limit)) * 100 :
                          (spendingData.spent / spendingData.limit) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Balance Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Wallet Balance</span>
                  <span className="font-medium">
                    {wallet ? formatSuiAmount(wallet.balance, 4, false) : '0.0000'} SUI
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Address</FormLabel>
                      <FormControl>
                        <Input placeholder="0x..." {...field} />
                      </FormControl>
                      <FormDescription>
                        The Sui address to send SUI to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (SUI)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min="0.001"
                          placeholder="0.0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Amount of SUI to send
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a note for this transaction..."
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Transaction Preview */}
                {amount > 0 && (
                  <Card className={`${requiresMultiSig ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20' : 'border-green-200 bg-green-50 dark:bg-green-950/20'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Transaction Preview</span>
                        <Badge variant={requiresMultiSig ? 'secondary' : 'default'}>
                          {requiresMultiSig ? 'Requires Approval' : 'Instant'}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-medium">{amount} SUI</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transaction type:</span>
                          <span>{requiresMultiSig ? 'Multi-sig proposal' : 'Direct send'}</span>
                        </div>
                        {requiresMultiSig && (
                          <div className="flex justify-between">
                            <span>Approvals needed:</span>
                            <span>{wallet?.requiredApprovals} of {wallet?.owners?.length}</span>
                          </div>
                        )}
                      </div>

                      {requiresMultiSig && (
                        <Alert className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            This transaction exceeds your spending limit and will require approval from other wallet owners.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={onClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Processing...
                      </>
                    ) : requiresMultiSig ? (
                      'Create Proposal'
                    ) : (
                      'Send Transaction'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
};