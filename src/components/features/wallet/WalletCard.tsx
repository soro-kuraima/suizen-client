import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Wallet, Users, Clock, ArrowRight } from 'lucide-react';
import { MultiOwnerWallet } from '../../../types/wallet';
import { MIST_PER_SUI } from '../../../constants/sui';

interface WalletCardProps {
    wallet: MultiOwnerWallet;
    isActive?: boolean;
    onSelect: (walletId: string) => void;
    onView?: (walletId: string) => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
    wallet,
    isActive = false,
    onSelect,
    onView,
}) => {
    const balanceInSui = (parseFloat(wallet.balance) / MIST_PER_SUI).toFixed(4);
    const resetPeriodDays = Math.floor(parseInt(wallet.resetPeriodMs) / (24 * 60 * 60 * 1000));

    return (
        <Card
            className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary border-primary' : ''
                }`}
            onClick={() => onSelect(wallet.id)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Wallet className="h-5 w-5" />
                        Multi-Owner Wallet
                    </CardTitle>
                    {isActive && <Badge variant="default">Active</Badge>}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Balance</p>
                        <p className="text-xl font-semibold">{balanceInSui} SUI</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Required Approvals</p>
                        <p className="text-lg font-medium">{wallet.requiredApprovals}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{wallet.owners.length} owners</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{resetPeriodDays}d reset</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        className="flex-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(wallet.id);
                        }}
                    >
                        {isActive ? 'Active' : 'Select'}
                    </Button>
                    {onView && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                onView(wallet.id);
                            }}
                        >
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};