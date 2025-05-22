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
  CheckCircle2
} from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import { useWithdraw, useCreateProposal, useUserCoins } from '../../../api/hooks/useWallet';
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';
import { validateAndNormalizeSuiAddress, suiToMist, formatSuiAmount } from '../../../utils/sui';
import { toast } from 'sonner';

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
  const { data: userCoins } = useUserCoins();
  
  const form = useForm<SendTransactionData>({
    resolver: zodResolver(sendTransactionSchema),
    defaultValues: {
      recipient: '',
      amount: '',
      note: '',
    },
  });

  // Mock data - in real app, get from smart contract
  const spendingLimit = 1.0; // 1 SUI
  const spentThisPeriod = 0.5; // 0.5 SUI
  const availableLimit = spendingLimit - spentThisPeriod;
  const ownerCapId = 'mock-owner-cap-id'; // Would get from useOwnerCapabilities

  const amount = parseFloat(form.watch('amount') || '0');
  const exceedsLimit = amount > availableLimit;
  const requiresMultiSig = exceedsLimit;

  const onSubmit = async (values: SendTransactionData) => {
    try {
      const normalizedRecipient = validateAndNormalizeSuiAddress(values.recipient);
      if (!normalizedRecipient) {
        form.setError('recipient', { message: 'Invalid Sui address' });
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
          },
          ownerCapId,
        });
        toast.success('Proposal created! Waiting for approvals.');
      }

      onClose();
      form.reset();
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  const isLoading = withdrawMutation.isPending || createProposalMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Send className="mr-2 h-5 w-5" />
            Send Transaction
          </DialogTitle>
          <DialogDescription>
            Send SUI from your multi-owner wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                  ({formatSuiAmount(suiToMist(availableLimit.toString()), 2)})
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="proposal" className="mt-4">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <strong>Multi-Sig Proposal:</strong> Requires approval from other owners for any amount
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
                  {formatSuiAmount(suiToMist(availableLimit.toString()), 2)} available
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatSuiAmount(suiToMist(spentThisPeriod.toString()), 2)} spent of {formatSuiAmount(suiToMist(spendingLimit.toString()), 2)} limit
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
                          <span>2 of 3 owners</span>
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
  );
};