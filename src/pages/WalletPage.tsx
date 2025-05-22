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

  // Set selected wallet from URL param (only once when component mounts or walletId changes)
  useEffect(() => {
    if (walletId) {
      setSelectedWallet(walletId);
    }
  }, [walletId, setSelectedWallet]);

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
      <div className="container mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to access the dashboard
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Wallet Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your multi-owner wallets and transactions
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/wallet/create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Wallet
          </Button>
          {selectedWallet && isOwner && (
            <Button onClick={() => setShowSendForm(true)}>
              <Send className="w-4 h-4 mr-2" />
              Send Transaction
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Wallet List Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <WalletList />
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          {selectedWallet ? (
            <div className="space-y-6">
              {/* Wallet Header */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Wallet className="w-6 h-6 text-primary" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">
                            Multi-Sig Wallet
                            {isOwner && <Badge variant="secondary">Owner</Badge>}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {shortenAddress(selectedWallet.objectId)}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleCopyWalletId}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleViewOnExplorer}
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {selectedWallet.owners?.length || 0} owners
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        {selectedWallet.requiredApprovals}-of-{selectedWallet.owners?.length || 0}
                      </div>
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto" />
                </div>
                <CardTitle className="text-xl mt-4">No Wallet Selected</CardTitle>
                <CardDescription className="text-center max-w-md">
                  Select a wallet from the sidebar or create a new one to get started
                </CardDescription>
              </CardContent>
              <div className="p-6 pt-0">
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/wallet/create')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Wallet
                </Button>
              </div>
            </Card>
          )}
        </motion.div>
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