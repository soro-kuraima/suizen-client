// store/walletStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  MultiOwnerWallet, 
  OwnerCapability, 
  TransactionProposal,
  WalletTransaction 
} from '../types/wallet';

interface WalletState {
  // Current user's wallets and capabilities
  userAddress: string | null;
  ownedCapabilities: OwnerCapability[];
  wallets: Record<string, MultiOwnerWallet>;
  
  // Active wallet
  activeWalletId: string | null;
  activeWallet: MultiOwnerWallet | null;
  
  // Proposals
  proposals: Record<string, TransactionProposal[]>;
  
  // Transactions
  transactions: Record<string, WalletTransaction[]>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUserAddress: (address: string | null) => void;
  setOwnedCapabilities: (capabilities: OwnerCapability[]) => void;
  addWallet: (wallet: MultiOwnerWallet) => void;
  updateWallet: (walletId: string, updates: Partial<MultiOwnerWallet>) => void;
  setActiveWallet: (walletId: string | null) => void;
  setProposals: (walletId: string, proposals: TransactionProposal[]) => void;
  addProposal: (walletId: string, proposal: TransactionProposal) => void;
  updateProposal: (walletId: string, proposalId: string, updates: Partial<TransactionProposal>) => void;
  setTransactions: (walletId: string, transactions: WalletTransaction[]) => void;
  addTransaction: (walletId: string, transaction: WalletTransaction) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearWalletData: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      userAddress: null,
      ownedCapabilities: [],
      wallets: {},
      activeWalletId: null,
      activeWallet: null,
      proposals: {},
      transactions: {},
      isLoading: false,
      error: null,

      // Actions
      setUserAddress: (address) => {
        set({ userAddress: address });
        if (!address) {
          // Clear user data when disconnecting
          get().clearWalletData();
        }
      },

      setOwnedCapabilities: (capabilities) => {
        set({ ownedCapabilities: capabilities });
      },

      addWallet: (wallet) => {
        set((state) => ({
          wallets: {
            ...state.wallets,
            [wallet.id]: wallet,
          },
        }));
      },

      updateWallet: (walletId, updates) => {
        set((state) => {
          const currentWallet = state.wallets[walletId];
          if (!currentWallet) return state;

          const updatedWallet = { ...currentWallet, ...updates };
          
          return {
            wallets: {
              ...state.wallets,
              [walletId]: updatedWallet,
            },
            activeWallet: state.activeWalletId === walletId ? updatedWallet : state.activeWallet,
          };
        });
      },

      setActiveWallet: (walletId) => {
        const state = get();
        const wallet = walletId ? state.wallets[walletId] : null;
        
        set({
          activeWalletId: walletId,
          activeWallet: wallet,
        });
      },

      setProposals: (walletId, proposals) => {
        set((state) => ({
          proposals: {
            ...state.proposals,
            [walletId]: proposals,
          },
        }));
      },

      addProposal: (walletId, proposal) => {
        set((state) => ({
          proposals: {
            ...state.proposals,
            [walletId]: [...(state.proposals[walletId] || []), proposal],
          },
        }));
      },

      updateProposal: (walletId, proposalId, updates) => {
        set((state) => {
          const currentProposals = state.proposals[walletId] || [];
          const updatedProposals = currentProposals.map(proposal =>
            proposal.id === proposalId ? { ...proposal, ...updates } : proposal
          );

          return {
            proposals: {
              ...state.proposals,
              [walletId]: updatedProposals,
            },
          };
        });
      },

      setTransactions: (walletId, transactions) => {
        set((state) => ({
          transactions: {
            ...state.transactions,
            [walletId]: transactions,
          },
        }));
      },

      addTransaction: (walletId, transaction) => {
        set((state) => ({
          transactions: {
            ...state.transactions,
            [walletId]: [transaction, ...(state.transactions[walletId] || [])],
          },
        }));
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearWalletData: () => {
        set({
          ownedCapabilities: [],
          wallets: {},
          activeWalletId: null,
          activeWallet: null,
          proposals: {},
          transactions: {},
          error: null,
        });
      },
    }),
    {
      name: 'wallet-store',
      partialize: (state) => ({
        userAddress: state.userAddress,
        wallets: state.wallets,
        activeWalletId: state.activeWalletId,
        // Don't persist capabilities, proposals, and transactions as they should be refreshed
      }),
    }
  )
);

// Selectors for computed values
export const useWalletSelectors = () => {
  const store = useWalletStore();
  
  return {
    ...store,
    
    // Get capabilities for active wallet
    activeWalletCapability: store.ownedCapabilities.find(
      cap => cap.walletId === store.activeWalletId
    ),
    
    // Get proposals for active wallet
    activeWalletProposals: store.activeWalletId 
      ? store.proposals[store.activeWalletId] || []
      : [],
    
    // Get transactions for active wallet
    activeWalletTransactions: store.activeWalletId
      ? store.transactions[store.activeWalletId] || []
      : [],
    
    // Check if user is owner of active wallet
    isActiveWalletOwner: Boolean(
      store.activeWalletId && 
      store.ownedCapabilities.some(cap => cap.walletId === store.activeWalletId)
    ),
    
    // Get wallet by ID
    getWalletById: (walletId: string) => store.wallets[walletId],
    
    // Get capability for specific wallet
    getCapabilityForWallet: (walletId: string) => 
      store.ownedCapabilities.find(cap => cap.walletId === walletId),
  };
};