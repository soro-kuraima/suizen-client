import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { useWithdraw, useCreateProposal } from '../../../api/hooks/useWallet';
import { useWalletSelectors } from '../../../store/walletStore';
import { isValidSuiAddress, exceedsSpendingLimit, formatSuiAmount } from '../../../utils/wallet';
import { Alert, AlertDescription } from '../../ui/alert';
import { AlertCircle, Send } from 'lucide-react';

const sendSchema = z.object({
  recipient: z.string().min(1, 'Recipient address is required').refine(isValidSuiAddress, 'Invalid Sui address'),
  amount: z.string().min(1, 'Amount is required').refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
});

type SendForm = z.infer<typeof sendSchema>;

interface SendDialogProps {
  walletId: string;
  children: React.ReactNode;
}

export const SendDialog: React.FC<SendDialogProps> = ({ walletId, children }) => {
  const [open, setOpen] = React.useState(false);
  const { activeWallet, activeWalletCapability } = useWalletSelectors();
  const withdraw = useWithdraw();
  const createProposal = useCreateProposal();

  const form = useForm<SendForm>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      recipient: '',
      amount: '',
    },
  });

  const onSubmit = async (data: SendForm) => {
    if (!activeWallet || !activeWalletCapability) return;

    try {
      // For now, we'll create a proposal for all transactions
      // In a real implementation, you'd check spending limits here
      await createProposal.mutateAsync({
        params: {
          walletId: activeWallet.id,
          recipient: data.recipient,
          amount: data.amount,
        },
        ownerCapId: activeWalletCapability.id,
      });
      
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to send:', error);
    }
  };

  const isPending = withdraw.isPending || createProposal.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send SUI
          </DialogTitle>
          <DialogDescription>
            Send SUI tokens from your multi-owner wallet
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0x..." />
                  </FormControl>
                  <FormDescription>
                    Enter the Sui address of the recipient
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
                    <Input {...field} type="number" step="0.01" placeholder="0.00" />
                  </FormControl>
                  <FormDescription>
                    Available balance: {activeWallet ? formatSuiAmount(activeWallet.balance) : '0'} SUI
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This transaction will create a proposal that requires approval from wallet owners.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating Proposal...' : 'Send'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};