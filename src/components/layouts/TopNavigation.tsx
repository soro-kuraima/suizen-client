import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Moon, Sun, Wallet, ChevronDown, Settings, LogOut, Copy } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { WalletConnection } from '../features/wallet/WalletConnection';
import { NetworkSelector } from '../features/wallet/NetworkSelector';
import { useWalletAdapter } from '../../hooks/useWalletAdapter';
import { shortenAddress } from '../../utils/sui';

export const TopNavigation: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const {
    connected,
    currentAccount,
    currentWallet,
    disconnect
  } = useWalletAdapter();

  const handleCopyAddress = async () => {
    if (currentAccount?.address) {
      await navigator.clipboard.writeText(currentAccount.address);
      toast.success('Address copied to clipboard');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-2">
      {/* Left side - Logo and title */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg text-primary-foreground">
            <img className='' src='/logo-text.png' />
          </div>
        </Link>

        {/* Network indicator */}
        {connected && (
          <div className="flex items-center space-x-2">
            <NetworkSelector />
          </div>
        )}
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9 p-0"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Wallet Connection */}
        {!connected ? (
          <WalletConnection />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {currentWallet?.name?.charAt(0) || 'W'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">
                  {shortenAddress(currentAccount?.address || '')}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">Connected to</p>
                <p className="text-xs text-muted-foreground">
                  {currentWallet?.name || 'any Wallet'}
                </p>
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleCopyAddress}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Address
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleDisconnect}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};