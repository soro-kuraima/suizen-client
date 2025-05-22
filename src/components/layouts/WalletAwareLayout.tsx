import React from 'react';
import { MainLayout } from './MainLayout';
import { useWalletAdapter } from '../../hooks/useWalletAdapter';

interface WalletAwareLayoutProps {
  children: React.ReactNode;
}

export const WalletAwareLayout: React.FC<WalletAwareLayoutProps> = ({ children }) => {
  try {
    const { connected } = useWalletAdapter();
    return (
      <MainLayout showSidebar={connected}>
        {children}
      </MainLayout>
    );
  } catch (error) {
    // If wallet context is not available, show layout without sidebar
    console.log('Wallet context not available, showing basic layout');
    return (
      <MainLayout showSidebar={false}>
        {children}
      </MainLayout>
    );
  }
};