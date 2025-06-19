import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Wallet, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import { useWalletAdapter } from '../../../hooks/useWalletAdapter';

// Popular Sui wallets with download links
const WALLET_DOWNLOAD_LINKS = {
  'Sui Wallet': {
    url: 'https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil',
    description: 'Official Sui Wallet by Mysten Labs'
  },
  'Suiet': {
    url: 'https://suiet.app/',
    description: 'Multi-chain wallet with Sui support'
  },
  'Ethos Wallet': {
    url: 'https://ethoswallet.xyz/',
    description: 'User-friendly Sui wallet'
  },
  'Martian Wallet': {
    url: 'https://martianwallet.xyz/',
    description: 'Multi-chain wallet supporting Sui'
  }
};

export const WalletConnection: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { 
    wallets,
    connect,
    connected,
    connecting,
    connectionStatus
  } = useWalletAdapter();

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setOpen(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // Error is already handled in the hook with toast
    }
  };

  if (connected) {
    return null; // Don't show connection button if already connected
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" disabled={connecting}>
          <Wallet className="mr-2 h-5 w-5" />
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to Suizen. Make sure you have a Sui-compatible wallet installed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Connection Status */}
          {connectionStatus === 'connecting' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connecting to wallet... Please check your wallet extension.
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === 'disconnected' && wallets.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No wallets detected. Please install a Sui-compatible wallet.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Detected Wallets */}
          {wallets.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Detected Wallets</h4>
              {wallets.map((wallet) => (
                <Card 
                  key={wallet.name} 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleConnect(wallet.name)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
                          {wallet.icon ? (
                            <img 
                              src={wallet.icon} 
                              alt={wallet.name} 
                              className="h-6 w-6 object-contain"
                            />
                          ) : (
                            <Wallet className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-sm">{wallet.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {wallet.accounts?.length || 0} account(s)
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="default" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
          
          {/* Available Wallets to Download */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {wallets.length > 0 ? 'More Wallets' : 'Available Wallets'}
            </h4>
            
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(WALLET_DOWNLOAD_LINKS).map(([walletName, info]) => {
                const isInstalled = wallets.some(w => w.name === walletName);
                
                return (
                  <Card key={walletName} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                          <Wallet className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{walletName}</div>
                          <div className="text-xs text-muted-foreground">
                            {info.description}
                          </div>
                        </div>
                      </div>
                      
                      {isInstalled ? (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Installed
                        </Badge>
                      ) : (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={info.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs"
                          >
                            Install
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
          
          {/* Help Section */}
          <div className="pt-4 border-t space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>First time using Sui?</strong><br />
                1. Install a wallet extension<br />
                2. Create or import your account<br />
                3. Make sure you're on the correct network (Testnet/Devnet)
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Need help? {' '}
                <a 
                  href="https://docs.sui.io/guides/developer/getting-started/sui-environment" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Read the Sui wallet setup guide
                </a>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};