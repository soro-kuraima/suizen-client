// utils/wallet.ts
import { MIST_PER_SUI } from '../constants/sui';

/**
 * Convert SUI amount to MIST (smallest unit)
 */
export const suiToMist = (suiAmount: string | number): string => {
  const amount = typeof suiAmount === 'string' ? parseFloat(suiAmount) : suiAmount;
  return (amount * MIST_PER_SUI).toString();
};

/**
 * Convert MIST amount to SUI
 */
export const mistToSui = (mistAmount: string | number): string => {
  const amount = typeof mistAmount === 'string' ? parseFloat(mistAmount) : mistAmount;
  return (amount / MIST_PER_SUI).toString();
};

/**
 * Format SUI amount for display
 */
export const formatSuiAmount = (amount: string | number, decimals: number = 4): string => {
  const suiAmount = typeof amount === 'string' ? 
    parseFloat(mistToSui(amount)) : 
    amount;
  return suiAmount.toFixed(decimals);
};

/**
 * Validate Sui address format
 */
export const isValidSuiAddress = (address: string): boolean => {
  // Sui addresses are 32 bytes (64 hex characters) with 0x prefix
  const suiAddressRegex = /^0x[a-fA-F0-9]{64}$/;
  return suiAddressRegex.test(address);
};

/**
 * Shorten address for display
 */
export const shortenAddress = (address: string, startLength: number = 6, endLength: number = 4): string => {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * Calculate time until reset based on last reset and period
 */
export const getTimeUntilReset = (lastReset: string, resetPeriodMs: string): number => {
  const lastResetTime = parseInt(lastReset);
  const period = parseInt(resetPeriodMs);
  const nextReset = lastResetTime + period;
  const now = Date.now();
  
  return Math.max(0, nextReset - now);
};

/**
 * Format time duration
 */
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Calculate spending percentage
 */
export const getSpendingPercentage = (spent: string, limit: string): number => {
  const spentAmount = parseFloat(spent);
  const limitAmount = parseFloat(limit);
  
  if (limitAmount === 0) return 0;
  return Math.min(100, (spentAmount / limitAmount) * 100);
};

/**
 * Check if amount exceeds spending limit
 */
export const exceedsSpendingLimit = (
  currentSpent: string, 
  newAmount: string, 
  limit: string
): boolean => {
  const spent = parseFloat(currentSpent);
  const amount = parseFloat(newAmount);
  const limitAmount = parseFloat(limit);
  
  return (spent + amount) > limitAmount;
};

/**
 * Get proposal status
 */
export const getProposalStatus = (
  approvals: string[], 
  requiredApprovals: number,
  expiration?: string
): 'pending' | 'approved' | 'expired' => {
  if (expiration && Date.now() > parseInt(expiration)) {
    return 'expired';
  }
  
  if (approvals.length >= requiredApprovals) {
    return 'approved';
  }
  
  return 'pending';
};

/**
 * Check if user has approved a proposal
 */
export const hasUserApproved = (approvals: string[], userAddress: string): boolean => {
  return approvals.includes(userAddress);
};

/**
 * Generate transaction type color
 */
export const getTransactionTypeColor = (type: string): string => {
  switch (type) {
    case 'deposit':
      return 'text-green-600 bg-green-100';
    case 'withdraw':
      return 'text-red-600 bg-red-100';
    case 'proposal_created':
    case 'proposal_executed':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Get relative time string
 */
export const getRelativeTime = (timestamp: string): string => {
  const now = Date.now();
  const time = parseInt(timestamp);
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

/**
 * Validate spending limit input
 */
export const validateSpendingLimit = (limit: string, balance: string): boolean => {
  const limitAmount = parseFloat(limit);
  const balanceAmount = parseFloat(mistToSui(balance));
  
  return limitAmount > 0 && limitAmount <= balanceAmount;
};

/**
 * Generate a unique transaction ID
 */
export const generateTransactionId = (): string => {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Parse error message from Sui transaction
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.code) {
    switch (error.code) {
      case 1:
        return 'Not authorized as wallet owner';
      case 2:
        return 'Amount exceeds spending limit';
      case 3:
        return 'Insufficient wallet balance';
      case 4:
        return 'Invalid wallet configuration';
      case 5:
        return 'Owner already exists';
      case 6:
        return 'Owner does not exist';
      case 7:
        return 'Multi-signature approval required';
      default:
        return 'Transaction failed';
    }
  }
  
  return 'any error occurred';
};