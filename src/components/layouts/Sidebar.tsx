// Updated src/components/layouts/Sidebar.tsx with removed navigation items

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Wallet,
  Home,
  Users,
  Settings,
  Plus
} from 'lucide-react';
import { useWalletStore } from '../../store/walletStore';
import { formatSuiAmount } from '../../utils/sui';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

// Removed Transactions and Proposals from mainNavItems
const mainNavItems: NavItem[] = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
  },
  {
    title: 'Wallets',
    href: '/wallet',
    icon: Wallet,
  },
];

const secondaryNavItems: NavItem[] = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

interface SidebarNavProps {
  items: NavItem[];
  title?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ items, title }) => {
  const location = useLocation();

  return (
    <div className="pb-4">
      {title && (
        <h4 className="mb-2 px-4 text-sm font-semibold tracking-tight text-muted-foreground">
          {title}
        </h4>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
              {
                'bg-accent text-accent-foreground': location.pathname === item.href,
                'text-muted-foreground': location.pathname !== item.href,
              }
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {item.badge}
              </Badge>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

const WalletList: React.FC = () => {
  const wallets = useWalletStore((state) => state.wallets);
  const selectedWalletId = useWalletStore((state) => state.selectedWalletId);
  const setSelectedWallet = useWalletStore((state) => state.setSelectedWallet);

  if (wallets.length === 0) {
    return (
      <div className="px-4 py-6">
        <Link
          to="/wallet/create"
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/25 px-4 py-6 text-sm text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Your First Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="px-2">
      <div className="flex items-center justify-between px-2 mb-2">
        <h4 className="text-sm font-semibold tracking-tight text-muted-foreground">
          My Wallets
        </h4>
        <Link
          to="/wallet/create"
          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <Plus className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-1">
        {wallets.map((wallet) => (
          <button
            key={wallet.objectId}
            onClick={() => setSelectedWallet(wallet.objectId)}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
              {
                'bg-accent text-accent-foreground': selectedWalletId === wallet.objectId,
                'text-muted-foreground': selectedWalletId !== wallet.objectId,
              }
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 truncate">
              <div className="truncate text-sm font-medium">
                Multi-Sig Wallet
              </div>
              <div className="text-xs text-muted-foreground">
                {formatSuiAmount(wallet.balance, 2, false)} SUI
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {wallet.owners?.length || 0} owners
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-card">
      <div className="p-1">
        <img className='h-32' src='/logo.png' />
      </div>

      <div className="flex-1 overflow-auto px-2">
        {/* Main Navigation */}
        <SidebarNav items={mainNavItems} />

        <Separator className="my-4" />

        {/* Wallet List */}
        <WalletList />

        <Separator className="my-4" />

        {/* Secondary Navigation */}
        <SidebarNav items={secondaryNavItems} />
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="text-xs text-muted-foreground">
          Suizen Wallet v1.0.0
        </div>
      </div>
    </div>
  );
};