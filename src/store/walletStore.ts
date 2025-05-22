import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  MultiOwnerWallet, 
  TransactionProposal, 
  WalletBalance, 
  TransactionRecord,
  WalletUIState,
  OwnerSpendingRecord,
} from '../types/wallet';

interface WalletState {
  // Core wallet data
  wallets: MultiOwnerWallet[];
  selectedWalletId: string | null;
  ownerCapabilities: Record<string, string[]>; // address -> capIds[]
  proposals: TransactionProposal[];
  balances: Record<string, WalletBalance[]>; // walletId -> balances
  spendingRecords: Record<string, OwnerSpendingRecord[]>; // walletId -> records
  transactionHistory: Record<string, TransactionRecord[]>; // walletId -> transactions

  // UI state
  uiState: WalletUIState;

  // Loading states
  isLoading: boolean;
  operationInProgress: string | null;

  // Actions
  setWallets: (wallets: MultiOwnerWallet[]) => void;
  addWallet: (wallet: MultiOwnerWallet) => void;
  updateWallet: (walletId: string, updates: Partial<MultiOwnerWallet>) => void;
  removeWallet: (walletId: string) => void;
  setSelectedWallet: (walletId: string | null) => void;
  
  setOwnerCapabilities: (address: string, capIds: string[]) => void;
  
  setProposals: (proposals: TransactionProposal[]) => void;
  addProposal: (proposal: TransactionProposal) => void;
  updateProposal: (proposalId: string, updates: Partial<TransactionProposal>) => void;
  removeProposal: (proposalId: string) => void;
  
  setWalletBalances: (walletId: string, balances: WalletBalance[]) => void;
  setSpendingRecords: (walletId: string, records: OwnerSpendingRecord[]) => void;
  setTransactionHistory: (walletId: string, transactions: TransactionRecord[]) => void;
  addTransaction: (walletId: string, transaction: TransactionRecord) => void;

  // UI state actions
  setUIState: (updates: Partial<WalletUIState>) => void;
  setLoading: (loading: boolean) => void;
  setOperationInProgress: (operation: string | null) => void;
  setError: (error: string | null) => void;

  // Computed getters
  getSelectedWallet: () => MultiOwnerWallet | null;
  getWalletProposals: (walletId: string) => TransactionProposal[];
  getWalletBalances: (walletId: string) => WalletBalance[];
  getWalletTransactions: (walletId: string) => TransactionRecord[];
  getSpendingRecords: (walletId: string) => OwnerSpendingRecord[];

  // Clear actions
  clearWalletData: () => void;
  reset: () => void;
}

const initialUIState: WalletUIState = {
  selectedWallet: null,
  isLoading: false,
  error: null,
  showCreateWallet: false,
  showSendTransaction: false,
  showProposals: false,
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      wallets: [],
      selectedWalletId: null,
      ownerCapabilities: {},
      proposals: [],
      balances: {},
      spendingRecords: {},
      transactionHistory: {},
      uiState: initialUIState,
      isLoading: false,
      operationInProgress: null,

      // Wallet actions
      setWallets: (wallets) => set({ wallets }),
      
      addWallet: (wallet) => set((state) => ({
        wallets: [...state.wallets, wallet],
      })),
      
      updateWallet: (walletId, updates) => set((state) => ({
        wallets: state.wallets.map(wallet =>
          wallet.objectId === walletId ? { ...wallet, ...updates } : wallet
        ),
      })),
      
      removeWallet: (walletId) => set((state) => ({
        wallets: state.wallets.filter(wallet => wallet.objectId !== walletId),
        selectedWalletId: state.selectedWalletId === walletId ? null : state.selectedWalletId,
      })),
      
      setSelectedWallet: (walletId) => set({ selectedWalletId: walletId }),

      // Owner capabilities
      setOwnerCapabilities: (address, capIds) => set((state) => ({
        ownerCapabilities: {
          ...state.ownerCapabilities,
          [address]: capIds,
        },
      })),

      // Proposal actions
      setProposals: (proposals) => set({ proposals }),
      
      addProposal: (proposal) => set((state) => ({
        proposals: [...state.proposals, proposal],
      })),
      
      updateProposal: (proposalId, updates) => set((state) => ({
        proposals: state.proposals.map(proposal =>
          proposal.objectId === proposalId ? { ...proposal, ...updates } : proposal
        ),
      })),
      
      removeProposal: (proposalId) => set((state) => ({
        proposals: state.proposals.filter(proposal => proposal.objectId !== proposalId),
      })),

      // Balance and transaction actions
      setWalletBalances: (walletId, balances) => set((state) => ({
        balances: {
          ...state.balances,
          [walletId]: balances,
        },
      })),
      
      setSpendingRecords: (walletId, records) => set((state) => ({
        spendingRecords: {
          ...state.spendingRecords,
          [walletId]: records,
        },
      })),
      
      setTransactionHistory: (walletId, transactions) => set((state) => ({
        transactionHistory: {
          ...state.transactionHistory,
          [walletId]: transactions,
        },
      })),
      
      addTransaction: (walletId, transaction) => set((state) => ({
        transactionHistory: {
          ...state.transactionHistory,
          [walletId]: [transaction, ...(state.transactionHistory[walletId] || [])],
        },
      })),

      // UI state actions
      setUIState: (updates) => set((state) => ({
        uiState: { ...state.uiState, ...updates },
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setOperationInProgress: (operation) => set({ operationInProgress: operation }),
      
      setError: (error) => set((state) => ({
        uiState: { ...state.uiState, error },
      })),

      // Computed getters
      getSelectedWallet: () => {
        const state = get();
        return state.wallets.find(wallet => wallet.objectId === state.selectedWalletId) || null;
      },
      
      getWalletProposals: (walletId) => {
        const state = get();
        return state.proposals.filter(proposal => proposal.walletId === walletId);
      },
      
      getWalletBalances: (walletId) => {
        const state = get();
        return state.balances[walletId] || [];
      },
      
      getWalletTransactions: (walletId) => {
        const state = get();
        return state.transactionHistory[walletId] || [];
      },
      
      getSpendingRecords: (walletId) => {
        const state = get();
        return state.spendingRecords[walletId] || [];
      },

      // Clear actions
      clearWalletData: () => set({
        wallets: [],
        selectedWalletId: null,
        proposals: [],
        balances: {},
        spendingRecords: {},
        transactionHistory: {},
      }),
      
      reset: () => set({
        wallets: [],
        selectedWalletId: null,
        ownerCapabilities: {},
        proposals: [],
        balances: {},
        spendingRecords: {},
        transactionHistory: {},
        uiState: initialUIState,
        isLoading: false,
        operationInProgress: null,
      }),
    }),
    {
      name: 'suizen-wallet-store',
      partialize: (state) => ({
        // Only persist essential data, not UI state
        wallets: state.wallets,
        selectedWalletId: state.selectedWalletId,
        ownerCapabilities: state.ownerCapabilities,
      }),
    }
  )
);

// Selector hooks for better performance
export const useSelectedWallet = () => useWalletStore((state) => state.getSelectedWallet());
export const useWalletProposals = (walletId: string) => useWalletStore((state) => state.getWalletProposals(walletId));
export const useWalletBalances = (walletId: string) => useWalletStore((state) => state.getWalletBalances(walletId));
export const useWalletTransactions = (walletId: string) => useWalletStore((state) => state.getWalletTransactions(walletId));
export const useUIState = () => useWalletStore((state) => state.uiState);
export const useIsLoading = () => useWalletStore((state) => state.isLoading);
export const useOperationInProgress = () => useWalletStore((state) => state.operationInProgress);