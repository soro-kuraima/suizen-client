import React from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Separator } from '../../ui/separator';
import { 
  CheckCircle2, 
  ArrowLeft, 
  Wallet, 
  Users, 
  Shield, 
  Clock,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import { shortenAddress, formatSuiAmount } from '../../../utils/sui';
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';

interface ReviewAndConfirmProps {
  data: {
    walletName: string;
    description: string;
    requiredApprovals: number;
    resetPeriodMs: number;
    owners: Array<{
      address: string;
      name: string;
      spendingLimit: string;
    }>;
  };
  onConfirm: () => void;
  onPrev: () => void;
  isLoading: boolean;
}

const RESET_PERIOD_LABELS: Record<number, string> = {
  [60 * 60 * 1000]: '1 Hour',
  [6 * 60 * 60 * 1000]: '6 Hours',
  [12 * 60 * 60 * 1000]: '12 Hours',
  [24 * 60 * 60 * 1000]: '24 Hours',
  [7 * 24 * 60 * 60 * 1000]: '7 Days',
  [30 * 24 * 60 * 60 * 1000]: '30 Days',
};

export const ReviewAndConfirm: React.FC<ReviewAndConfirmProps> = ({
  data,
  onConfirm,
  onPrev,
  isLoading,
}) => {
  const { currentAccount, packageAddress } = useWalletAdapter();
  
  const totalLimits = data.owners.reduce((sum, owner) => sum + parseFloat(owner.spendingLimit), 0);
  const resetPeriodLabel = RESET_PERIOD_LABELS[data.resetPeriodMs] || 'Custom';
  const securityLevel = data.requiredApprovals === 1 ? 'Basic' : data.requiredApprovals === 2 ? 'Standard' : 'High';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Review & Confirm
        </CardTitle>
        <CardDescription>
          Review your multi-owner wallet configuration before deployment
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Wallet Overview */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{data.walletName}</h3>
              {data.description && (
                <p className="text-sm text-muted-foreground">{data.description}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Security Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Shield className="mr-2 h-4 w-4" />
            Security Configuration
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl font-bold">{data.requiredApprovals}</div>
              <div className="text-sm text-muted-foreground">Required Approvals</div>
              <Badge variant={securityLevel === 'High' ? 'default' : 'secondary'} className="mt-1">
                {securityLevel} Security
              </Badge>
            </div>
            
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl font-bold">{data.owners.length}</div>
              <div className="text-sm text-muted-foreground">Total Owners</div>
              <Badge variant="outline" className="mt-1">
                Multi-Signature
              </Badge>
            </div>
            
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl font-bold">{resetPeriodLabel}</div>
              <div className="text-sm text-muted-foreground">Reset Period</div>
              <Badge variant="outline" className="mt-1">
                Auto Reset
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Owners List */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Wallet Owners ({data.owners.length})
          </h4>
          
          <div className="space-y-3">
            {data.owners.map((owner, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {owner.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{owner.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {shortenAddress(owner.address)}
                    </div>
                  </div>
                  {currentAccount?.address === owner.address && (
                    <Badge variant="secondary">You</Badge>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="font-medium">{owner.spendingLimit} SUI</div>
                  <div className="text-sm text-muted-foreground">Spending Limit</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total Combined Limits:</span>
              <span className="font-bold">{totalLimits.toFixed(2)} SUI</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Key Features */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Zap className="mr-2 h-4 w-4" />
            Key Features
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Individual spending limits</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Automatic limit resets</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Multi-signature approvals</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Transaction proposals</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Owner management</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Configurable policies</span>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Important Notes:</div>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Each owner will receive an OwnerCap NFT to interact with the wallet</li>
                <li>Spending limits apply per owner, per reset period</li>
                <li>Multi-signature is required for transactions exceeding individual limits</li>
                <li>The wallet will be deployed to: {shortenAddress(packageAddress || '')}</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Transaction Cost */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-100">Deployment Cost</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Gas fee for contract deployment</div>
            </div>
            <Badge variant="outline" className="border-blue-300">
              ~0.02 SUI
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrev} disabled={isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="min-w-32"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              'Create Wallet'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};