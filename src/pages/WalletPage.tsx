import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Wallet, 
  Plus, 
  Send, 
  FileText, 
  Settings, 
  Users,
  TrendingUp,
  Clock,
  Shield,
  Activity,
  Eye,
  Copy,
  ExternalLink
} from 'lucide-react';
import { WalletOverview } from '../components/features/wallet/WalletOverview';
import { WalletList } from '../components/features/wallet/WalletList';
import { SendTransactionForm } from '../components/features/wallet/SendTransactionForm';
import { ProposalList } from '../components/features/wallet/ProposalList';
import { WalletSettings } from '../components/features/wallet/WalletSettings';
import { TransactionHistory } from '../components/features/wallet/TransactionHistory';
import { useWalletStore, useSelectedWallet } from '../store/walletStore';
import { useWalletAdapter } from '../hooks/useWalletAdapter';
import { useOwnerCapabilities } from '../api/hooks/useWallet';
import { shortenAddress } from '../utils/sui';
import { toast } from 'sonner';

const WalletPage: React.FC = () => {
  const { walletId } = useParams<{ walletId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showSendForm, setShowSendForm] = useState(false);
  
  const { currentAccount } = useWalletAdapter();
  const selectedWallet = useSelectedWallet();
  const { setSelectedWallet } = useWalletStore();
  const { data: ownerCaps, isLoading: loadingCaps } = useOwnerCapabilities();

  // Set selected wallet from URL param
  useEffect(() => {
    if (walletId && walletId !== selectedWallet?.objectId) {
      setSelectedWallet(walletId);
    }
  }, [walletId, setSelectedWallet, selectedWallet]);

  // Update URL when wallet selection changes
  useEffect(() => {
    if (selectedWallet && walletId !== selectedWallet.objectId) {
      navigate(`/wallet/${selectedWallet.objectId}`, { replace: true });
    }
  }, [selectedWallet, navigate, walletId]);

  const handleCopyWalletId = () => {
    if (selectedWallet) {
      navigator.clipboard.writeText(selectedWallet.objectId);
      toast.success('Wallet ID copied to clipboard');
    }
  };

  const handleViewOnExplorer = () => {
    if (selectedWallet) {
      const explorerUrl = `https://explorer.sui.io/object/${selectedWallet.objectId}?network=testnet`;
      window.open(explorerUrl, '_blank');
    }
  };

  // Check if user is an owner of the selected wallet
  const isOwner = selectedWallet?.owners?.includes(currentAccount?.address || '') || false;
  const userOwnerCap = ownerCaps?.find(cap => 
    // Would need to check which wallet this cap belongs to
    true // Simplified for now
  );

  if (!currentAccount) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access the dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your multi-owner wallets and transactions
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => navigate('/wallet/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Wallet
          </Button>
          
          {selectedWallet && isOwner && (
            <Button onClick={() => setShowSendForm(true)}>
              <Send className="mr-2 h-4 w-4" />
              Send Transaction
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Wallet List Sidebar */}
        <div className="lg:col-span-1">
          <WalletList />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedWallet ? (
            <div className="space-y-6">
              {/* Wallet Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Wallet className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>Multi-Sig Wallet</span>
                          {isOwner && <Badge variant="secondary">Owner</Badge>}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <span>{shortenAddress(selectedWallet.objectId)}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleCopyWalletId}
                            className="h-4 w-4 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleViewOnExplorer}
                            className="h-4 w-4 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{selectedWallet.owners?.length || 0} owners</span>
                      </Badge>
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <Shield className="h-3 w-3" />
                        <span>{selectedWallet.requiredApprovals}-of-{selectedWallet.owners?.length || 0}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview" className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="proposals" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Proposals</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">History</span>
                  </TabsTrigger>
                  <TabsTrigger value="owners" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Owners</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="overview">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <WalletOverview walletId={selectedWallet.objectId} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="proposals">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ProposalList walletId={selectedWallet.objectId} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="history">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TransactionHistory walletId={selectedWallet.objectId} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="owners">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <WalletSettings 
                        walletId={selectedWallet.objectId} 
                        mode="owners"
                      />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="settings">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <WalletSettings 
                        walletId={selectedWallet.objectId} 
                        mode="settings"
                      />
                    </motion.div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardHeader>
                <div className="mx-auto h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <Wallet className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle>No Wallet Selected</CardTitle>
                <CardDescription>
                  Select a wallet from the sidebar or create a new one to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/wallet/create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Wallet
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Send Transaction Modal */}
      {showSendForm && selectedWallet && (
        <SendTransactionForm
          walletId={selectedWallet.objectId}
          isOpen={showSendForm}
          onClose={() => setShowSendForm(false)}
        />
      )}
    </div>
  );
};

export default WalletPage;