import { isValidSuiAddress, normalizeSuiAddress } from '@mysten/sui/utils';
import { SuiObjectData, SuiObjectResponse } from '@mysten/sui/client';
import { COIN_TYPES } from '../constants/config';

/**
 * Utility functions for Sui blockchain operations
 */

/**
 * Convert SUI to MIST (smallest unit)
 */
export const suiToMist = (sui: string | number): string => {
  const suiAmount = typeof sui === 'string' ? parseFloat(sui) : sui;
  return Math.floor(suiAmount * 1_000_000_000).toString();
};

/**
 * Convert MIST to SUI
 */
export const mistToSui = (mist: string | number): string => {
  const mistAmount = typeof mist === 'string' ? parseInt(mist) : mist;
  return (mistAmount / 1_000_000_000).toString();
};

/**
 * Format SUI amount for display
 */
export const formatSuiAmount = (
  amount: string | number,
  decimals: number = 4,
  showSymbol: boolean = true
): string => {
  const suiAmount = typeof amount === 'string' ? parseFloat(mistToSui(amount)) : amount;
  const formatted = suiAmount.toFixed(decimals);
  return showSymbol ? `${formatted} SUI` : formatted;
};

/**
 * Validate and normalize Sui address
 */
export const validateAndNormalizeSuiAddress = (address: string): string | null => {
  try {
    if (!isValidSuiAddress(address)) {
      return null;
    }
    return normalizeSuiAddress(address);
  } catch (error) {
    console.error('Address validation error:', error);
    return null;
  }
};

/**
 * Shorten address for display
 */
export const shortenAddress = (address: string, chars: number = 4): string => {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Extract object data from SuiObjectResponse
 */
export const extractObjectData = <T = any>(response: SuiObjectResponse): T | null => {
  if (response.data?.content && 'fields' in response.data.content) {
    return response.data.content.fields as T;
  }
  return null;
};

/**
 * Parse move struct from object data
 */
export const parseMoveStruct = <T = any>(objectData: SuiObjectData): T | null => {
  if (objectData.content && 'fields' in objectData.content) {
    return objectData.content.fields as T;
  }
  return null;
};

/**
 * Check if object exists and is not deleted
 */
export const isObjectValid = (response: SuiObjectResponse): boolean => {
  return response.data !== null && response.data.content !== null;
};

/**
 * Get object ID from object reference
 */
export const getObjectId = (obj: SuiObjectData | { objectId: string }): string => {
  return 'objectId' in obj ? obj.objectId : obj.objectId;
};

/**
 * Convert timestamp to human readable date
 */
export const formatTimestamp = (timestamp: number, format: 'short' | 'long' | 'relative' = 'short'): string => {
  const date = new Date(timestamp);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'long':
      return date.toLocaleString();
    case 'relative':
      return getRelativeTime(timestamp);
    default:
      return date.toLocaleDateString();
  }
};

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

/**
 * Calculate spending limit reset time
 */
export const getNextResetTime = (lastReset: number, resetPeriodMs: number): number => {
  return lastReset + resetPeriodMs;
};

/**
 * Check if spending limit has reset
 */
export const hasSpendingLimitReset = (lastReset: number, resetPeriodMs: number): boolean => {
  const now = Date.now();
  return now >= getNextResetTime(lastReset, resetPeriodMs);
};

/**
 * Calculate remaining time until reset
 */
export const getTimeUntilReset = (lastReset: number, resetPeriodMs: number): number => {
  const nextReset = getNextResetTime(lastReset, resetPeriodMs);
  const now = Date.now();
  return Math.max(0, nextReset - now);
};

/**
 * Format duration in milliseconds to human readable string
 */
export const formatDuration = (durationMs: number): string => {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Parse coin balance from object
 */
export const parseCoinBalance = (coinObject: any): { balance: string; coinType: string } => {
  if (coinObject?.content?.fields) {
    return {
      balance: coinObject.content.fields.balance || '0',
      coinType: coinObject.content.type || COIN_TYPES.SUI,
    };
  }
  return { balance: '0', coinType: COIN_TYPES.SUI };
};

/**
 * Create a delay promise
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, i);
        await delay(delayMs);
      }
    }
  }
  
  throw lastError!;
};

/**
 * Batch array into chunks
 */
export const batchArray = <T>(array: T[], size: number): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
};