import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';
import {
    Download,
    Coins,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Wallet
} from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import { useDepositToWallet, useUserCoins, useUserBalance } from '../../../api/hooks/useWallet';
import { formatSuiAmount, mistToSui } from '../../../utils/sui';
import { toast } from 'sonner';

const depositSchema = z.object({
    selectedCoins: z.array(z.string()).min(1, 'Please select at least one coin to deposit'),
});

type DepositForm = z.infer<typeof depositSchema>;

interface DepositDialogProps {
    walletId: string;
    children: React.ReactNode;
    onSuccess?: () => void;
}

export const DepositDialog: React.FC<DepositDialogProps> = ({
    walletId,
    children,
    onSuccess
}) => {
    const [open, setOpen] = useState(false);
    const [selectedCoins, setSelectedCoins] = useState<string[]>([]);

    const depositMutation = useDepositToWallet();
    const { data: userCoins = [], isLoading: coinsLoading } = useUserCoins();
    const { data: userBalance = '0', isLoading: balanceLoading } = useUserBalance();

    const form = useForm<DepositForm>({
        resolver: zodResolver(depositSchema),
        defaultValues: {
            selectedCoins: [],
        },
    });

    // Sync local state with form state
    useEffect(() => {
        form.setValue('selectedCoins', selectedCoins);
    }, [selectedCoins, form]);

    // Calculate total selected amount using useMemo to prevent recalculation
    const totalSelectedAmount = useMemo(() => {
        return selectedCoins.reduce((total, coinId) => {
            const coin = userCoins.find(c => c.objectId === coinId);
            return total + (coin ? parseFloat(mistToSui(coin.balance)) : 0);
        }, 0);
    }, [selectedCoins, userCoins]);

    // Memoized coin selection handlers
    const handleCoinToggle = useCallback((coinId: string, checked: boolean) => {
        console.log(`Toggling coin ${coinId.slice(0, 8)}... to ${checked}`); // Debug log
        setSelectedCoins(prev => {
            const newSelection = checked
                ? (prev.includes(coinId) ? prev : [...prev, coinId])
                : prev.filter(id => id !== coinId);

            console.log('New selection:', newSelection.map(id => id.slice(0, 8))); // Debug log
            return newSelection;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        const allCoinIds = userCoins.map(coin => coin.objectId);
        console.log('Selecting all coins:', allCoinIds.length); // Debug log
        setSelectedCoins(allCoinIds);
    }, [userCoins]);

    const handleClearAll = useCallback(() => {
        console.log('Clearing all selections'); // Debug log
        setSelectedCoins([]);
    }, []);

    // Reset selections when dialog closes
    const handleOpenChange = useCallback((newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setSelectedCoins([]);
            form.reset();
        }
    }, [form]);

    // Direct deposit handler (bypasses form validation issues)
    const handleDirectDeposit = useCallback(async () => {
        console.log('Direct deposit called with coins:', selectedCoins); // Debug log

        if (!walletId) {
            toast.error('Wallet ID not found');
            return;
        }

        if (selectedCoins.length === 0) {
            toast.error('Please select at least one coin');
            return;
        }

        try {
            console.log(`Starting deposit of ${selectedCoins.length} coins`); // Debug log

            // Deposit selected coins one by one
            for (let i = 0; i < selectedCoins.length; i++) {
                const coinId = selectedCoins[i];
                console.log(`Depositing coin ${i + 1}/${selectedCoins.length}: ${coinId.slice(0, 8)}...`);

                await depositMutation.mutateAsync({
                    walletId,
                    coinObjectId: coinId,
                });
            }

            toast.success(`Successfully deposited ${selectedCoins.length} coin(s) to wallet`);
            handleOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            console.error('Deposit failed:', error);
            toast.error(`Deposit failed: ${error.message || 'Unknown error'}`);
        }
    }, [walletId, selectedCoins, depositMutation, handleOpenChange, onSuccess]);

    // Form submit handler (alternative approach)
    const onSubmit = useCallback(async (data: DepositForm) => {
        console.log('Form submit called with data:', data); // Debug log
        console.log('Selected coins from state:', selectedCoins); // Debug log

        // Use the selectedCoins from state as it's more reliable
        const coinsToDeposit = selectedCoins.length > 0 ? selectedCoins : data.selectedCoins;

        if (!walletId) {
            toast.error('Wallet ID not found');
            return;
        }

        if (coinsToDeposit.length === 0) {
            toast.error('Please select at least one coin');
            return;
        }

        try {
            console.log(`Form submit: depositing ${coinsToDeposit.length} coins`); // Debug log

            // Deposit selected coins one by one
            for (let i = 0; i < coinsToDeposit.length; i++) {
                const coinId = coinsToDeposit[i];
                console.log(`Form submit: depositing coin ${i + 1}/${coinsToDeposit.length}: ${coinId.slice(0, 8)}...`);

                await depositMutation.mutateAsync({
                    walletId,
                    coinObjectId: coinId,
                });
            }

            toast.success(`Successfully deposited ${coinsToDeposit.length} coin(s) to wallet`);
            handleOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            console.error('Form submit deposit failed:', error);
            toast.error(`Deposit failed: ${error.message || 'Unknown error'}`);
        }
    }, [walletId, selectedCoins, depositMutation, handleOpenChange, onSuccess]);

    const isLoading = depositMutation.isPending;
    const dataLoading = coinsLoading || balanceLoading;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Deposit SUI to Wallet
                    </DialogTitle>
                    <DialogDescription>
                        Select SUI coins from your personal wallet to deposit into the multi-owner wallet
                    </DialogDescription>
                </DialogHeader>

                {dataLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading your coins...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Balance Summary */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Your SUI Balance</span>
                                    </div>
                                    <Badge variant="outline">
                                        {formatSuiAmount(userBalance, 4, false)} SUI
                                    </Badge>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">
                                    Available in {userCoins.length} coin object{userCoins.length !== 1 ? 's' : ''}
                                </div>
                            </CardContent>
                        </Card>

                        {userCoins.length === 0 ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    You don't have any SUI coins to deposit. Please fund your wallet first.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-4">
                                {/* Header with controls */}
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Select Coins to Deposit</h4>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSelectAll}
                                            disabled={selectedCoins.length === userCoins.length}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleClearAll}
                                            disabled={selectedCoins.length === 0}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>

                                {/* Coin Selection */}
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {userCoins.map((coin) => {
                                        const isSelected = selectedCoins.includes(coin.objectId);
                                        const coinAmount = parseFloat(mistToSui(coin.balance));

                                        return (
                                            <Card
                                                key={coin.objectId}
                                                className={`transition-colors ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                                                    }`}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) =>
                                                                handleCoinToggle(coin.objectId, checked === true)
                                                            }
                                                        />

                                                        <div className="flex items-center space-x-2">
                                                            <Coins className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-mono text-xs">
                                                                {coin.objectId.slice(0, 8)}...{coin.objectId.slice(-6)}
                                                            </span>
                                                        </div>

                                                        <div className="flex-1" />

                                                        <Badge variant="outline">
                                                            {coinAmount.toFixed(4)} SUI
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>

                                {/* Selection Summary */}
                                {selectedCoins.length > 0 && (
                                    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    <span className="font-medium text-green-800 dark:text-green-200">
                                                        Deposit Summary
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className="border-green-300">
                                                    {totalSelectedAmount.toFixed(4)} SUI
                                                </Badge>
                                            </div>
                                            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                                                {selectedCoins.length} coin{selectedCoins.length !== 1 ? 's' : ''} selected for deposit
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Debug Info */}
                                {process.env.NODE_ENV === 'development' && (
                                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                        Debug: {selectedCoins.length} coins selected: {selectedCoins.map(id => id.slice(0, 6)).join(', ')}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleOpenChange(false)}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>

                                    {/* Direct deposit button (bypasses form) */}
                                    <Button
                                        type="button"
                                        onClick={handleDirectDeposit}
                                        disabled={isLoading || selectedCoins.length === 0}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                                Depositing...
                                            </>
                                        ) : (
                                            `Deposit ${selectedCoins.length} Coin${selectedCoins.length !== 1 ? 's' : ''}`
                                        )}
                                    </Button>
                                </div>

                                {/* Alternative: Form-based approach */}
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="hidden">
                                        <FormField
                                            control={form.control}
                                            name="selectedCoins"
                                            render={() => (
                                                <FormItem>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Hidden submit button for testing */}
                                        <Button type="submit" className="hidden">
                                            Form Submit
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};