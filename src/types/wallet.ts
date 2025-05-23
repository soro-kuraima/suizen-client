import { SuiObjectRef, SuiObjectData, ObjectOwner } from '@mysten/sui/client';

// Base wallet interfaces
export interface WalletBalance {
  coinType: string;
  balance: string;
  decimals: number;
  symbol: string;
  iconUrl?: string;
}

export interface TransactionRecord {
  digest: string;
  timestamp: number;
  sender: string;
  recipients: string[];
  amount: string;
  coinType: string;
  status: 'success' | 'failed' | 'pending';
  type: 'send' | 'receive' | 'multi_sig' | 'deposit';
  isMultiSig?: boolean; // NEW: Indicates if transaction required multi-sig approval
  functionName?: string;
}

// Multi-owner wallet specific types
export interface MultiOwnerWallet extends SuiObjectData {
  balance: string;
  owners: string[];
  requiredApprovals: number;
  createdAt: number;
  resetPeriodMs: number;
}

export interface OwnerSpendingRecord {
  owner: string;
  spentAmount: string;
  spendingLimit: string;
  lastReset: number;
}

export interface OwnerCap extends SuiObjectData {
  walletId: string;
  owner: ObjectOwner;
}

export interface TransactionProposal extends SuiObjectData {
  walletId: string;
  recipient: string;
  amount: string;
  approvals: string[];
  expiration?: number;
}

// Wallet creation and management types
export interface CreateWalletRequest {
  initialOwners: string[];
  initialLimits: string[];
  requiredApprovals: number;
  resetPeriodMs: number;
}

export interface WithdrawRequest {
  walletId: string;
  recipient: string;
  amount: string;
}

export interface CreateProposalRequest {
  walletId: string;
  recipient: string;
  amount: string;
  expirationMs?: number;
}

export interface AddOwnerRequest {
  walletId: string;
  newOwner: string;
  spendingLimit: string;
}

// UI State types
export interface WalletUIState {
  selectedWallet: MultiOwnerWallet | null;
  isLoading: boolean;
  error: string | null;
  showCreateWallet: boolean;
  showSendTransaction: boolean;
  showProposals: boolean;
}

// Network and connection types
export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  packageAddress: string;
  explorerUrl: string;
}

export type WalletConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WalletConnection {
  address: string | null;
  status: WalletConnectionStatus;
  walletName: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// Event types from smart contracts
export interface WalletCreatedEvent {
  walletId: string;
  creator: string;
  requiredApprovals: number;
  resetPeriodMs: number;
}

export interface CoinDepositedEvent {
  walletId: string;
  depositor: string;
  amount: string;
}

export interface CoinWithdrawnEvent {
  walletId: string;
  sender: string;
  recipient: string;
  amount: string;
  requiredMultiSig: boolean;
}

export interface ProposalCreatedEvent {
  proposalId: string;
  walletId: string;
  creator: string;
  recipient: string;
  amount: string;
}

export interface ProposalApprovedEvent {
  proposalId: string;
  approver: string;
}

export interface ProposalExecutedEvent {
  proposalId: string;
  walletId: string;
  recipient: string;
  amount: string;
}