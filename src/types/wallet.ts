// types/wallet.ts
export interface WalletOwner {
  address: string;
  spendingLimit: string; // Using string for big numbers
  spentAmount: string;
  lastReset: string;
}

export interface MultiOwnerWallet {
  id: string;
  balance: string;
  owners: string[];
  requiredApprovals: number;
  createdAt: string;
  resetPeriodMs: string;
}

export interface OwnerCapability {
  id: string;
  walletId: string;
  owner: string;
}

export interface TransactionProposal {
  id: string;
  walletId: string;
  recipient: string;
  amount: string;
  approvals: string[];
  expiration?: string;
  creator: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'proposal_created' | 'proposal_executed';
  amount: string;
  sender: string;
  recipient?: string;
  timestamp: string;
  blockHeight: number;
  success: boolean;
}

export interface CreateWalletParams {
  initialOwners: string[];
  initialLimits: string[];
  requiredApprovals: number;
  resetPeriodMs: string;
}

export interface WithdrawParams {
  walletId: string;
  recipient: string;
  amount: string;
}

export interface CreateProposalParams {
  walletId: string;
  recipient: string;
  amount: string;
  expirationMs?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Sui-specific types
export interface SuiObjectRef {
  objectId: string;
  version: string;
  digest: string;
}

export interface WalletEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
  transactionDigest: string;
}