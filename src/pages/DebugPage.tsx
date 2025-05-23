import React from 'react';
import { TransactionTester } from '../components/debug/TransactionTester';
import { Button } from '../components/ui/button';
import { useWalletAdapter } from '../hooks/useWalletAdapter';
import { getCurrentNetworkConfig } from '../config/sui-client';

const DebugPage: React.FC = () => {
  const { currentAccount, connected } = useWalletAdapter();
  const networkConfig = getCurrentNetworkConfig();

  if (!connected) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Debug Tools</h1>
          <p className="text-muted-foreground">Please connect your wallet to use debug tools</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Debug Tools</h1>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div>Network: {networkConfig.name}</div>
          <div>Package: {networkConfig.packageAddress}</div>
          <div>Account: {currentAccount?.address}</div>
        </div>
      </div>

      <TransactionTester />
    </div>
  );
};

export default DebugPage;