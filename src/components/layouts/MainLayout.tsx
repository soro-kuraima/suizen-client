import React from 'react';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';

interface MainLayoutProps {
  children?: React.ReactNode;
  showSidebar?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, showSidebar = false }) => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - only show when specified */}
      {showSidebar && (
        <aside className="hidden md:flex md:w-64 md:flex-col">
          <Sidebar />
        </aside>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="border-b border-border bg-card">
          <TopNavigation />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};