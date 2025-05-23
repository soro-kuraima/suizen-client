// Add this to your utils/wallet.ts or create a new debug.ts file

/**
 * Debug helpers for wallet operations
 */

export const debugWalletTransaction = (data: {
  walletId: string;
  amount: string;
  recipient: string;
  ownerCapId?: string;
  spendingRecord?: any;
  limitCheck?: any;
}) => {
  console.group('🔍 Wallet Transaction Debug');
  console.log('Wallet ID:', data.walletId);
  console.log('Amount:', data.amount, 'SUI');
  console.log('Recipient:', data.recipient);
  console.log('Owner Cap ID:', data.ownerCapId || 'Not found');
  
  if (data.spendingRecord) {
    console.log('Spending Record:', {
      spent: parseFloat(data.spendingRecord.spentAmount) / 1_000_000_000,
      limit: parseFloat(data.spendingRecord.spendingLimit) / 1_000_000_000,
      lastReset: new Date(data.spendingRecord.lastReset).toISOString(),
    });
  }
  
  if (data.limitCheck) {
    console.log('Limit Check:', {
      withinLimit: data.limitCheck.withinLimit,
      available: parseFloat(data.limitCheck.available),
      currentSpent: parseFloat(data.limitCheck.currentSpent),
    });
  }
  
  console.groupEnd();
};

/**
 * Parse Sui transaction errors into user-friendly messages
 */
export const parseTransactionError = (error: any): string => {
  console.error('Transaction Error:', error);
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    const message = error.message;
    
    // Check for specific Move error codes
    if (message.includes('ENotOwner') || message.includes('abort_code: 1')) {
      return 'You are not authorized as an owner of this wallet';
    }
    
    if (message.includes('EAmountExceedsLimit') || message.includes('abort_code: 2')) {
      return 'Amount exceeds your spending limit. Please create a proposal instead.';
    }
    
    if (message.includes('EInsufficientBalance') || message.includes('abort_code: 3')) {
      return 'Insufficient wallet balance for this transaction';
    }
    
    if (message.includes('EInvalidSetup') || message.includes('abort_code: 4')) {
      return 'Invalid wallet configuration';
    }
    
    if (message.includes('EOwnerAlreadyExists') || message.includes('abort_code: 5')) {
      return 'Owner already exists in this wallet';
    }
    
    if (message.includes('EOwnerDoesNotExist') || message.includes('abort_code: 6')) {
      return 'Owner does not exist in this wallet';
    }
    
    if (message.includes('EMultiSigRequired') || message.includes('abort_code: 7')) {
      return 'Multi-signature approval required for this transaction';
    }
    
    // Check for gas-related errors
    if (message.includes('gas')) {
      return 'Insufficient gas for transaction. Please try again.';
    }
    
    // Check for network errors
    if (message.includes('network') || message.includes('connection')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Return the original message if it's readable
    if (message.length < 200 && !message.includes('0x')) {
      return message;
    }
  }
  
  return 'Transaction failed. Please try again.';
};

/**
 * Validate transaction data before submission
 */
export const validateTransactionData = (data: {
  walletId: string;
  recipient: string;
  amount: string;
  ownerCapId?: string;
  walletBalance?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.walletId) {
    errors.push('Wallet ID is required');
  }
  
  if (!data.recipient) {
    errors.push('Recipient address is required');
  } else if (!validateAndNormalizeSuiAddress(data.recipient)) {
    errors.push('Invalid recipient address format');
  }
  
  if (!data.amount) {
    errors.push('Amount is required');
  } else {
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Amount must be greater than 0');
    }
    
    if (data.walletBalance) {
      const balance = parseFloat(data.walletBalance) / 1_000_000_000; // Convert MIST to SUI
      if (amount > balance) {
        errors.push(`Amount exceeds wallet balance (${balance.toFixed(4)} SUI)`);
      }
    }
  }
  
  if (!data.ownerCapId) {
    errors.push('Owner capability not found for this wallet');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Format transaction status for display
 */
export const formatTransactionStatus = (status: string): {
  label: string;
  color: string;
  icon: string;
} => {
  switch (status.toLowerCase()) {
    case 'success':
      return {
        label: 'Success',
        color: 'text-green-600 bg-green-100',
        icon: '✅',
      };
    case 'failed':
    case 'failure':
      return {
        label: 'Failed',
        color: 'text-red-600 bg-red-100',
        icon: '❌',
      };
    case 'pending':
      return {
        label: 'Pending',
        color: 'text-yellow-600 bg-yellow-100',
        icon: '⏳',
      };
    default:
      return {
        label: 'Unknown',
        color: 'text-gray-600 bg-gray-100',
        icon: '❓',
      };
  }
};

/**
 * Calculate time until spending limit reset
 */
export const calculateResetTime = (lastReset: number, resetPeriodMs: number): {
  timeUntilReset: number;
  resetDate: Date;
  isOverdue: boolean;
} => {
  const now = Date.now();
  const resetDate = new Date(lastReset + resetPeriodMs);
  const timeUntilReset = resetDate.getTime() - now;
  const isOverdue = timeUntilReset <= 0;
  
  return {
    timeUntilReset: Math.max(0, timeUntilReset),
    resetDate,
    isOverdue,
  };
};