// Updated src/pages/HomePage.tsx with correct proposal count

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Wallet,
  Shield,
  Users,
  Zap,
  ArrowRight,
  CheckCircle,
  FileText
} from 'lucide-react';
import { WalletConnection } from '../components/features/wallet/WalletConnection';
import { useWalletAdapter } from '../hooks/useWalletAdapter';
import { useUserWalletsFromEvents } from '../api/hooks/useUserWallets';
import { useWalletStore } from '../store/walletStore';
import { getCurrentNetworkConfig } from '../config/sui-client';

const HomePage: React.FC = () => {
  const { connected } = useWalletAdapter();
  const networkConfig = getCurrentNetworkConfig();

  // Fetch user wallets to get accurate count
  const { data: userWallets = [], isLoading: walletsLoading } = useUserWalletsFromEvents();

  // Calculate total active proposals across all wallets
  const activeProposals = useMemo(() => {
    let total = 0;

    // If we have wallets, check each one for proposals
    if (userWallets.length > 0) {
      userWallets.forEach(wallet => {
        // Use the store to get proposals for this wallet
        const walletProposals = useWalletStore.getState().getWalletProposals(wallet.objectId);

        // Count only pending proposals (ones that haven't reached required approvals)
        const pendingProposals = walletProposals.filter(
          proposal => proposal.approvals.length < (wallet.requiredApprovals || 0)
        );

        total += pendingProposals.length;
      });
    }

    return total;
  }, [userWallets]);

  // Calculate stats
  const totalWallets = userWallets.length;
  const networkName = networkConfig.name || 'Testnet';

  const features = [
    {
      icon: Shield,
      title: 'Multi-Signature Security',
      description: 'Advanced multi-owner wallet with customizable approval requirements and spending limits.',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Add multiple owners, set individual spending limits, and manage permissions efficiently.',
    },
    {
      icon: Zap,
      title: 'Smart Spending Limits',
      description: 'Automatic spending limits that reset over time, with multi-sig approval for larger transactions.',
    },
  ];

  const benefits = [
    'Secure multi-signature wallet infrastructure',
    'Customizable spending policies per owner',
    'Time-based spending limit resets',
    'Transaction proposal and approval system',
    'Built on Sui blockchain for fast, low-cost transactions',
    'Open source and fully auditable smart contracts',
  ];

  if (connected) {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Welcome to Suizen
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your advanced multi-signature wallet is ready to use
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/wallet">
                <Wallet className="mr-2 h-5 w-5" />
                View Wallets
              </Link>
            </Button>

            <Button variant="outline" size="lg" asChild>
              <Link to="/wallet/create">
                Create New Wallet
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {walletsLoading ? '...' : totalWallets}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalWallets === 0
                  ? 'Create your first wallet to get started'
                  : `${totalWallets} multi-signature wallet${totalWallets === 1 ? '' : 's'}`
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProposals}</div>
              <p className="text-xs text-muted-foreground">
                {activeProposals === 0
                  ? 'No pending proposals'
                  : `${activeProposals} proposal${activeProposals === 1 ? '' : 's'} awaiting approval`
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {networkName.charAt(0).toUpperCase() + networkName.slice(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Connected to {networkName}
                {networkName.toLowerCase() === 'testnet' && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Test Network
                  </Badge>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity or Quick Actions */}
        {totalWallets > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for your multi-signature wallets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" asChild>
                  <Link to="/wallet/create">
                    <Wallet className="mr-2 h-4 w-4" />
                    Create New Wallet
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/wallet">
                    <FileText className="mr-2 h-4 w-4" />
                    View Proposals
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/wallet">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Owners
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            Built on Sui Blockchain
          </Badge>

          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Advanced Multi-Signature
            <span className="text-primary block mt-2">Wallet for Sui</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Secure, flexible, and powerful multi-owner wallet with custom spending policies,
            time-based limits, and advanced governance features for teams and organizations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <WalletConnection />

            <Button variant="outline" size="lg" asChild>
              <Link to="#features">
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Open Source
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Audited Smart Contracts
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Zero Fees
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need for secure multi-signature wallet management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Suizen?</h2>
            <p className="text-lg text-muted-foreground">
              Built for teams that need secure, flexible wallet management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 text-primary-foreground/80">
            Connect your wallet and create your first multi-signature wallet in minutes
          </p>

          <WalletConnection />
        </div>
      </section>
    </div>
  );
};

export default HomePage;