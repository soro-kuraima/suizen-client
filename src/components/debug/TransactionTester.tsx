import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useWalletAdapter } from '../../hooks/useWalletAdapter';
import { useOwnerCapabilitiesWithWallets, useSpendingRecords } from '../../api/hooks/useWallet';
import { walletService } from '../../api/services/walletService';
import { debugWalletTransaction, validateTransactionData } from '../../utils/debug';
import { toast } from 'sonner';

export const TransactionTester: React.FC = () => {
  const [walletId, setWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [testing, setTesting] = useState(false);
  
  const { currentAccount } = useWalletAdapter();
  const { data: ownerCaps } = useOwnerCapabilitiesWithWallets();
  const { data: spendingRecord } = useSpendingRecords(walletId, currentAccount?.address || '');

  const testTransaction = async () => {
    if (!currentAccount || !walletId || !amount || !recipient) {
      toast.error('Please fill in all fields');
      return;
    }

    setTesting(true);
    
    try {
      // Find owner capability for this wallet
      const ownerCap = ownerCaps?.find(cap => cap.walletId === walletId);
      
      if (!ownerCap) {
        toast.error('No owner capability found for this wallet');
        return;
      }

      // Get wallet data
      const wallet = await walletService.getWallet(walletId);
      
      // Check spending limit
      const limitCheck = await walletService.checkSpendingLimit(
        walletId,
        currentAccount.address,
        amount
      );

      // Validate transaction data
      const validation = validateTransactionData({
        walletId,
        recipient,
        amount,
        ownerCapId: ownerCap.capId,
        walletBalance: wallet?.balance,
      });

      if (!validation.isValid) {
        toast.error(`Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Debug output
      debugWalletTransaction({
        walletId,
        amount,
        recipient,
        ownerCapId: ownerCap.capId,
        spendingRecord,
        limitCheck,
      });

      // Show transaction preview
      toast.success(`Transaction validated! ${limitCheck.withinLimit ? 'Direct send' : 'Proposal'} possible`);
      
    } catch (error) {
      console.error('Test failed:', error);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const currentWalletCap = ownerCaps?.find(cap => cap.walletId === walletId);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Transaction Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Current Account</Label>
          <div className="text-sm text-muted-foreground">
            {currentAccount?.address || 'Not connected'}
          </div>
        </div>

        <div>
          <Label>Available Wallets</Label>
          <div className="space-y-1">
            {ownerCaps?.map((cap) => (
              <div key={cap.capId} className="flex items-center space-x-2">
                <Button
                  variant={walletId === cap.walletId ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWalletId(cap.walletId)}
                >
                  {cap.walletId.slice(0, 8)}...
                </Button>
                <Badge variant="outline">{cap.capId.slice(0, 8)}...</Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Wallet ID</Label>
          <Input
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div>
          <Label>Amount (SUI)</Label>
          <Input
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
          />
        </div>

        <div>
          <Label>Recipient</Label>
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
          />
        </div>

        {currentWalletCap && (
          <div className="space-y-2">
            <Label>Debug Info</Label>
            <div className="text-xs space-y-1">
              <div>Owner Cap: {currentWalletCap.capId.slice(0, 12)}...</div>
              {spendingRecord && (
                <>
                  <div>Spent: {parseFloat(spendingRecord.spentAmount) / 1e9} SUI</div>
                  <div>Limit: {parseFloat(spendingRecord.spendingLimit) / 1e9} SUI</div>
                </>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={testTransaction}
          disabled={testing || !walletId || !amount || !recipient}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test Transaction'}
        </Button>
      </CardContent>
    </Card>
  );
};