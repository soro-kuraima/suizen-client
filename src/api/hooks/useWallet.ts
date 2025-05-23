/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { walletService } from '../services/walletService';
import { useWalletStore } from '../../store/walletStore';
import { useCurrentAddress } from '../../store/connectionStore';
import { useWalletAdapter } from '../../hooks/useWalletAdapter';
import { 
  CreateWalletRequest, 
  WithdrawRequest, 
  CreateProposalRequest, 
  AddOwnerRequest 
} from '../../types/wallet';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants/config';
import React from 'react';
import { formatSuiAmount, mistToSui } from '../../utils/sui';

// Query keys
export const WALLET_QUERY_KEYS = {
  wallets: ['wallets'] as const,
  wallet: (id: string) => ['wallet', id] as const,
  ownerCaps: (address: string) => ['ownerCaps', address] as const,
  proposals: (walletId: string) => ['proposals', walletId] as const,
  balances: (walletId: string) => ['balances', walletId] as const,
  transactions: (walletId: string) => ['transactions', walletId] as const,
  spendingRecords: (walletId: string, owner: string) => ['spendingRecords', walletId, owner] as const,
  userCoins: (address: string, coinType?: string) => ['userCoins', address, coinType] as const,
  userBalance: (address: string, coinType?: string) => ['userBalance', address, coinType] as const,
};

/**
 * Hook to fetch owner capabilities for current user
 */
export const useOwnerCapabilities = () => {
  const currentAddress = useCurrentAddress();
  const setOwnerCapabilities = useWalletStore((state) => state.setOwnerCapabilities);

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.ownerCaps(currentAddress || ''),
    queryFn: async () => {
      if (!currentAddress) return [];
      const caps = await walletService.getOwnerCapabilities(currentAddress);
      setOwnerCapabilities(currentAddress, caps);
      return caps;
    },
    enabled: !!currentAddress,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to fetch wallet details
 */
export const useWallet = (walletId: string) => {
  const updateWallet = useWalletStore((state) => state.updateWallet);

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.wallet(walletId),
    queryFn: async () => {
      const wallet = await walletService.getWallet(walletId);
      if (wallet) {
        updateWallet(walletId, wallet);
      }
      return wallet;
    },
    enabled: !!walletId,
    staleTime: 10000, // 10 seconds
  });
};

/**
 * Hook to fetch wallet proposals
 */
export const useWalletProposals = (walletId: string) => {
  const setProposals = useWalletStore((state) => state.setProposals);

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.proposals(walletId),
    queryFn: async () => {
      const proposals = await walletService.getTransactionProposals(walletId);
      setProposals(proposals);
      return proposals;
    },
    enabled: !!walletId,
    staleTime: 15000, // 15 seconds
  });
};

/**
 * Hook to fetch wallet balances
 */
export const useWalletBalances = (walletId: string) => {
  const setWalletBalances = useWalletStore((state) => state.setWalletBalances);

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.balances(walletId),
    queryFn: async () => {
      const balances = await walletService.getWalletBalances(walletId);
      setWalletBalances(walletId, balances);
      return balances;
    },
    enabled: !!walletId,
    staleTime: 20000, // 20 seconds
  });
};

/**
 * Hook to fetch transaction history
 */
export const useTransactionHistory = (walletId: string) => {
  const setTransactionHistory = useWalletStore((state) => state.setTransactionHistory);

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.transactions(walletId),
    queryFn: async () => {
      const result = await walletService.getTransactionHistory(walletId);
      setTransactionHistory(walletId, result.transactions);
      return result;
    },
    enabled: !!walletId,
    staleTime: 30000, // 30 seconds
  });
};

// ===== Mutation Hooks =====

/**
 * Hook to create a new wallet
 */
export const useCreateWallet = () => {
  const queryClient = useQueryClient();
  const currentAddress = useCurrentAddress();
  const { signAndExecuteTransaction } = useWalletAdapter();
  const addWallet = useWalletStore((state) => state.addWallet);
  const setSelectedWallet = useWalletStore((state) => state.setSelectedWallet);
  const setOperationInProgress = useWalletStore((state) => state.setOperationInProgress);

  return useMutation({
    mutationFn: async (request: CreateWalletRequest) => {
      if (!currentAddress) throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      setOperationInProgress('Creating wallet...');
      
      const transaction = walletService.buildCreateWalletTransaction(request);
      const result = await signAndExecuteTransaction(transaction);
      
      return { result, request };
    },
    onSuccess: async (data) => {
      const { result, request } = data;
      
      try {
        // Extract wallet ID from transaction effects
        const walletId = extractWalletIdFromTransaction(result);
        
        if (walletId) {
          // Fetch the created wallet details
          const walletDetails = await walletService.getWallet(walletId);
          
          if (walletDetails) {
            // Add wallet to store
            addWallet(walletDetails);
            
            // Set as selected wallet
            setSelectedWallet(walletId);
            
            toast.success(SUCCESS_MESSAGES.WALLET_CREATED);
          } else {
            // Fallback: create a basic wallet object
            const mockWallet = {
              objectId: walletId,
              balance: '0',
              owners: request.initialOwners,
              requiredApprovals: request.requiredApprovals,
              createdAt: Date.now(),
              resetPeriodMs: request.resetPeriodMs,
              version: '1',
              digest: result.digest,
            };
            addWallet(mockWallet);
            setSelectedWallet(walletId);
            toast.success(SUCCESS_MESSAGES.WALLET_CREATED);
          }
        } else {
          toast.success(SUCCESS_MESSAGES.WALLET_CREATED);
        }
      } catch (error) {
        console.error('Failed to fetch created wallet:', error);
        // Still show success since wallet was created
        toast.success(SUCCESS_MESSAGES.WALLET_CREATED);
      }
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallets });
      if (currentAddress) {
        queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.ownerCaps(currentAddress) });
      }
    },
    onError: (error) => {
      console.error('Create wallet error:', error);
      toast.error(error.message || ERROR_MESSAGES.TRANSACTION_FAILED);
    },
    onSettled: () => {
      setOperationInProgress(null);
    },
  });
};

/**
 * Extract wallet ID from transaction result
 */
function extractWalletIdFromTransaction(result: any): string | null {
  try {
    // Look for created objects in the transaction effects
    if (result?.effects?.created) {
      for (const created of result.effects.created) {
        // Look for the wallet object (usually the shared object)
        if (created.reference?.objectId) {
          return created.reference.objectId;
        }
      }
    }
    
    // Alternative: look in object changes
    if (result.objectChanges) {
      for (const change of result.objectChanges) {
        if (change.type === 'created' && change.objectType?.includes('Wallet')) {
          return change.objectId;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to extract wallet ID:', error);
    return null;
  }
}

/**
 * Hook to deposit coins to wallet
 */
export const useDepositToWallet = () => {
  const queryClient = useQueryClient();
  const currentAddress = useCurrentAddress();
  const { signAndExecuteTransaction } = useWalletAdapter();
  const setOperationInProgress = useWalletStore((state) => state.setOperationInProgress);

  return useMutation({
    mutationFn: async ({ walletId, coinObjectId }: { walletId: string; coinObjectId: string }) => {
      if (!currentAddress) throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      setOperationInProgress('Processing deposit...');
      
      const transaction = walletService.buildDepositTransaction(walletId, coinObjectId);
      const result = await signAndExecuteTransaction(transaction);
      return result;
    },
    onSuccess: (result, variables) => {
      toast.success('Deposit successful');
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet(variables.walletId) });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.balances(variables.walletId) });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.transactions(variables.walletId) });
      if (currentAddress) {
        queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.userCoins(currentAddress) });
        queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.userBalance(currentAddress) });
      }
    },
    onError: (error: any) => {
      console.error('Deposit error:', error);
      
      const errorMessage = ERROR_MESSAGES.TRANSACTION_FAILED;
      if (error.message?.includes('gas')) {
        toast.error('Insufficient gas for transaction. Please ensure you have enough SUI for gas fees.');
      } else if (error.message?.includes('object')) {
        toast.error('Invalid coin object. The coin may have been spent or doesn\'t exist.');
      } else if (error.message) {   
      toast.error(errorMessage);
      }
    },
    onSettled: () => {
      setOperationInProgress(null);
    },
  });
};

/**
 * Hook to deposit a specific amount (handles coin merging/splitting)
 */
export const useDepositAmount = () => {
  const queryClient = useQueryClient();
  const currentAddress = useCurrentAddress();
  const { signAndExecuteTransaction } = useWalletAdapter();
  const setOperationInProgress = useWalletStore((state) => state.setOperationInProgress);

  return useMutation({
    mutationFn: async ({ 
      walletId, 
      amount, 
      userCoins 
    }: { 
      walletId: string; 
      amount: string; 
      userCoins: Array<{ objectId: string; balance: string }>;
    }) => {
      if (!currentAddress) throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      setOperationInProgress('Processing amount deposit...');
      
      const transaction = walletService.buildDepositAmountTransaction(walletId, amount, userCoins);
      const result = await signAndExecuteTransaction(transaction);
      return result;
    },
    onSuccess: (result, variables) => {
      toast.success(`Successfully deposited ${variables.amount} SUI`);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet(variables.walletId) });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.balances(variables.walletId) });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.transactions(variables.walletId) });
      if (currentAddress) {
        queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.userCoins(currentAddress) });
        queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.userBalance(currentAddress) });
      }
    },
    onError: (error: any) => {
      console.error('Deposit amount error:', error);
      toast.error(error.message || ERROR_MESSAGES.TRANSACTION_FAILED);
    },
    onSettled: () => {
      setOperationInProgress(null);
    },
  });
};

/**
 * Enhanced hook to fetch user's coins with better typing
 */
export const useUserCoins = (coinType?: string) => {
  const currentAddress = useCurrentAddress();

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.userCoins(currentAddress || '', coinType),
    queryFn: async () => {
      if (!currentAddress) return [];
      return await walletService.getUserCoins(currentAddress, coinType);
    },
    enabled: !!currentAddress,
    staleTime: 15000, // 15 seconds
    refetchOnWindowFocus: true,
  });
};

/**
 * Enhanced hook to fetch user's total balance
 */
export const useUserBalance = (coinType?: string) => {
  const currentAddress = useCurrentAddress();

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.userBalance(currentAddress || '', coinType),
    queryFn: async () => {
      if (!currentAddress) return '0';
      return await walletService.getUserTotalBalance(currentAddress, coinType);
    },
    enabled: !!currentAddress,
    staleTime: 20000, // 20 seconds
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to check deposit feasibility
 */
export const useDepositFeasibility = (amount: string) => {
  const currentAddress = useCurrentAddress();

  return useQuery({
    queryKey: ['depositFeasibility', currentAddress, amount],
    queryFn: async () => {
      if (!currentAddress || !amount || parseFloat(amount) <= 0) return null;
      return await walletService.checkDepositFeasibility(currentAddress, amount);
    },
    enabled: !!currentAddress && !!amount && parseFloat(amount) > 0,
    staleTime: 10000, // 10 seconds
  });
};

/**
 * Hook to get user's SUI balance in a more convenient format
 */
export const useUserSuiBalance = () => {
  const { data: balance = '0', isLoading } = useUserBalance();
  const { data: coins = [], isLoading: coinsLoading } = useUserCoins();

  return React.useMemo(() => ({
    totalBalance: parseFloat(mistToSui(balance)),
    totalBalanceFormatted: formatSuiAmount(balance, 4, false),
    coinCount: coins.length,
    coins: coins.map(coin => ({
      ...coin,
      balanceInSui: parseFloat(mistToSui(coin.balance)),
      balanceFormatted: formatSuiAmount(coin.balance, 4, false),
    })),
    isLoading: isLoading || coinsLoading,
  }), [balance, coins, isLoading, coinsLoading]);
};

/**
 * Hook to estimate gas costs for deposit
 */
export const useDepositGasEstimate = (walletId: string, coinObjectId: string) => {
  return useQuery({
    queryKey: ['depositGasEstimate', walletId, coinObjectId],
    queryFn: async () => {
      if (!walletId || !coinObjectId) return '0';
      return await walletService.estimateDepositGas(walletId, coinObjectId);
    },
    enabled: !!walletId && !!coinObjectId,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to approve a proposal
 */
export const useApproveProposal = () => {
  const queryClient = useQueryClient();
  const currentAddress = useCurrentAddress();
  const { signAndExecuteTransaction } = useWalletAdapter();
  const setOperationInProgress = useWalletStore((state) => state.setOperationInProgress);

  return useMutation({
    mutationFn: async ({ walletId, proposalId, ownerCapId }: { 
      walletId: string; 
      proposalId: string; 
      ownerCapId: string; 
    }) => {
      if (!currentAddress) throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      setOperationInProgress('Approving proposal...');
      
      const transaction = walletService.buildApproveProposalTransaction(walletId, proposalId, ownerCapId);
      const result = await signAndExecuteTransaction(transaction);
      return result;
    },
    onSuccess: (result, variables) => {
      toast.success(SUCCESS_MESSAGES.PROPOSAL_APPROVED);
      // Invalidate proposals query
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.proposals(variables.walletId) });
    },
    onError: (error) => {
      console.error('Approve proposal error:', error);
      toast.error(error.message || ERROR_MESSAGES.TRANSACTION_FAILED);
    },
    onSettled: () => {
      setOperationInProgress(null);
    },
  });
};

/**
 * Hook to execute a proposal
 */
export const useExecuteProposal = () => {
  const queryClient = useQueryClient();
  const currentAddress = useCurrentAddress();
  const { signAndExecuteTransaction } = useWalletAdapter();
  const setOperationInProgress = useWalletStore((state) => state.setOperationInProgress);

  return useMutation({
    mutationFn: async ({ walletId, proposalId, ownerCapId }: { 
      walletId: string; 
      proposalId: string; 
      ownerCapId: string; 
    }) => {
      if (!currentAddress) throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      setOperationInProgress('Executing proposal...');
      
      const transaction = walletService.buildExecuteProposalTransaction(walletId, proposalId, ownerCapId);
      const result = await signAndExecuteTransaction(transaction);
      return result;
    },
    onSuccess: (result, variables) => {
      toast.success(SUCCESS_MESSAGES.PROPOSAL_EXECUTED);
      // Invalidate multiple queries
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.proposals(variables.walletId) });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet(variables.walletId) });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.balances(variables.walletId) });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.transactions(variables.walletId) });
    },
    onError: (error) => {
      console.error('Execute proposal error:', error);
      toast.error(error.message || ERROR_MESSAGES.TRANSACTION_FAILED);
    },
    onSettled: () => {
      setOperationInProgress(null);
    },
  });
};

/**
 * Hook to add owner
 */
export const useAddOwner = () => {
  const queryClient = useQueryClient();
  const currentAddress = useCurrentAddress();
  const { signAndExecuteTransaction } = useWalletAdapter();
  const setOperationInProgress = useWalletStore((state) => state.setOperationInProgress);

  return useMutation({
    mutationFn: async ({ request, ownerCapId }: { request: AddOwnerRequest; ownerCapId: string }) => {
      if (!currentAddress) throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      setOperationInProgress('Adding owner...');
      
      const transaction = walletService.buildAddOwnerTransaction(request, ownerCapId);
      const result = await signAndExecuteTransaction(transaction);
      return result;
    },
    onSuccess: (result, variables) => {
      toast.success(SUCCESS_MESSAGES.OWNER_ADDED);
      // Invalidate wallet query
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet(variables.request.walletId) });
    },
    onError: (error) => {
      console.error('Add owner error:', error);
      toast.error(error.message || ERROR_MESSAGES.TRANSACTION_FAILED);
    },
    onSettled: () => {
      setOperationInProgress(null);
    },
  });
};

/**
 * Hook to update spending limit
 */
export const useUpdateSpendingLimit = () => {
  const queryClient = useQueryClient();
  const currentAddress = useCurrentAddress();
  const { signAndExecuteTransaction } = useWalletAdapter();
  const setOperationInProgress = useWalletStore((state) => state.setOperationInProgress);

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
      if (!currentAddress) throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      setOperationInProgress('Updating spending limit...');
      
      const transaction = walletService.buildUpdateSpendingLimitTransaction(
        walletId, 
        ownerToUpdate, 
        newLimit, 
        ownerCapId
      );
      const result = await signAndExecuteTransaction(transaction);
      return result;
    },
    onSuccess: (result, variables) => {
      toast.success(SUCCESS_MESSAGES.LIMIT_UPDATED);
      // Invalidate spending records query
      queryClient.invalidateQueries({ 
        queryKey: WALLET_QUERY_KEYS.spendingRecords(variables.walletId, variables.ownerToUpdate) 
      });
    },
    onError: (error) => {
      console.error('Update spending limit error:', error);
      toast.error(error.message || ERROR_MESSAGES.TRANSACTION_FAILED);
    },
    onSettled: () => {
      setOperationInProgress(null);
    },
  });
};


// Add these new hooks to your useWallet.ts file

/**
 * Hook to fetch owner capabilities with wallet association
 */
export const useOwnerCapabilitiesWithWallets = () => {
  const currentAddress = useCurrentAddress();
  const setOwnerCapabilities = useWalletStore((state) => state.setOwnerCapabilities);

  return useQuery({
    queryKey: [WALLET_QUERY_KEYS.ownerCaps, 'withWallets', currentAddress],
    queryFn: async () => {
      if (!currentAddress) return [];
      const caps = await walletService.getOwnerCapabilitiesWithWallets(currentAddress);
      
      // Update store with just the cap IDs for backward compatibility
      const capIds = caps.map(cap => cap.capId);
      setOwnerCapabilities(currentAddress, capIds);
      
      return caps;
    },
    enabled: !!currentAddress,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to get owner capability for a specific wallet
 */
export const useOwnerCapabilityForWallet = (walletId: string) => {
  const currentAddress = useCurrentAddress();

  return useQuery({
    queryKey: [WALLET_QUERY_KEYS.ownerCaps, walletId, currentAddress],
    queryFn: async () => {
      if (!currentAddress || !walletId) return null;
      return await walletService.getOwnerCapabilityForWallet(currentAddress, walletId);
    },
    enabled: !!currentAddress && !!walletId,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to check spending limit for a transaction
 */
export const useSpendingLimitCheck = (walletId: string, amount: string) => {
  const currentAddress = useCurrentAddress();

  return useQuery({
    queryKey: ['spendingLimitCheck', walletId, currentAddress, amount],
    queryFn: async () => {
      if (!currentAddress || !walletId || !amount) return null;
      return await walletService.checkSpendingLimit(walletId, currentAddress, amount);
    },
    enabled: !!currentAddress && !!walletId && !!amount && parseFloat(amount) > 0,
    staleTime: 10000, // 10 seconds
  });
};

/**
 * Enhanced hook to fetch spending records with better error handling
 */
export const useSpendingRecords = (walletId: string, ownerAddress: string) => {
  return useQuery({
    queryKey: WALLET_QUERY_KEYS.spendingRecords(walletId, ownerAddress),
    queryFn: async () => {
      if (!walletId || !ownerAddress) return null;
      return await walletService.getOwnerSpendingRecord(walletId, ownerAddress);
    },
    enabled: !!walletId && !!ownerAddress,
    staleTime: 15000, // 15 seconds
    retry: (failureCount, error) => {
      // Don't retry if it's a "not found" error
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        if (message.includes('not found') || message.includes('does not exist')) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
};

/**
 * Hook to get wallet balance in SUI (converted from MIST)
 */
export const useWalletBalanceInSui = (walletId: string) => {
  const { data: wallet } = useWallet(walletId);
  
  return React.useMemo(() => {
    if (!wallet?.balance) return 0;
    return parseFloat(wallet.balance) / 1_000_000_000; // Convert MIST to SUI
  }, [wallet?.balance]);
};

/**
 * Enhanced withdraw mutation with better error handling
 */
export const useWithdraw = () => {
  const queryClient = useQueryClient();
  const currentAddress = useCurrentAddress();
  const { signAndExecuteTransaction } = useWalletAdapter();
  const setOperationInProgress = useWalletStore((state) => state.setOperationInProgress);

  return useMutation({
    mutationFn: async ({ request, ownerCapId }: { request: WithdrawRequest; ownerCapId: string }) => {
      if (!currentAddress) throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      setOperationInProgress('Processing withdrawal...');
      
      // First check if the withdrawal is within spending limits
      const limitCheck = await walletService.checkSpendingLimit(
        request.walletId, 
        currentAddress, 
        request.amount
      );
      
      if (!limitCheck.withinLimit) {
        throw new Error(`Amount exceeds spending limit. Available: ${limitCheck.available} SUI`);
      }
      
      const transaction = walletService.buildWithdrawTransaction(request, ownerCapId);
      const result = await signAndExecuteTransaction(transaction);
      return result;
    },
    onSuccess: (result, variables) => {
      toast.success(SUCCESS_MESSAGES.TRANSACTION_SENT);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet(variables.request.walletId) });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.balances(variables.request.walletId) });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.transactions(variables.request.walletId) });
      if (currentAddress) {
        queryClient.invalidateQueries({ 
          queryKey: WALLET_QUERY_KEYS.spendingRecords(variables.request.walletId, currentAddress) 
        });
      }
    },
    onError: (error: any) => {
      console.error('Withdraw error:', error);
      
      // Parse specific error messages
      const errorMessage = ERROR_MESSAGES.TRANSACTION_FAILED;
      if (error.message?.includes('EAmountExceedsLimit')) {
        toast.error('Amount exceeds your spending limit. Please create a proposal instead.');
      } else if (error.message?.includes('EInsufficientBalance')) {
        toast.error('Insufficient wallet balance');
      } else if (error.message?.includes('ENotOwner')) {
        toast.error('You are not authorized to perform this action');
      } else if (error.message) {
        toast.error(errorMessage);
      }
      
    },
    onSettled: () => {
      setOperationInProgress(null);
    },
  });
};

/**
 * Enhanced create proposal mutation
 */
export const useCreateProposal = () => {
  const queryClient = useQueryClient();
  const currentAddress = useCurrentAddress();
  const { signAndExecuteTransaction } = useWalletAdapter();
  const setOperationInProgress = useWalletStore((state) => state.setOperationInProgress);

  return useMutation({
    mutationFn: async ({ request, ownerCapId }: { request: CreateProposalRequest; ownerCapId: string }) => {
      if (!currentAddress) throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      setOperationInProgress('Creating proposal...');
      
      const transaction = walletService.buildCreateProposalTransaction(request, ownerCapId);
      const result = await signAndExecuteTransaction(transaction);
      return result;
    },
    onSuccess: (result, variables) => {
      toast.success(SUCCESS_MESSAGES.PROPOSAL_CREATED);
      // Invalidate proposals query
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.proposals(variables.request.walletId) });
    },
    onError: (error: any) => {
      console.error('Create proposal error:', error);
      
      const errorMessage = ERROR_MESSAGES.TRANSACTION_FAILED;
      if (error.message?.includes('EInsufficientBalance')) {
        toast.error('Insufficient wallet balance');
      } else if (error.message?.includes('ENotOwner')) {
        toast.error('You are not authorized to perform this action');
      } else if (error.message) {
        toast.error(errorMessage);
      }
    },
    onSettled: () => {
      setOperationInProgress(null);
    },
  });
};