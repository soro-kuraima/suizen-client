import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import {
    Download,
    Wallet,
    ArrowUpRight,
    Coins,
    AlertCircle,
    CheckCircle2,
    Users
} from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import { DepositDialog } from './DepositDialog';
import { useUserSuiBalance } from '../../../api/hooks/useWallet';
import { formatSuiAmount } from '../../../utils/sui';

interface QuickDepositCardProps {
    walletId: string;
    walletBalance: string;
    className?: string;
}

export const QuickDepositCard: React.FC<QuickDepositCardProps> = ({
    walletId,
    walletBalance,
    className,
}) => {
    const {
        totalBalance,
        totalBalanceFormatted,
        coinCount,
        coins,
        isLoading
    } = useUserSuiBalance();

    const walletBalanceInSui = parseFloat(walletBalance) / 1_000_000_000;
    const hasPersonalBalance = totalBalance > 0;
    const hasWalletBalance = walletBalanceInSui > 0;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Download className="mr-2 h-5 w-5" />
                    Quick Deposit
                </CardTitle>
                <CardDescription>
                    Transfer SUI from your personal wallet to the multi-owner wallet
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Balance Comparison */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Personal Wallet</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {isLoading ? '...' : totalBalanceFormatted}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {isLoading ? 'Loading...' : `${coinCount} coin${coinCount !== 1 ? 's' : ''} available`}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Multi-Sig Wallet</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {formatSuiAmount(walletBalance, 4, false)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Shared balance
                        </div>
                    </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Balance Distribution</span>
                        <span className="text-muted-foreground">
                            Total: {(totalBalance + walletBalanceInSui).toFixed(4)} SUI
                        </span>
                    </div>
                    <div className="space-y-1">
                        <Progress
                            value={totalBalance > 0 ? (walletBalanceInSui / (totalBalance + walletBalanceInSui)) * 100 : 0}
                            className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Personal: {totalBalance.toFixed(4)}</span>
                            <span>Multi-Sig: {walletBalanceInSui.toFixed(4)}</span>
                        </div>
                    </div>
                </div>

                {/* Status and Actions */}
                {!hasPersonalBalance ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            You don't have any SUI in your personal wallet to deposit.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-3">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-2">
                            {coins.slice(0, 2).map((coin) => (
                                <div key={coin.objectId} className="p-2 border rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <Coins className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs font-mono">
                                            {coin.objectId.slice(0, 6)}...
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium">
                                        {coin.balanceFormatted} SUI
                                    </div>
                                </div>
                            ))}
                        </div>

                        {coinCount > 2 && (
                            <div className="text-center">
                                <Badge variant="outline">
                                    +{coinCount - 2} more coin{coinCount - 2 !== 1 ? 's' : ''}
                                </Badge>
                            </div>
                        )}

                        {/* Deposit Button */}
                        <DepositDialog
                            walletId={walletId}
                            onSuccess={() => {
                                // Could add success callback here
                            }}
                        >
                            <Button className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Deposit to Wallet
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Button>
                        </DepositDialog>

                        {/* Success Message */}
                        {hasWalletBalance && (
                            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                    Wallet is funded and ready for transactions!
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};