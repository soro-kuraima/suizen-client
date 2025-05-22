// api/hooks/useWallet.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../services/walletService';
import { useWalletStore } from '../../store/walletStore';
import { 
  CreateWalletParams, 
  WithdrawParams, 
  CreateProposalParams,
  MultiOwnerWallet,
  OwnerCapability,
  TransactionProposal,
  WalletTransaction
} from '../../types/wallet';

// Query keys
export const walletQueryKeys = {
  all: ['wallets'] as const,
  wallet: (id: string) => [...walletQueryKeys.all, 'wallet', id] as const,
  capabilities: (address: string) => [...walletQueryKeys.all, 'capabilities', address] as const,
  proposals: (walletId: string) => [...walletQueryKeys.all, 'proposals', walletId] as const,
  transactions: (walletId: string) => [...walletQueryKeys.all, 'transactions', walletId] as const,
};

// Get user's owned capabilities
export const useOwnerCapabilities = (userAddress: string | null) => {
  const { setOwnedCapabilities } = useWalletStore();
  
  return useQuery({
    queryKey: walletQueryKeys.capabilities(userAddress || ''),
    queryFn: async () => {
      if (!userAddress) return [];
      const response = await walletService.getOwnerCapabilities(userAddress);
      if (response.success) {
        setOwnedCapabilities(response.data);
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch capabilities');
    },
    enabled: Boolean(userAddress),
    staleTime: 30000, // 30 seconds
  });
};

// Get wallet details
export const useWallet = (walletId: string | null) => {
  const { addWallet, updateWallet } = useWalletStore();
  
  return useQuery({
    queryKey: walletQueryKeys.wallet(walletId || ''),
    queryFn: async () => {
      if (!walletId) return null;
      const response = await walletService.getWallet(walletId);
      if (response.success && response.data) {
        addWallet(response.data);
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch wallet');
    },
    enabled: Boolean(walletId),
    staleTime: 15000, // 15 seconds
  });
};

// Get wallet proposals
export const useWalletProposals = (walletId: string | null) => {
  const { setProposals } = useWalletStore();
  
  return useQuery({
    queryKey: walletQueryKeys.proposals(walletId || ''),
    queryFn: async () => {
      if (!walletId) return [];
      const response = await walletService.getProposals(walletId);
      if (response.success) {
        setProposals(walletId, response.data);
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch proposals');
    },
    enabled: Boolean(walletId),
    staleTime: 10000, // 10 seconds
  });
};

// Get wallet transactions
export const useWalletTransactions = (walletId: string | null, page: number = 1) => {
  const { setTransactions } = useWalletStore();
  
  return useQuery({
    queryKey: [...walletQueryKeys.transactions(walletId || ''), page],
    queryFn: async () => {
      if (!walletId) return { data: [], total: 0, page, limit: 20, hasMore: false };
      const response = await walletService.getWalletTransactions(walletId, page, 20);
      if (response.success) {
        if (page === 1) {
          setTransactions(walletId, response.data.data);
        }
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch transactions');
    },
    enabled: Boolean(walletId),
    staleTime: 30000, // 30 seconds
  });
};

// Mutations
export const useCreateWallet = () => {
  const queryClient = useQueryClient();
  const { userAddress, setError } = useWalletStore();
  
  return useMutation({
    mutationFn: async (params: CreateWalletParams) => {
      const response = await walletService.createWallet(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create wallet');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate capabilities query to refetch new wallet
      if (userAddress) {
        queryClient.invalidateQueries({ 
          queryKey: walletQueryKeys.capabilities(userAddress) 
        });
      }
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};

export const useDeposit = () => {
  const queryClient = useQueryClient();
  const { setError } = useWalletStore();
  
  return useMutation({
    mutationFn: async ({ walletId, amount }: { walletId: string; amount: string }) => {
      const response = await walletService.deposit(walletId, amount);
      if (!response.success) {
        throw new Error(response.error || 'Failed to deposit');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate wallet query to refetch updated balance
      queryClient.invalidateQueries({ 
        queryKey: walletQueryKeys.wallet(variables.walletId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: walletQueryKeys.transactions(variables.walletId) 
      });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};

export const useWithdraw = () => {
  const queryClient = useQueryClient();
  const { setError } = useWalletStore();
  
  return useMutation({
    mutationFn: async ({ params, ownerCapId }: { params: WithdrawParams; ownerCapId: string }) => {
      const response = await walletService.withdraw(params, ownerCapId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to withdraw');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate wallet query to refetch updated balance
      queryClient.invalidateQueries({ 
        queryKey: walletQueryKeys.wallet(variables.params.walletId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: walletQueryKeys.transactions(variables.params.walletId) 
      });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};

export const useCreateProposal = () => {
  const queryClient = useQueryClient();
  const { setError } = useWalletStore();
  
  return useMutation({
    mutationFn: async ({ params, ownerCapId }: { params: CreateProposalParams; ownerCapId: string }) => {
      const response = await walletService.createProposal(params, ownerCapId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create proposal');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate proposals query to refetch with new proposal
      queryClient.invalidateQueries({ 
        queryKey: walletQueryKeys.proposals(variables.params.walletId) 
      });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};

export const useApproveProposal = () => {
  const queryClient = useQueryClient();
  const { setError } = useWalletStore();
  
  return useMutation({
    mutationFn: async ({ 
      walletId, 
      proposalId, 
      ownerCapId 
    }: { 
      walletId: string; 
      proposalId: string; 
      ownerCapId: string; 
    }) => {
      const response = await walletService.approveProposal(walletId, proposalId, ownerCapId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to approve proposal');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate proposals query to refetch updated proposal
      queryClient.invalidateQueries({ 
        queryKey: walletQueryKeys.proposals(variables.walletId) 
      });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};

export const useExecuteProposal = () => {
  const queryClient = useQueryClient();
  const { setError } = useWalletStore();
  
  return useMutation({
    mutationFn: async ({ 
      walletId, 
      proposalId, 
      ownerCapId 
    }: { 
      walletId: string; 
      proposalId: string; 
      ownerCapId: string; 
    }) => {
      const response = await walletService.executeProposal(walletId, proposalId, ownerCapId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to execute proposal');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate multiple queries
      queryClient.invalidateQueries({ 
        queryKey: walletQueryKeys.proposals(variables.walletId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: walletQueryKeys.wallet(variables.walletId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: walletQueryKeys.transactions(variables.walletId) 
      });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};

export const useAddOwner = () => {
  const queryClient = useQueryClient();
  const { setError } = useWalletStore();
  
  return useMutation({
    mutationFn: async ({ 
      walletId, 
      newOwner, 
      spendingLimit, 
      ownerCapId 
    }: { 
      walletId: string; 
      newOwner: string; 
      spendingLimit: string; 
      ownerCapId: string; 
    }) => {
      const response = await walletService.addOwner(walletId, newOwner, spendingLimit, ownerCapId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to add owner');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate wallet query to refetch updated owners
      queryClient.invalidateQueries({ 
        queryKey: walletQueryKeys.wallet(variables.walletId) 
      });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};

export const useUpdateSpendingLimit = () => {
  const queryClient = useQueryClient();
  const { setError } = useWalletStore();
  
  return useMutation({
    mutationFn: async ({ 
      walletId, 
      ownerToUpdate, 
      newLimit, 
      ownerCapId 
    }: { 
      walletId: string; 
      ownerToUpdate: string; 
      newLimit: string; 
      ownerCapId: string; 
    }) => {
      const response = await walletService.updateSpendingLimit(walletId, ownerToUpdate, newLimit, ownerCapId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update spending limit');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate wallet query to refetch updated limits
      queryClient.invalidateQueries({ 
        queryKey: walletQueryKeys.wallet(variables.walletId) 
      });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};