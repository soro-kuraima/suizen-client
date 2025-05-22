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
import { Plus, Trash2 } from 'lucide-react';
import { useCreateWallet } from '../../../api/hooks/useWallet';
import { RESET_PERIODS } from '../../../constants/sui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

const createWalletSchema = z.object({
  owners: z.array(z.object({
    address: z.string().min(1, 'Address is required'),
    spendingLimit: z.string().min(1, 'Spending limit is required'),
  })).min(1, 'At least one owner is required'),
  requiredApprovals: z.number().min(1, 'Required approvals must be at least 1'),
  resetPeriod: z.string(),
});

type CreateWalletForm = z.infer<typeof createWalletSchema>;

interface CreateWalletDialogProps {
  children: React.ReactNode;
}

export const CreateWalletDialog: React.FC<CreateWalletDialogProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const createWallet = useCreateWallet();

  const form = useForm<CreateWalletForm>({
    resolver: zodResolver(createWalletSchema),
    defaultValues: {
      owners: [{ address: '', spendingLimit: '' }],
      requiredApprovals: 1,
      resetPeriod: RESET_PERIODS.DAILY.toString(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'owners',
  });

  const onSubmit = async (data: CreateWalletForm) => {
    try {
      await createWallet.mutateAsync({
        initialOwners: data.owners.map(owner => owner.address),
        initialLimits: data.owners.map(owner => owner.spendingLimit),
        requiredApprovals: data.requiredApprovals,
        resetPeriodMs: data.resetPeriod,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Multi-Owner Wallet</DialogTitle>
          <DialogDescription>
            Set up a new multi-signature wallet with spending limits and approval requirements.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Owners</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ address: '', spendingLimit: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Owner
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <FormField
                    control={form.control}
                    name={`owners.${index}.address`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Owner Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="0x..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`owners.${index}.spendingLimit`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel>Limit (SUI)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-8"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requiredApprovals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Approvals</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1" 
                        max={fields.length}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of approvals needed for transactions exceeding limits
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resetPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spending Limit Reset Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={RESET_PERIODS.DAILY.toString()}>Daily</SelectItem>
                        <SelectItem value={RESET_PERIODS.WEEKLY.toString()}>Weekly</SelectItem>
                        <SelectItem value={RESET_PERIODS.MONTHLY.toString()}>Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often spending limits reset
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createWallet.isPending}>
                {createWallet.isPending ? 'Creating...' : 'Create Wallet'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};