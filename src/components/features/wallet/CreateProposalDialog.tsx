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
import { Switch } from '../../ui/switch';
import { useCreateProposal } from '../../../api/hooks/useWallet';
import { useWalletSelectors } from '../../../store/walletStore';
import { isValidSuiAddress, formatSuiAmount } from '../../../utils/wallet';
import { FileText, Calendar } from 'lucide-react';

const proposalSchema = z.object({
  recipient: z.string().min(1, 'Recipient address is required').refine(isValidSuiAddress, 'Invalid Sui address'),
  amount: z.string().min(1, 'Amount is required').refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
  hasExpiration: z.boolean(),
  expirationHours: z.string().optional(),
});

type ProposalForm = z.infer<typeof proposalSchema>;

interface CreateProposalDialogProps {
  walletId: string;
  children: React.ReactNode;
}

export const CreateProposalDialog: React.FC<CreateProposalDialogProps> = ({ walletId, children }) => {
  const [open, setOpen] = React.useState(false);
  const { activeWallet, activeWalletCapability } = useWalletSelectors();
  const createProposal = useCreateProposal();

  const form = useForm<ProposalForm>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      recipient: '',
      amount: '',
      hasExpiration: false,
      expirationHours: '24',
    },
  });

  const hasExpiration = form.watch('hasExpiration');

  const onSubmit = async (data: ProposalForm) => {
    if (!activeWallet || !activeWalletCapability) return;

    try {
      const expirationMs = data.hasExpiration && data.expirationHours 
        ? (parseFloat(data.expirationHours) * 60 * 60 * 1000).toString()
        : undefined;

      await createProposal.mutateAsync({
        params: {
          walletId: activeWallet.id,
          recipient: data.recipient,
          amount: data.amount,
          expirationMs,
        },
        ownerCapId: activeWalletCapability.id,
      });
      
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create proposal:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Transaction Proposal
          </DialogTitle>
          <DialogDescription>
            Create a proposal for a transaction that requires multi-signature approval
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

            <FormField
              control={form.control}
              name="hasExpiration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Set Expiration
                    </FormLabel>
                    <FormDescription>
                      Set a time limit for this proposal
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {hasExpiration && (
              <FormField
                control={form.control}
                name="expirationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration (Hours)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" placeholder="24" />
                    </FormControl>
                    <FormDescription>
                      Number of hours until this proposal expires
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProposal.isPending}>
                {createProposal.isPending ? 'Creating...' : 'Create Proposal'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};