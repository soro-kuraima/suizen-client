/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/features/wallet/AddOwnerDialog.tsx

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
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../../ui/form';
import { Loader2, UserPlus } from 'lucide-react';
import { useAddOwner, useOwnerCapabilityForWallet } from '../../../api/hooks/useWallet';
import { validateAndNormalizeSuiAddress } from '../../../utils/sui';
import { toast } from 'sonner';

// Create form schema
const addOwnerSchema = z.object({
    newOwner: z.string()
        .min(1, 'Address is required')
        .refine(
            (address) => validateAndNormalizeSuiAddress(address) !== null,
            'Invalid Sui address format'
        ),
    name: z.string().min(1, 'Name is required').max(30, 'Name too long'),
    spendingLimit: z.string()
        .min(1, 'Spending limit is required')
        .refine(
            (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
            'Must be a positive number'
        ),
});

type AddOwnerFormData = z.infer<typeof addOwnerSchema>;

interface AddOwnerDialogProps {
    walletId: string;
    children: React.ReactNode;
    onSuccess?: () => void;
}

export const AddOwnerDialog: React.FC<AddOwnerDialogProps> = ({
    walletId,
    children,
    onSuccess,
}) => {
    const [open, setOpen] = React.useState(false);

    // Get owner capability for this wallet
    const { data: ownerCapId, isLoading: capLoading } = useOwnerCapabilityForWallet(walletId);

    // Add owner mutation
    const addOwnerMutation = useAddOwner();

    // Form setup
    const form = useForm<AddOwnerFormData>({
        resolver: zodResolver(addOwnerSchema),
        defaultValues: {
            newOwner: '',
            name: '',
            spendingLimit: '1.0',
        },
    });

    // Handle form submission
    const onSubmit = async (data: AddOwnerFormData) => {
        if (!ownerCapId) {
            toast.error('Owner capability not found. You may not have permission to add owners.');
            return;
        }

        try {
            const normalizedAddress = validateAndNormalizeSuiAddress(data.newOwner);
            if (!normalizedAddress) {
                form.setError('newOwner', { message: 'Invalid Sui address' });
                return;
            }

            await addOwnerMutation.mutateAsync({
                request: {
                    walletId,
                    newOwner: normalizedAddress,
                    spendingLimit: data.spendingLimit,
                },
                ownerCapId,
            });

            toast.success(`Added ${data.name} as a wallet owner`);
            setOpen(false);
            form.reset();

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Failed to add owner:', error);

            // Handle specific errors
            if (error.message?.includes('EOwnerAlreadyExists')) {
                toast.error('This address is already an owner of this wallet');
            } else if (error.message?.includes('ENotOwner')) {
                toast.error('You are not authorized to add owners to this wallet');
            } else {
                toast.error(error.message || 'Failed to add owner');
            }
        }
    };

    const isLoading = addOwnerMutation.isPending || capLoading;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Add New Owner
                    </DialogTitle>
                    <DialogDescription>
                        Add a new owner to this multi-signature wallet
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Owner Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Alice, Bob" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        A name to easily identify this owner
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="newOwner"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sui Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="0x..." {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        The owner's Sui wallet address
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="spendingLimit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Spending Limit (SUI)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            placeholder="1.0"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Amount this owner can spend without approvals
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Owner'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};