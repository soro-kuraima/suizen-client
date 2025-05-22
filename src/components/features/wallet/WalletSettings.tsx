import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { 
  Settings, 
  Users, 
  Shield, 
  Clock, 
  Plus,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import { useWallet } from '../../../api/hooks/useWallet';
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';
import { shortenAddress, formatDuration } from '../../../utils/sui';

interface WalletSettingsProps {
  walletId: string;
  mode: 'owners' | 'settings';
}

export const WalletSettings: React.FC<WalletSettingsProps> = ({ walletId, mode }) => {
  const { currentAccount } = useWalletAdapter();
  const { data: wallet, isLoading } = useWallet(walletId);

  if (isLoading || !wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const isOwner = wallet.owners?.includes(currentAccount?.address || '');

  if (mode === 'owners') {
    return (
      <div className="space-y-6">
        {/* Owners List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Wallet Owners
                </CardTitle>
                <CardDescription>
                  Manage who has access to this wallet
                </CardDescription>
              </div>
              
              {isOwner && (
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Owner
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {wallet.owners?.map((ownerAddress, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {ownerAddress.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="font-medium">
                        {ownerAddress === currentAccount?.address ? 'You' : `Owner ${index + 1}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {shortenAddress(ownerAddress)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Spending limit: 1.0 SUI {/* Mock data */}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {ownerAddress === currentAccount?.address && (
                      <Badge variant="secondary">You</Badge>
                    )}
                    
                    {isOwner && ownerAddress !== currentAccount?.address && (
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Multi-Sig Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Multi-Signature Settings
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-1">Required Approvals</div>
                <div className="text-2xl font-bold">{wallet.requiredApprovals}</div>
                <div className="text-sm text-muted-foreground">
                  of {wallet.owners?.length} owners
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-1">Security Level</div>
                <div className="text-2xl font-bold">
                  {wallet.requiredApprovals === 1 ? 'Basic' : 
                   wallet.requiredApprovals === 2 ? 'Standard' : 'High'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Multi-signature protection
                </div>
              </div>
            </div>
            
            {isOwner && (
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Update Approval Requirements
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Spending Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Spending Limits & Reset
          </CardTitle>
          <CardDescription>
            Configure automatic spending limit resets
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="font-medium mb-1">Reset Period</div>
              <div className="text-2xl font-bold">
                {formatDuration(wallet.resetPeriodMs || 86400000)}
              </div>
              <div className="text-sm text-muted-foreground">
                Spending limits reset automatically
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="font-medium mb-1">Next Reset</div>
              <div className="text-2xl font-bold">12h 30m</div>
              <div className="text-sm text-muted-foreground">
                Time until limits reset
              </div>
            </div>
          </div>
          
          {isOwner && (
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Update Reset Period
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Wallet Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Wallet Information
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Wallet ID:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {shortenAddress(wallet.objectId)}
              </code>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(wallet.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium">Network:</span>
              <Badge variant="outline">Sui Testnet</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                These actions cannot be undone. Please proceed with caution.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 space-y-2">
              <Button variant="destructive" size="sm" disabled>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Wallet Access
              </Button>
              <p className="text-xs text-muted-foreground">
                This feature is not yet implemented for security reasons
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};